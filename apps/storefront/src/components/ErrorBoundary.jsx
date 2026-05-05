import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Storefront render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
          <h1>Something went wrong in the UI</h1>
          <p style={{ color: "crimson" }}>{this.state.error.message}</p>
          <p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
