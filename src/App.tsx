import React from 'react';
import TodoApp from './frontend/components/TodoApp';
import ErrorBoundary from './frontend/components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <TodoApp />
    </ErrorBoundary>
  );
};

export default App;
