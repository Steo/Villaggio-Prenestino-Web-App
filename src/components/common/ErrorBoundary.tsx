import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 text-center shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {this.props.fallbackTitle || 'Impossibile caricare questa sezione'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Si è verificato un problema temporaneo durante il caricamento. Riprova per ricaricare i contenuti.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#781816] hover:bg-[#601311] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ricarica la scheda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
