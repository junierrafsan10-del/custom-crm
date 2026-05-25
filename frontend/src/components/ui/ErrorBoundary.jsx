import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-on-surface">Something went wrong</h3>
          <p className="text-xs text-on-surface-variant/60 mt-1.5 max-w-sm text-center leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-5"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
