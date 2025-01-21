import React from "react";
import TodoApp from "./components/TodoApp";

interface AppProps {
  basename?: string;
}

const App: React.FC<AppProps> = ({ basename }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <TodoApp basename={basename} />
    </div>
  );
};

export default App;
