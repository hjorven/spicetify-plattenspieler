/// <reference types="react" />
/*
 * Plattenspieler – Spicetify Custom App
 *
 * No build step: plain React.createElement using the React instance that
 * Spicetify provides. Spicetify calls the global render() function when the
 * /plattenspieler page is opened.
 *
 * Some UI patterns (settings window as a portal with tabs, error boundary,
 * safe wrappers around Spicetify.ReactComponent, spotify:image URL normalization)
 * are inspired by "listening-stats" (MIT, https://github.com/HeadshotInteractive/listening-stats).
 */

const {
  React,
  React: { useState, useEffect, useRef, useCallback },
} = Spicetify;

const { createElement: el } = React;

const APP_VERSION = '0.3.0';
const REPO_URL = 'https://github.com/hjorven/spicetify-plattenspieler';
const STORAGE_KEY = 'plattenspieler:settings';
const LEGACY_THEME_KEY = 'plattenspieler-theme';
const REST_ANGLE = 80;

/* ────────────────────────────────────────────────────────────
 * Settings
 * ──────────────────────────────────────────────────────────── */

const THEMES = [
  { value: 'modern', label: 'Modern' },
  { value: '2000s', label: '2000s' },
  { value: 'spotify', label: 'Spotify' },
];

const RPM_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '33', label: '33⅓' },
  { value: '45', label: '45' },
  { value: '78', label: '78' },
];

/* Seconds per revolution */
const RPM_SECONDS = { '33': 1.8, '45': 1.333, '78': 0.769 };

const DEFAULT_SETTINGS = {
  theme: 'modern',
  rpm: 'auto',
  showVu: true,
  showInfo: true,
  clickToToggle: true,
};

function loadSettings() {
  const s = { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const k of Object.keys(DEFAULT_SETTINGS)) {
          if (typeof parsed[k] === typeof DEFAULT_SETTINGS[k]) s[k] = parsed[k];
        }
      }
    } else {
      /* Migrate from the old single theme key */
      const legacy = localStorage.getItem(LEGACY_THEME_KEY);
      if (legacy) s.theme = legacy;
    }
  } catch (e) { /* corrupt entry -> defaults */ }
  if (!THEMES.some((t) => t.value === s.theme)) s.theme = DEFAULT_SETTINGS.theme;
  if (!RPM_OPTIONS.some((r) => r.value === s.rpm)) s.rpm = DEFAULT_SETTINGS.rpm;
  return s;
}

