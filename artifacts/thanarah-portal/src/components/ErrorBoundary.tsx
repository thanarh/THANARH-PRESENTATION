import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Thanarah] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a1a12',
            color: '#e2e8e4',
            fontFamily: 'system-ui, sans-serif',
            padding: '2rem',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ color: '#6b7c71', fontSize: '0.875rem', margin: 0 }}>
            An unexpected error occurred. Please refresh the page.
          </p>
          {this.state.error && (
            <pre
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#0f2618',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#e87070',
                maxWidth: '600px',
                overflowX: 'auto',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem 1.5rem',
              background: '#1e6b4d',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            إعادة التحميل / Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
