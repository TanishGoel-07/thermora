import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional label shown in the fallback UI, e.g. the panel/page name. */
  label?: string;
  /** If true, renders a small inline fallback instead of a full-page one. Use around individual panels. */
  compact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render/runtime errors in its subtree so a single broken panel
 * (e.g. bad/missing API data) can't unmount the entire React tree and
 * blank the whole dashboard. Wrap the app root AND individual panels.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`ErrorBoundary caught an error in ${this.props.label ?? "component"}:`, error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.compact) {
        return (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center h-full min-h-[160px]">
            <AlertTriangle size={20} className="text-red-400" />
            <p className="text-xs font-mono text-slate-300">
              {this.props.label ?? "This panel"} failed to load.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-base-700 bg-base-850 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:border-base-600 transition-colors"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        );
      }

      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-base-950 p-6 text-center">
          <AlertTriangle size={32} className="text-red-400" />
          <div>
            <h2 className="font-display text-lg font-bold text-white">Something went wrong.</h2>
            <p className="mt-1 max-w-md text-sm text-slate-400">
              {this.state.error?.message ?? "An unexpected error occurred while rendering the dashboard."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 rounded-md border border-base-700 bg-base-850 px-3 py-1.5 text-xs font-mono text-slate-200 hover:border-base-600 transition-colors"
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