function saveSettings(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

/* ────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────── */

function formatTime(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + (s % 60).toString().padStart(2, '0');
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/* spotify:image:<id> → https://i.scdn.co/image/<id> */
function normalizeImageUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (/^spotify:image:/i.test(s)) {
    const id = s.replace(/^spotify:image:/i, '');
    return id ? 'https://i.scdn.co/image/' + id : '';
  }
  return s;
}

function callSafe(fn, fallback) {
  try {
    const v = fn();
    return v === undefined || v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

/* Reads player state via the stable Spicetify getters and falls back to
 * Player.data when a getter is missing in a given Spicetify version. */
function readPlayer() {
  const P = Spicetify.Player;
  if (!P) return null;
  const data = P.data || {};
  const item = data.item || data.track;
  if (!item || !item.name) return null;

  const meta = item.metadata || {};
  const images = (item.album && item.album.images) || item.images || [];
  const albumArt = normalizeImageUrl(
    meta.image_xlarge_url || meta.image_large_url || (images[0] && images[0].url) || meta.image_url
  );

  const duration = callSafe(() => P.getDuration(), 0)
    || data.duration
    || (item.duration && item.duration.milliseconds)
    || 0;
  const position = callSafe(() => P.getProgress(), null);
  const isPlaying = callSafe(() => P.isPlaying(), null);

  return {
    albumArt: albumArt,
    trackName: item.name || '',
    artistName: (item.artists || []).map((a) => a.name).filter(Boolean).join(', ')
      || meta.artist_name || '',
    albumName: (item.album && item.album.name) || meta.album_title || '',
    isPlaying: isPlaying !== null ? !!isPlaying : !(data.isPaused || data.is_paused),
    duration: duration,
    position: position !== null ? position : (data.position || data.positionAsOfTimestamp || 0),
  };
}

/* Safe wrapper: Spicetify.ReactComponent.* does not exist in every version, and
 * rendering an undefined component type would crash the whole page. */
function Toggle(props) {
  const Native = Spicetify.ReactComponent && Spicetify.ReactComponent.Toggle;
  if (Native) return el(Native, { value: props.value, onSelected: props.onChange });
  return el('input', {
    type: 'checkbox',
    className: 'plattenspieler-checkbox',
    checked: props.value,
    onChange: (e) => props.onChange(e.currentTarget.checked),
  });
}

/* ────────────────────────────────────────────────────────────
 * Error Boundary
 * ──────────────────────────────────────────────────────────── */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error: error };
  }

  componentDidCatch(error, info) {
    console.error('[plattenspieler] Render error:', error, info && info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return el('div', { className: 'plattenspieler-error' },
      el('h2', null, 'Plattenspieler crashed'),
      el('pre', null, String(this.state.error && (this.state.error.stack || this.state.error.message))),
      el('button', {
        type: 'button',
        className: 'plattenspieler-btn',
        onClick: () => this.setState({ error: null }),
      }, 'Try again'),
    );
  }
}

/* ────────────────────────────────────────────────────────────
 * Einstellungs-Fenster
 * ──────────────────────────────────────────────────────────── */

const ICON_GEAR = 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.43-2.53a7.8 7.8 0 0 0 0-1.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.4 7.4 0 0 0-1.68-.97l-.36-2.54A.5.5 0 0 0 14.13 2h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.6.24-1.16.57-1.68.97l-2.39-.96a.5.5 0 0 0-.6.22L2.84 8.51a.5.5 0 0 0 .12.64l2.03 1.58a7.8 7.8 0 0 0 0 1.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.52.4 1.08.73 1.68.97l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.6-.24 1.16-.57 1.68-.97l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z';
const ICON_CLOSE = 'M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4Z';

function Icon(props) {
  return el('svg', { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'currentColor', 'aria-hidden': 'true' },
    el('path', { d: props.d }));
}

function SettingRow(props) {
  return el('div', { className: 'plattenspieler-setting-row' },
    el('div', null,
      el('div', { className: 'plattenspieler-setting-label' }, props.label),
      props.sublabel && el('div', { className: 'plattenspieler-setting-sublabel' }, props.sublabel),
    ),
    props.children,
  );
}

function OptionGroup(props) {
  return el('div', { className: 'plattenspieler-option-group', role: 'radiogroup', 'aria-label': props.label },
    props.options.map((o) => el('button', {
      key: o.value,
      type: 'button',
      role: 'radio',
      'aria-checked': props.value === o.value,
      className: 'plattenspieler-option' + (props.value === o.value ? ' plattenspieler-option-active' : ''),
      onClick: () => props.onChange(o.value),
    }, o.label)),
  );
}

const SETTINGS_TABS = [
  { id: 'display', label: 'Display' },
  { id: 'player', label: 'Turntable' },
  { id: 'about', label: 'About' },
];

function SettingsModal(props) {
  const { settings, onChange, onClose, theme } = props;
  const [tab, setTab] = useState('display');
  const dialogRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey, true);
    /* Move focus into the dialog and restore it on close */
    const prevFocus = document.activeElement;
    if (dialogRef.current) dialogRef.current.focus();
    return () => {
      window.removeEventListener('keydown', onKey, true);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
  }, [onClose]);

  function set(key, value) {
    onChange({ ...settings, [key]: value });
  }

  let body;
  if (tab === 'display') {
    body = el(React.Fragment, null,
      el(SettingRow, { label: 'Theme', sublabel: '"Spotify" follows the colors of your Spicetify theme.' },
        el(OptionGroup, { label: 'Theme', options: THEMES, value: settings.theme, onChange: (v) => set('theme', v) })),
      el(SettingRow, { label: 'Show track info', sublabel: 'Title, artist and progress bar below the turntable.' },
        el(Toggle, { value: settings.showInfo, onChange: (v) => set('showInfo', v) })),
      el(SettingRow, { label: 'Show VU meter', sublabel: 'Stereo level meter on the right side of the turntable.' },
        el(Toggle, { value: settings.showVu, onChange: (v) => set('showVu', v) })),
    );
  } else if (tab === 'player') {
    body = el(React.Fragment, null,
      el(SettingRow, { label: 'Speed (RPM)', sublabel: 'Auto: 78 below 2 min, 45 below 4 min, otherwise 33⅓.' },
        el(OptionGroup, { label: 'Speed', options: RPM_OPTIONS, value: settings.rpm, onChange: (v) => set('rpm', v) })),
      el(SettingRow, { label: 'Click record to play/pause', sublabel: 'Clicking the vinyl toggles playback.' },
        el(Toggle, { value: settings.clickToToggle, onChange: (v) => set('clickToToggle', v) })),
      el('div', { className: 'plattenspieler-setting-actions' },
        el('button', {
          type: 'button',
          className: 'plattenspieler-btn',
          onClick: () => onChange({ ...DEFAULT_SETTINGS }),
        }, 'Reset to defaults')),
    );
  } else {
    body = el('div', { className: 'plattenspieler-about' },
      el('p', null, el('strong', null, 'Plattenspieler'), ' – version ' + APP_VERSION),
      el('p', null, 'Shows the current album art as a spinning vinyl record with tonearm and VU meter.'),
      el('p', null, 'Keyboard: Space/Enter on the focused record = play/pause, arrow keys on the progress bar = seek 5 s, Esc = close this window.'),
      el('p', null, el('a', { href: REPO_URL, target: '_blank', rel: 'noopener noreferrer', className: 'plattenspieler-footer-link' }, 'Source code on GitHub')),
    );
  }

  const content = el('div', {
    className: 'plattenspieler-overlay plattenspieler-theme-' + theme,
    onMouseDown: (e) => { if (e.target === e.currentTarget) onClose(); },
  },
    el('div', {
      className: 'plattenspieler-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'plattenspieler-modal-title',
      tabIndex: -1,
      ref: dialogRef,
    },
      el('div', { className: 'plattenspieler-modal-header' },
        el('h2', { id: 'plattenspieler-modal-title', className: 'plattenspieler-modal-title' }, 'Settings'),
        el('button', { type: 'button', className: 'plattenspieler-icon-btn', onClick: onClose, 'aria-label': 'Close settings' },
          el(Icon, { d: ICON_CLOSE })),
      ),
      el('div', { className: 'plattenspieler-tabs', role: 'tablist' },
        SETTINGS_TABS.map((t) => el('button', {
          key: t.id,
          type: 'button',
          role: 'tab',
          'aria-selected': tab === t.id,
          className: 'plattenspieler-tab' + (tab === t.id ? ' plattenspieler-tab-active' : ''),
          onClick: () => setTab(t.id),
        }, t.label)),
      ),
      el('div', { className: 'plattenspieler-modal-body', role: 'tabpanel' }, body),
    ),
  );

  const ReactDOM = Spicetify.ReactDOM;
  return ReactDOM && ReactDOM.createPortal ? ReactDOM.createPortal(content, document.body) : content;
}

