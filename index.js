/// <reference types="react" />

const {
  React,
  React: { useState, useEffect, useRef },
} = Spicetify;

const { createElement: el } = React;

function formatTime(ms) {
  if (!ms && ms !== 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const REST_ANGLE = 80;
var savedProgress = 0;

function RecordPlayer() {
  const turntableRef = useRef(null);
  const vuRef = useRef({ l: 0, r: 0, pl: 0, pr: 0 });
  const isPlayingRef = useRef(false);

  const [vuData, setVuData] = useState({ l: 0, r: 0, pl: 0, pr: 0 });
  const [theme, setTheme] = useState(localStorage.getItem('plattenspieler-theme') || 'modern');
  function changeTheme(t) {
    localStorage.setItem('plattenspieler-theme', t);
    setTheme(t);
  }
  const [state, setState] = useState({
    albumArt: '',
    trackName: '',
    artistName: '',
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    duration: 0,
    hasTrack: false,
  });
  const [geom, setGeom] = useState({
    pivotX: 280,
    pivotY: 90,
    recordRadius: 140,
    baseAngle: 120,
    maxAngle: 145,
  });

  useEffect(() => {
    function recalc() {
      const tt = turntableRef.current;
      if (!tt) return;
      const rect = tt.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const vw = window.innerWidth;

      const recordWidth = Math.min(320, vw * 0.55);
      const recordRadius = recordWidth / 2;
      const centerX = w * 0.36;
      const centerY = h * 0.50;
      const pivotX = w * 0.36 + recordRadius + 12;
      const pivotY = h * 0.18 + 20;

      const dx = centerX - pivotX;
      const dy = centerY - pivotY;
      const angleToCenter = Math.atan2(dy, dx) * (180 / Math.PI);
      const outerAngle = angleToCenter - 35;
      const innerAngle = angleToCenter - 2;

      setGeom({ pivotX, pivotY, recordRadius, baseAngle: outerAngle, maxAngle: innerAngle });
    }

    recalc();
    const ro = new ResizeObserver(recalc);
    if (turntableRef.current) ro.observe(turntableRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(function() {
    function readPlayer() {
      try {
        var data = Spicetify.Player && Spicetify.Player.data;
        if (!data) return null;
        var item = data.item || data.track;
        if (!item || !item.name) return null;
        var img = item.album && item.album.images;
        return {
          albumArt: (img && img[0] && img[0].url) || '',
          trackName: item.name || '',
          artistName: (item.artists || []).map(function(a) { return a.name; }).join(', '),
          isPlaying: data.is_playing || data.isPlaying || false,
          duration: data.duration || 0,
          position: data.position || 0,
          hasTrack: true,
        };
      } catch(e) { return null; }
    }

    function update() {
      var info = readPlayer();
      if (info) {
        var p = info.duration > 0 ? info.position / info.duration : 0;
        if (p > 0 || savedProgress === 0) savedProgress = p;
        isPlayingRef.current = info.isPlaying;
        setState({
          albumArt: info.albumArt,
          trackName: info.trackName,
          artistName: info.artistName,
          isPlaying: info.isPlaying,
          progress: savedProgress,
          currentTime: Math.round(savedProgress * info.duration),
          duration: info.duration,
          hasTrack: true,
        });
      } else {
        isPlayingRef.current = false;
        setState(function(p) { return { ...p, hasTrack: false }; });
      }
    }

    update();

    var u1 = Spicetify.Player.addEventListener('songchange', function() {
      savedProgress = 0;
      update();
    });
    var u2 = Spicetify.Player.addEventListener('onplaypause', function(e) {
      var playing = e.data && !e.data.is_paused;
      isPlayingRef.current = playing;
      setState(function(p) { return { ...p, isPlaying: playing, hasTrack: p.hasTrack || true }; });
      if (playing) update();
    });
    var u3 = Spicetify.Player.addEventListener('onprogress', function(e) {
      var d = Spicetify.Player && Spicetify.Player.data;
      if (d && d.duration > 0) {
        var p = e.data / d.duration;
        savedProgress = p;
        isPlayingRef.current = true;
        setState(function(s) { return { ...s, currentTime: e.data, progress: p, hasTrack: true, isPlaying: true }; });
      }
    });

    var vuId;
    var lastVu = 0;
    var vuAnalyser = null;
    var vuTries = 0;

    function findAnalyser() {
      try {
        var p = Spicetify && Spicetify.Player;
        if (!p) return null;
        var candidates = ['analyser', '_analyser', 'audioAnalyser', '_audioAnalyser'];
        for (var i = 0; i < candidates.length; i++) {
          if (p[candidates[i]] && p[candidates[i]].frequencyBinCount) return p[candidates[i]];
        }
        return null;
      } catch(e) { return null; }
    }

    function vuLoop(time) {
      vuId = requestAnimationFrame(vuLoop);
      try {
        if (!isPlayingRef.current) return;

        var a = vuAnalyser;
        if (!a) {
          vuTries++;
          if (vuTries < 600 || (vuTries % 1200) === 0) {
            vuAnalyser = findAnalyser();
            a = vuAnalyser;
          }
        }

        var lvlL, lvlR;
        if (a && a.frequencyBinCount) {
          var arr = new Uint8Array(a.frequencyBinCount);
          try { a.getByteFrequencyData(arr); } catch(e) { try { a.getByteTimeDomainData(arr); } catch(e2) { return; } }
          var half = Math.floor(arr.length / 2);
          var sumL = 0, sumR = 0;
          for (var i = 0; i < half; i++) sumL += arr[i];
          for (var i = half; i < arr.length; i++) sumR += arr[i];
          lvlL = Math.min(1, sumL / half / 255 * 1.5);
          lvlR = Math.min(1, sumR / half / 255 * 1.5);
        } else {
          var t = time * 0.001;
          var beat = (t % (0.4 + (t * 0.01) % 0.3)) / (0.4 + (t * 0.01) % 0.3);
          var energy = Math.sin(beat * Math.PI);
          lvlL = 0.08 + energy * 0.55 + Math.sin(t * 3.1) * 0.08 + (1 - energy) * Math.random() * 0.12;
          lvlR = 0.08 + energy * 0.5 + Math.sin(t * 2.8 + 0.7) * 0.08 + (1 - energy) * Math.random() * 0.12;
        }

        var v = vuRef.current;
        v.l = Math.max(Math.min(lvlL, 1), v.l * 0.92);
        v.r = Math.max(Math.min(lvlR, 1), v.r * 0.92);
        v.pl = Math.max(v.pl, v.l);
        v.pr = Math.max(v.pr, v.r);
        v.pl *= 0.997;
        v.pr *= 0.997;

        if (time - lastVu > 50) {
          lastVu = time;
          setVuData({ l: v.l, r: v.r, pl: v.pl, pr: v.pr });
        }
      } catch(e) {}
    }
    vuId = requestAnimationFrame(vuLoop);

    return function() {
      if (u1) u1();
      if (u2) u2();
      if (u3) u3();
      cancelAnimationFrame(vuId);
    };
  }, []);

  const tonearmAngle = state.hasTrack
    ? geom.baseAngle + state.progress * (geom.maxAngle - geom.baseAngle)
    : REST_ANGLE;

  const armLength = Math.max(200, geom.recordRadius * 1.7 + 40);
  const armHeight = 36;

  const rotationSpeed = state.duration > 0
    ? (state.duration < 120000 ? 0.77 : state.duration < 240000 ? 1.33 : 1.8)
    : 1.8;

  const displayTime = state.duration > 0 ? Math.round(savedProgress * state.duration) : 0;
  const progressPercent = state.duration > 0 ? (savedProgress * 100) : 0;

  return el('div', { className: 'plattenspieler-container plattenspieler-theme-' + theme },
    el('div', { className: 'plattenspieler-theme-selector' },
      el('button', {
        className: 'plattenspieler-theme-btn' + (theme === 'modern' ? ' plattenspieler-theme-btn-active' : ''),
        onClick: function() { changeTheme('modern'); },
      }, 'Modern'),
      el('button', {
        className: 'plattenspieler-theme-btn' + (theme === '2000s' ? ' plattenspieler-theme-btn-active' : ''),
        onClick: function() { changeTheme('2000s'); },
      }, '2000s'),
    ),
    el('div', { className: 'plattenspieler-turntable', ref: turntableRef },
      el('div', { className: 'plattenspieler-play-indicator' },
        el('div', {
          className: 'plattenspieler-play-indicator-dot' + (
            !state.isPlaying && state.hasTrack ? ' plattenspieler-play-indicator-dot-paused' : ''
          ),
        }),
      ),
      state.hasTrack
        ? el('div', { className: 'plattenspieler-platter' },
            el('div', {
              className: 'plattenspieler-vinyl plattenspieler-vinyl-spinning',
              style: {
                backgroundImage: state.albumArt ? 'url(' + state.albumArt + ')' : 'none',
                backgroundSize: 'cover',
                animationDuration: rotationSpeed + 's',
                animationPlayState: state.isPlaying ? 'running' : 'paused',
              },
            },
              el('div', { className: 'plattenspieler-grooves' }),
              el('div', { className: 'plattenspieler-shine' }),
              el('div', { className: 'plattenspieler-hole' }),
            ),
          )
        : el('div', { className: 'plattenspieler-idle' },
            el('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
              el('circle', { cx: '12', cy: '12', r: '10' }),
              el('circle', { cx: '12', cy: '12', r: '3', fill: '#1a1a2a' }),
              el('line', { x1: '12', y1: '2', x2: '12', y2: '5', stroke: 'currentColor', 'stroke-width': '1.5' }),
            ),
            'No track playing',
          ),
      el('div', {
        className: 'plattenspieler-tonearm',
        style: {
          transform: 'rotate(' + tonearmAngle + 'deg)',
          transformOrigin: '0 ' + (armHeight / 2) + 'px',
          left: geom.pivotX + 'px',
          top: (geom.pivotY - armHeight / 2) + 'px',
          width: armLength + 'px',
          height: armHeight + 'px',
        },
      },
        el('svg', { viewBox: '0 0 ' + armLength + ' ' + armHeight, width: armLength, height: armHeight },
          el('defs', null,
            el('linearGradient', { id: 'armGrad', x1: '0', y1: '0', x2: '0', y2: '1' },
              el('stop', { offset: '0%', 'stop-color': '#c0c0c0' }),
              el('stop', { offset: '50%', 'stop-color': '#888' }),
              el('stop', { offset: '100%', 'stop-color': '#666' }),
            ),
            el('linearGradient', { id: 'headGrad', x1: '0', y1: '0', x2: '0', y2: '1' },
              el('stop', { offset: '0%', 'stop-color': '#999' }),
              el('stop', { offset: '100%', 'stop-color': '#555' }),
            ),
            el('radialGradient', { id: 'pivotGrad', cx: '40%', cy: '35%' },
              el('stop', { offset: '0%', 'stop-color': '#ddd' }),
              el('stop', { offset: '100%', 'stop-color': '#777' }),
            ),
            el('filter', { id: 'shadow2' },
              el('feDropShadow', { dx: '1', dy: '2', stdDeviation: '2', 'flood-opacity': '0.3' }),
            ),
          ),
          el('circle', { cx: '0', cy: armHeight / 2, r: '10', fill: 'url(#pivotGrad)', stroke: '#555', 'stroke-width': '1' }),
          el('rect', { x: '8', y: armHeight / 2 - 2.5, width: armLength * 0.6, height: '5', rx: '2.5', fill: 'url(#armGrad)' }),
          el('rect', { x: armLength * 0.6, y: armHeight / 2 - 7, width: armLength * 0.2, height: '14', rx: '3', fill: 'url(#headGrad)', filter: 'url(#shadow2)' }),
          el('polygon', { points: (armLength * 0.8) + ',' + (armHeight / 2) + ' ' + (armLength * 0.8 + 8) + ',' + (armHeight / 2 - 2) + ' ' + (armLength * 0.8 + 10) + ',' + (armHeight / 2 + 2), fill: '#777' }),
          el('rect', { x: '0', y: armHeight / 2 - 4, width: '16', height: '8', rx: '3', fill: 'url(#pivotGrad)', stroke: '#555', 'stroke-width': '0.5' }),
        ),
      ),
      el('div', { className: 'plattenspieler-pivot',
        style: { left: (geom.pivotX - 10) + 'px', top: (geom.pivotY - 10) + 'px' },
      }),
      state.hasTrack && el('div', { className: 'plattenspieler-vu-container' },
        el('div', { className: 'plattenspieler-vu' },
          el('div', { className: 'plattenspieler-vu-fill', style: { transform: 'scaleY(' + Math.min(vuData.l, 1) + ')' } }),
          el('div', { className: 'plattenspieler-vu-peak', style: { bottom: (Math.min(vuData.pl, 1) * 100) + '%' } }),
        ),
        el('div', { className: 'plattenspieler-vu' },
          el('div', { className: 'plattenspieler-vu-fill', style: { transform: 'scaleY(' + Math.min(vuData.r, 1) + ')' } }),
          el('div', { className: 'plattenspieler-vu-peak', style: { bottom: (Math.min(vuData.pr, 1) * 100) + '%' } }),
        ),
      ),
    ),
    state.hasTrack && el('div', { className: 'plattenspieler-info' },
      el('div', { className: 'plattenspieler-track-name' }, state.trackName),
      el('div', { className: 'plattenspieler-artist-name' }, state.artistName),
      el('div', { className: 'plattenspieler-progress-container' },
        el('span', { className: 'plattenspieler-time' }, formatTime(displayTime)),
        el('div', {
          className: 'plattenspieler-progress-bar',
          onClick: function(e) {
            var rect = e.currentTarget.getBoundingClientRect();
            var pct = (e.clientX - rect.left) / rect.width;
            if (Spicetify.Player.seek) Spicetify.Player.seek(pct);
          },
        },
          el('div', { className: 'plattenspieler-progress-fill', style: { width: progressPercent + '%' } }),
        ),
        el('span', { className: 'plattenspieler-time plattenspieler-time-right' }, formatTime(state.duration)),
      ),
    ),
    el('div', { className: 'plattenspieler-footer' },
      el('span', null, 'Made by Jorven '),
      el('a', { href: 'https://github.com/Death-Watcher/spicetify-plattenspieler', target: '_blank', className: 'plattenspieler-footer-link' },
        'github.com/Death-Watcher/spicetify-plattenspieler',
      ),
    ),
  );
}

function render() {
  return el(RecordPlayer);
}
