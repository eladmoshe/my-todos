import React from "react";
import TodoApp from "./components/TodoApp";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <TodoApp />
    </div>
  );
};

export default App;
