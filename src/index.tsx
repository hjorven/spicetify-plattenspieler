/*
 * Plattenspieler – Spicetify Custom App
 *
 * Spicetify loads dist/index.js and calls the global render() when the
 * /plattenspieler page is opened. React comes from Spicetify.React, so it is
 * not bundled.
 *
 * Some UI patterns (settings window as a portal with tabs, error boundary,
 * safe wrappers around Spicetify.ReactComponent, spotify:image URL normalization)
 * are inspired by listening-stats (MIT, https://github.com/HeadshotInteractive/listening-stats).
 */
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RecordPlayer } from "./components/RecordPlayer";

export function render() {
  return (
    <ErrorBoundary>
      <RecordPlayer />
    </ErrorBoundary>
  );
}