/* ────────────────────────────────────────────────────────────
 * Tonarm (SVG)
 * ──────────────────────────────────────────────────────────── */

function Tonearm(props) {
  const { length, height, angle, pivotX, pivotY } = props;
  const mid = height / 2;
  return el('div', {
    className: 'plattenspieler-tonearm',
    style: {
      transform: 'rotate(' + angle + 'deg)',
      transformOrigin: '0 ' + mid + 'px',
      left: pivotX + 'px',
      top: (pivotY - mid) + 'px',
      width: length + 'px',
      height: height + 'px',
    },
  },
    el('svg', { viewBox: '0 0 ' + length + ' ' + height, width: length, height: height },
      el('defs', null,
        el('linearGradient', { id: 'plattenspieler-armGrad', x1: '0', y1: '0', x2: '0', y2: '1' },
          el('stop', { offset: '0%', stopColor: '#c0c0c0' }),
          el('stop', { offset: '50%', stopColor: '#888' }),
          el('stop', { offset: '100%', stopColor: '#666' }),
        ),
        el('linearGradient', { id: 'plattenspieler-headGrad', x1: '0', y1: '0', x2: '0', y2: '1' },
          el('stop', { offset: '0%', stopColor: '#999' }),
          el('stop', { offset: '100%', stopColor: '#555' }),
        ),
        el('radialGradient', { id: 'plattenspieler-pivotGrad', cx: '40%', cy: '35%' },
          el('stop', { offset: '0%', stopColor: '#ddd' }),
          el('stop', { offset: '100%', stopColor: '#777' }),
        ),
        el('filter', { id: 'plattenspieler-shadow' },
          el('feDropShadow', { dx: '1', dy: '2', stdDeviation: '2', floodOpacity: '0.3' }),
        ),
      ),
      el('circle', { cx: '0', cy: mid, r: '10', fill: 'url(#plattenspieler-pivotGrad)', stroke: '#555', strokeWidth: '1' }),
      el('rect', { x: '8', y: mid - 2.5, width: length * 0.6, height: '5', rx: '2.5', fill: 'url(#plattenspieler-armGrad)' }),
      el('rect', { x: length * 0.6, y: mid - 7, width: length * 0.2, height: '14', rx: '3', fill: 'url(#plattenspieler-headGrad)', filter: 'url(#plattenspieler-shadow)' }),
      el('polygon', { points: (length * 0.8) + ',' + mid + ' ' + (length * 0.8 + 8) + ',' + (mid - 2) + ' ' + (length * 0.8 + 10) + ',' + (mid + 2), fill: '#777' }),
      el('rect', { x: '0', y: mid - 4, width: '16', height: '8', rx: '3', fill: 'url(#plattenspieler-pivotGrad)', stroke: '#555', strokeWidth: '0.5' }),
    ),
  );
}

