import React from "react";
import { AlertTriangle } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6 p-8">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xl font-bold">Something went wrong</span>
          </div>
          <p className="text-slate-600 text-center max-w-md">
            The application encountered an unexpected error. Please reload the page to continue.
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
