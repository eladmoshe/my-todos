import React, { useState, useRef, useEffect } from 'react';
import { TrashIcon } from "@heroicons/react/24/outline";

// Import types and components
import { TodoSection as TodoSectionType } from '../../utils/supabaseClient';
import { TodoItem } from './TodoItem';

interface SectionProps {
  section: TodoSectionType;
  onAddTodo: (sectionId: number, text: string) => void;
  onDeleteSection: (sectionId: number) => void;
  onEditSection: (sectionId: number, newTitle: string) => void;
  onToggleTodoComplete?: (todoId: number) => void;
  onDeleteTodo?: (todoId: number) => void;
  onEditTodo?: (todoId: number, newText: string) => void;
}

export const TodoSectionComponent: React.FC<SectionProps> = React.memo(({ 
  section, 
  onAddTodo, 
  onDeleteSection, 
  onEditSection,
  onToggleTodoComplete = () => {},
  onDeleteTodo = () => {},
  onEditTodo = () => {}
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [sectionTitle, setSectionTitle] = useState(section.title);
  const [newTodoText, setNewTodoText] = useState('');
  const newTodoInputRef = useRef<HTMLInputElement>(null);

  // Focus on the input when it becomes visible
  useEffect(() => {
    if (newTodoInputRef.current) {
      newTodoInputRef.current.focus();
    }
  }, []);

  const handleAddTodo = () => {
    const trimmedText = newTodoText.trim();
    if (trimmedText) {
      onAddTodo(section.id, trimmedText);
      setNewTodoText('');
      
      // Refocus the input after adding a todo
      if (newTodoInputRef.current) {
        newTodoInputRef.current.focus();
      }
    }
  };

  const handleSaveSection = () => {
    onEditSection(section.id, sectionTitle);
    setIsEditing(false);
  };

  return (
    <div className="section-container mb-6 p-4 border rounded">
      <div className="section-header flex justify-between items-center mb-4">
        {isEditing ? (
          <div className="flex items-center">
            <input 
              type="text" 
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className="flex-grow mr-2"
              autoFocus
            />
            <button 
              onClick={handleSaveSection} 
              className="text-green-500 mr-2"
            >
              Save
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              className="text-red-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <h2 className="text-xl font-bold mr-4">{section.title}</h2>
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-blue-500 mr-2"
            >
              Edit
            </button>
            <button 
              onClick={() => onDeleteSection(section.id)} 
              className="text-red-500"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="todo-input-container mb-4">
        <input 
          ref={newTodoInputRef}
          type="text" 
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo"
          className="w-full p-2 border rounded"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddTodo();
              e.preventDefault(); // Prevent form submission
            }
          }}
        />
        <button 
          onClick={handleAddTodo} 
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          disabled={!newTodoText.trim()}
        >
          Add Todo
        </button>
      </div>
      
      <div className="todos-list">
        {section.todos.map(todo => (
          <TodoItem 
            key={todo.id} 
            todo={todo} 
            onToggleComplete={() => onToggleTodoComplete(todo.id)}
            onDelete={() => onDeleteTodo(todo.id)}
            onEdit={(newText) => onEditTodo(todo.id, newText)}
          />
        ))}
      </div>
    </div>
  );
});
