import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6 bg-[#EEF2F8] dark:bg-[#0A1128]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="bg-white dark:bg-[#132052] rounded-3xl p-8 max-w-md w-full text-center border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto mb-5 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={32} />
            </div>

            <h1 className="text-xl font-bold text-[#0D1B3E] dark:text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Something went wrong
            </h1>

            <p className="text-xs text-[#5A6E8E] dark:text-blue-200/70 mb-6 leading-relaxed">
              An unexpected error occurred while loading this page. This could be due to network connectivity issues or missing profile attributes.
            </p>

            {this.state.error?.message && (
              <div className="p-3 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-left">
                <p className="text-[11px] font-mono text-red-700 dark:text-red-300 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-white/15 text-[#0D1B3E] dark:text-white text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home size={14} /> Go Home
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 rounded-xl bg-[#0B3D91] text-white text-xs font-semibold hover:bg-[#0a348a] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-0"
              >
                <RefreshCw size={14} /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
