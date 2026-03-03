import React from 'react';
import { isDynamicImportFetchError, reloadOnceForDynamicImportError } from '../lib/chunkReload';

type Props = {
  children: React.ReactNode;
};

type State = {
  error?: unknown;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error(error);
    reloadOnceForDynamicImportError(error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const isChunkError = isDynamicImportFetchError(this.state.error);
    return (
      <div className="container">
        <h2 style={{ margin: '20px 0 10px' }}>{isChunkError ? 'Update available' : 'Something went wrong'}</h2>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          {isChunkError
            ? 'The app was updated while this tab was open. Reload to get the latest version.'
            : 'Please reload the page. If the problem persists, check the console for details.'}
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={() => window.location.reload()} type="button">
            Reload
          </button>
        </div>
      </div>
    );
  }
}

