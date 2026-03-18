import React from 'react';
import { Alert, Button, Space, Typography } from 'antd';

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'page error'
    };
  }

  public componentDidCatch(error: Error): void {
    console.error('App runtime error:', error);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Title level={3} style={{ marginBottom: 0 }}>page error</Typography.Title>
            <Alert
              type="error"
              showIcon
              message="progress error"
              description={this.state.errorMessage}
            />
            <Button type="primary" onClick={this.handleReload}>
                flush page
            </Button>
          </Space>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
