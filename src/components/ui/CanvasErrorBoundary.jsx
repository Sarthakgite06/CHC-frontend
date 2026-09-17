import React from 'react';

export default class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('3D Canvas encountered an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '260px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          padding: '24px'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '12px', opacity: 0.85 }}>💳</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--accent-primary, #00e6d9)' }}>
            Centralized Health Card
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Interactive 3D preview offline
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
