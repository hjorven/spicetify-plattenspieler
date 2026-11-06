const { Component } = Spicetify.React;

interface Props {
  children?: import("react").ReactNode;
}

interface State {
  error: Error | null;
}

/** Shows the error with a retry button instead of Spotify's generic "Something went wrong" page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[plattenspieler] Render error:", error, info?.componentStack ?? "");
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="plattenspieler-error" role="alert">
        <h2>Plattenspieler crashed</h2>
        <p>Version {__VERSION__}</p>
        <pre>{error.stack || error.message}</pre>
        <button type="button" className="plattenspieler-btn" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}
