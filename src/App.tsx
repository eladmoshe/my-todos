import React from 'react';
import TodoApp from './frontend/components/TodoApp';
import ErrorBoundary from './frontend/components/ErrorBoundary';

const App: React.FC = () => {
  console.log('Rendering App component');
  return (
    <ErrorBoundary>
      <TodoApp />
    </ErrorBoundary>
  );
};

export default App;