/* ────────────────────────────────────────────────────────────
 * VU meter (own state, so the whole turntable does not re-render
 * 20 times per second)
 * ──────────────────────────────────────────────────────────── */

function findAnalyser() {
  try {
    const p = Spicetify.Player;
    if (!p) return null;
    const names = ['analyser', '_analyser', 'audioAnalyser', '_audioAnalyser'];
    for (const n of names) {
      if (p[n] && p[n].frequencyBinCount) return p[n];
    }
  } catch (e) { /* ignore */ }
  return null;
}

function VuMeter(props) {
  const { isPlaying, trackKey } = props;
  const [vu, setVu] = useState({ l: 0, r: 0, pl: 0, pr: 0 });
  const levels = useRef({ l: 0, r: 0, pl: 0, pr: 0 });
  const analyser = useRef(null);
  const tries = useRef(0);

  /* Reset on song change */
  useEffect(() => {
    levels.current = { l: 0, r: 0, pl: 0, pr: 0 };
    analyser.current = null;
    tries.current = 0;
    setVu({ l: 0, r: 0, pl: 0, pr: 0 });
  }, [trackKey]);

  useEffect(() => {
    let rafId;
    let last = 0;
    let buf = null;

    function getAnalyser() {
      if (!analyser.current) {
        tries.current++;
        if (tries.current < 600 || tries.current % 1200 === 0) analyser.current = findAnalyser();
      }
      return analyser.current;
    }

    function loop(time) {
      rafId = requestAnimationFrame(loop);
      const v = levels.current;

      if (isPlaying) {
        const a = getAnalyser();
        let lvlL, lvlR;
        if (a) {
          if (!buf || buf.length !== a.frequencyBinCount) buf = new Uint8Array(a.frequencyBinCount);
          try { a.getByteFrequencyData(buf); } catch (e) { return; }
          const half = buf.length >> 1;
          let sumL = 0, sumR = 0;
          for (let i = 0; i < half; i++) sumL += buf[i];
          for (let i = half; i < buf.length; i++) sumR += buf[i];
          lvlL = (sumL / half / 255) * 1.5;
          lvlR = (sumR / (buf.length - half) / 255) * 1.5;
        } else {
          /* Simulated beat when no analyser is available */
          const t = time * 0.001;
          const period = 0.4 + (t * 0.01) % 0.3;
          const energy = Math.sin(((t % period) / period) * Math.PI);
          lvlL = 0.08 + energy * 0.55 + Math.sin(t * 3.1) * 0.08 + (1 - energy) * Math.random() * 0.12;
          lvlR = 0.08 + energy * 0.5 + Math.sin(t * 2.8 + 0.7) * 0.08 + (1 - energy) * Math.random() * 0.12;
        }
        v.l = Math.max(clamp01(lvlL), v.l * 0.92);
        v.r = Math.max(clamp01(lvlR), v.r * 0.92);
        v.pl = Math.max(v.pl * 0.997, v.l);
        v.pr = Math.max(v.pr * 0.997, v.r);
      } else {
        v.l *= 0.88;
        v.r *= 0.88;
        v.pl *= 0.995;
        v.pr *= 0.995;
        if (v.l < 0.005 && v.r < 0.005 && v.pl < 0.005 && v.pr < 0.005) {
          v.l = v.r = v.pl = v.pr = 0;
          setVu({ l: 0, r: 0, pl: 0, pr: 0 });
          cancelAnimationFrame(rafId);
          return;
        }
      }

      if (time - last > 50) {
        last = time;
        setVu({ l: v.l, r: v.r, pl: v.pl, pr: v.pr });
      }
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  function bar(level, peak) {
    return el('div', { className: 'plattenspieler-vu' },
      el('div', { className: 'plattenspieler-vu-fill', style: { transform: 'scaleY(' + clamp01(level) + ')' } }),
      el('div', { className: 'plattenspieler-vu-peak', style: { bottom: clamp01(peak) * 100 + '%' } }),
    );
  }

  return el('div', { className: 'plattenspieler-vu-container', 'aria-hidden': 'true' },
    bar(vu.l, vu.pl),
    bar(vu.r, vu.pr),
  );
}

/* ────────────────────────────────────────────────────────────
 * Main component
 * ──────────────────────────────────────────────────────────── */

const EMPTY_TRACK = {
  albumArt: '', trackName: '', artistName: '', albumName: '',
  isPlaying: false, progress: 0, duration: 0, hasTrack: false, trackKey: '',
};

function RecordPlayer() {
  const turntableRef = useRef(null);
  const [settings, setSettingsState] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [track, setTrack] = useState(EMPTY_TRACK);
  const [geom, setGeom] = useState({ pivotX: 280, pivotY: 90, recordRadius: 140, baseAngle: 120, maxAngle: 145 });
  const [artFailed, setArtFailed] = useState(false);
  const hasTrackRef = useRef(false);
  hasTrackRef.current = track.hasTrack;

  const setSettings = useCallback((s) => {
    saveSettings(s);
    setSettingsState(s);
  }, []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  /* ── geometry (throttled via RAF) ── */
  useEffect(() => {
    let rafId = 0;
    function recalc() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const tt = turntableRef.current;
        if (!tt) return;
        const rect = tt.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        const recordWidth = Math.min(320, window.innerWidth * 0.55);
        const recordRadius = recordWidth / 2;
        const centerX = w * 0.36, centerY = h * 0.5;
        const pivotX = centerX + recordRadius + 12, pivotY = h * 0.18 + 20;
        const angleToCenter = Math.atan2(centerY - pivotY, centerX - pivotX) * (180 / Math.PI);
        setGeom({ pivotX, pivotY, recordRadius, baseAngle: angleToCenter - 35, maxAngle: angleToCenter - 2 });
      });
    }
    recalc();
    const ro = new ResizeObserver(recalc);
    if (turntableRef.current) ro.observe(turntableRef.current);
    window.addEventListener('resize', recalc);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', recalc);
    };
  }, []);

  /* ── player events ── */
  useEffect(() => {
    const P = Spicetify.Player;

    function update() {
      const info = readPlayer();
      if (!info) {
        setTrack((t) => (t.hasTrack ? { ...t, hasTrack: false, isPlaying: false } : t));
        return;
      }
      const key = info.trackName + '|' + info.artistName + '|' + info.duration;
      setTrack({
        albumArt: info.albumArt,
        trackName: info.trackName,
        artistName: info.artistName,
        albumName: info.albumName,
        isPlaying: info.isPlaying,
        duration: info.duration,
        progress: info.duration > 0 ? clamp01(info.position / info.duration) : 0,
        hasTrack: true,
        trackKey: key,
      });
    }

    function onSongChange() {
      setArtFailed(false);
      update();
    }

    function onPlayPause() {
      const playing = callSafe(() => P.isPlaying(), null);
      if (playing === null) update();
      else setTrack((t) => ({ ...t, isPlaying: !!playing }));
    }

    function onProgress(e) {
      const duration = callSafe(() => P.getDuration(), 0) || (P.data && P.data.duration) || 0;
      if (duration <= 0) return;
      const pos = typeof e.data === 'number' ? e.data : callSafe(() => P.getProgress(), 0);
      if (!hasTrackRef.current) {
        /* Page opened before Spotify was ready: read everything once */
        update();
        return;
      }
      setTrack((t) => ({ ...t, progress: clamp01(pos / duration), duration: duration }));
    }

    update();
    if (!P || !P.addEventListener) return undefined;
    P.addEventListener('songchange', onSongChange);
    P.addEventListener('onplaypause', onPlayPause);
    P.addEventListener('onprogress', onProgress);

    /* In case the player was not ready yet when the page opened */
    const retry = setTimeout(update, 1000);

    return () => {
      clearTimeout(retry);
      P.removeEventListener('songchange', onSongChange);
      P.removeEventListener('onplaypause', onPlayPause);
      P.removeEventListener('onprogress', onProgress);
    };
  }, []);

  function togglePlay() {
    try { Spicetify.Player.togglePlay(); } catch (e) { /* ignore */ }
  }

  function seekTo(ratio) {
    const P = Spicetify.Player;
    if (!P || !P.seek || track.duration <= 0) return;
    const r = clamp01(ratio);
    P.seek(Math.round(r * track.duration));
    setTrack((t) => ({ ...t, progress: r }));
  }

  function onProgressKey(e) {
    if (track.duration <= 0) return;
    const step = 5000 / track.duration;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); seekTo(track.progress + step); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); seekTo(track.progress - step); }
    else if (e.key === 'Home') { e.preventDefault(); seekTo(0); }
    else if (e.key === 'End') { e.preventDefault(); seekTo(0.999); }
  }

  const theme = settings.theme;
  const tonearmAngle = track.hasTrack
    ? geom.baseAngle + track.progress * (geom.maxAngle - geom.baseAngle)
    : REST_ANGLE;
  const armLength = Math.max(200, geom.recordRadius * 1.7 + 40);

  let rotationSpeed;
  if (settings.rpm !== 'auto') rotationSpeed = RPM_SECONDS[settings.rpm];
  else if (track.duration > 0 && track.duration < 120000) rotationSpeed = RPM_SECONDS['78'];
  else if (track.duration > 0 && track.duration < 240000) rotationSpeed = RPM_SECONDS['45'];
  else rotationSpeed = RPM_SECONDS['33'];

  const currentTime = Math.round(track.progress * track.duration);
  const hasArt = !!track.albumArt && !artFailed;
  const canClick = settings.clickToToggle && track.hasTrack;

  const platter = track.hasTrack
    ? el('div', {
        className: 'plattenspieler-platter' + (canClick ? ' plattenspieler-platter-clickable' : ''),
        onClick: canClick ? togglePlay : undefined,
        onKeyDown: canClick ? (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePlay(); } } : undefined,
        role: canClick ? 'button' : undefined,
        tabIndex: canClick ? 0 : undefined,
        'aria-label': canClick ? (track.isPlaying ? 'Pause' : 'Play') : undefined,
        title: canClick ? (track.isPlaying ? 'Pause' : 'Play') : undefined,
      },
        el('div', {
          className: 'plattenspieler-vinyl plattenspieler-vinyl-spinning' + (hasArt ? '' : ' plattenspieler-vinyl-noart'),
          style: {
            backgroundImage: hasArt ? 'url("' + track.albumArt + '")' : undefined,
            animationDuration: rotationSpeed + 's',
            animationPlayState: track.isPlaying ? 'running' : 'paused',
          },
        },
          /* Hidden image, only used to detect a failed cover load */
          hasArt && el('img', { src: track.albumArt, alt: '', className: 'plattenspieler-art-probe', onError: () => setArtFailed(true) }),
          !hasArt && el('div', { className: 'plattenspieler-label' }, track.trackName),
          el('div', { className: 'plattenspieler-grooves' }),
          el('div', { className: 'plattenspieler-shine' }),
          el('div', { className: 'plattenspieler-hole' }),
        ),
      )
    : el('div', { className: 'plattenspieler-idle' },
        el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' },
          el('circle', { cx: '12', cy: '12', r: '10' }),
          el('circle', { cx: '12', cy: '12', r: '3', className: 'plattenspieler-idle-hole' }),
        ),
        'No track playing',
      );

  return el('div', { className: 'plattenspieler-container plattenspieler-theme-' + theme },
    el('div', { className: 'plattenspieler-toolbar' },
      el('button', {
        type: 'button',
        className: 'plattenspieler-icon-btn',
        onClick: () => setShowSettings(true),
        'aria-label': 'Open settings',
        title: 'Settings',
      }, el(Icon, { d: ICON_GEAR })),
    ),
    el('div', { className: 'plattenspieler-turntable', ref: turntableRef },
      el('div', { className: 'plattenspieler-play-indicator', title: track.isPlaying ? 'Playing' : 'Paused' },
        el('div', {
          className: 'plattenspieler-play-indicator-dot'
            + (!track.hasTrack ? ' plattenspieler-play-indicator-dot-off'
              : !track.isPlaying ? ' plattenspieler-play-indicator-dot-paused' : ''),
        }),
      ),
      platter,
      el(Tonearm, { length: armLength, height: 36, angle: tonearmAngle, pivotX: geom.pivotX, pivotY: geom.pivotY }),
      el('div', { className: 'plattenspieler-pivot', style: { left: geom.pivotX - 10 + 'px', top: geom.pivotY - 10 + 'px' } }),
      settings.showVu && track.hasTrack && el(VuMeter, { isPlaying: track.isPlaying, trackKey: track.trackKey }),
    ),
    settings.showInfo && track.hasTrack && el('div', { className: 'plattenspieler-info' },
      el('div', { className: 'plattenspieler-track-name', title: track.trackName }, track.trackName),
      el('div', { className: 'plattenspieler-artist-name', title: track.artistName }, track.artistName),
      el('div', { className: 'plattenspieler-progress-container' },
        el('span', { className: 'plattenspieler-time' }, formatTime(currentTime)),
        el('div', {
          className: 'plattenspieler-progress-bar',
          role: 'slider',
          tabIndex: 0,
          'aria-label': 'Playback position',
          'aria-valuemin': 0,
          'aria-valuemax': Math.round(track.duration / 1000),
          'aria-valuenow': Math.round(currentTime / 1000),
          'aria-valuetext': formatTime(currentTime) + ' of ' + formatTime(track.duration),
          onClick: (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seekTo((e.clientX - rect.left) / rect.width);
          },
          onKeyDown: onProgressKey,
        },
          el('div', { className: 'plattenspieler-progress-fill', style: { width: track.progress * 100 + '%' } }),
        ),
        el('span', { className: 'plattenspieler-time plattenspieler-time-right' }, formatTime(track.duration)),
      ),
    ),
    el('div', { className: 'plattenspieler-footer' },
      el('span', null, 'Made by Jorven · '),
      el('a', { href: REPO_URL, target: '_blank', rel: 'noopener noreferrer', className: 'plattenspieler-footer-link' }, 'GitHub'),
    ),
    showSettings && el(SettingsModal, { settings, onChange: setSettings, onClose: closeSettings, theme }),
  );
}

function render() {
  return el(ErrorBoundary, null, el(RecordPlayer));
}
