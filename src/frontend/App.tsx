import React from "react";
import TodoApp from "./components/TodoApp";
import ErrorBoundary from "./components/ErrorBoundary";

interface AppProps {
  basename?: string;
}

const App: React.FC<AppProps> = ({ basename }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <ErrorBoundary>
        <TodoApp basename={basename} />
      </ErrorBoundary>
    </div>
  );
};

export default App;
