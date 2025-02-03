import React, { useState, useRef, useEffect } from 'react';
import { TrashIcon } from "@heroicons/react/24/outline";

// Import types from the main TodoApp file
import { Todo } from '../../utils/supabaseClient';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: () => void;
  onDelete: () => void;
  onEdit: (newText: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = React.memo(({ 
  todo, 
  onToggleComplete, 
  onDelete, 
  onEdit 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus on the input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select(); // Select all text for easy replacement
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedText = editText.trim();
    if (trimmedText && trimmedText !== todo.text) {
      onEdit(trimmedText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  return (
    <div 
      className={`todo-item flex items-center justify-between p-2 ${
        todo.completed ? 'opacity-50 line-through' : ''
      }`}
    >
      {isEditing ? (
        <div className="flex items-center w-full">
          <input 
            ref={editInputRef}
            type="text" 
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-grow mr-2 p-1 border rounded"
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <div className="flex space-x-2">
            <button 
              onClick={handleSave} 
              className="text-green-500 hover:bg-green-100 p-1 rounded"
            >
              Save
            </button>
            <button 
              onClick={handleCancel} 
              className="text-red-500 hover:bg-red-100 p-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center w-full">
          <input 
            type="checkbox" 
            checked={todo.completed}
            onChange={onToggleComplete}
            className="mr-2"
          />
          <span className="flex-grow">{todo.text}</span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-blue-500 hover:bg-blue-100 p-1 rounded"
            >
              Edit
            </button>
            <button 
              onClick={onDelete} 
              className="text-red-500 hover:bg-red-100 p-1 rounded"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
