import React from "react";
import TodoApp from "./components/TodoApp";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TodoApp />
      </main>
    </div>
  );
};

export default App;
