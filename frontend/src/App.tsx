import React from 'react';
import { AppRouter } from './router/AppRouter';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;

