/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_ERROR_BOUNDARY
COLOR_ONION_HEX: NEON=#DC2626 FLUO=#EF4444 PASTEL=#FECACA
ICON_FAMILY: lucide
ICON_GLYPH: shield-alert
ICON_SIG: AL001010
5WH: WHAT=Global React error boundary; WHY=Catch render/runtime errors and display fallback; WHO=Agent Lee Development Team; WHERE=components/ErrorBoundary.tsx; WHEN=2025-09-24; HOW=Class + functional wrapper with logging hook
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onErrorCapture?: (error: Error, info: { componentStack: string }) => void;
}
interface ErrorBoundaryState { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    if (this.props.onErrorCapture) {
      this.props.onErrorCapture(error, info);
    } else {
      console.error('[ErrorBoundary] Caught error:', error, info?.componentStack);
    }
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-neutral-900 text-white font-sans p-4 space-y-4">
          <h1 className="text-xl font-semibold text-red-400">Application Error</h1>
          <p className="text-sm text-neutral-200">The interface encountered an unexpected issue.</p>
          {this.state.error && (
            <pre className="bg-neutral-800 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-64">
              {this.state.error.message}
            </pre>
          )}
          <button onClick={this.reset} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400">Reload View</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const withErrorBoundary = (component: ReactNode, props?: Partial<ErrorBoundaryProps>) => (
  <ErrorBoundary {...props}>{component}</ErrorBoundary>
);

export default ErrorBoundary;
