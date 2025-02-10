import React, { useState, useRef, useEffect } from 'react';
import { Todo, TodoSection } from '../../utils/supabaseClient';
import { SupabaseClient, User } from '@supabase/supabase-js';

interface TodoInputProps {
  sectionId?: number;
  sections: TodoSection[];
  user: User | null;
  supabase: SupabaseClient;
  setSections: React.Dispatch<React.SetStateAction<TodoSection[]>>;
  onAddTodo?: (todoText: string) => void;
}

export const TodoInput: React.FC<TodoInputProps> = ({ 
  sectionId, 
  sections, 
  user, 
  supabase, 
  setSections,
  onAddTodo
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (!inputRef.current?.value.trim()) {
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputRef.current?.value.trim()) {
      const todoText = inputRef.current.value.trim();
      const targetSectionId = sectionId || (sections.length > 0 ? sections[0].id : null);
      
      if (targetSectionId) {
        if (onAddTodo) {
          onAddTodo(todoText);
        } else if (user) {
          const newTodo: Todo = {
            id: Date.now(), // Temporary client-side ID
            text: todoText,
            completed: false,
            completed_at: null,
            created_at: new Date().toISOString(),
            section_id: targetSectionId,
            user_id: user.id
          };

          // Optimistically update the UI
          setSections(prevSections => 
            prevSections.map(section => 
              section.id === targetSectionId 
                ? { ...section, todos: [...section.todos, newTodo] } 
                : section
            )
          );

          // Actually save the todo to the database
          const saveTodoToDatabase = async () => {
            try {
              const { data, error } = await supabase
                .from('todos')
                .insert(newTodo)
                .select();

              if (error) throw error;

              // Update the todo with the server-generated ID
              if (data && data.length > 0) {
                setSections(prevSections => 
                  prevSections.map(section => 
                    section.id === targetSectionId 
                      ? { 
                          ...section, 
                          todos: section.todos.map(todo => 
                            todo.id === newTodo.id ? data[0] : todo
                          ) 
                        } 
                      : section
                  )
                );
              }
            } catch (err) {
              console.error('Error saving todo:', err);
              // Revert the optimistic update if save fails
              setSections(prevSections => 
                prevSections.map(section => 
                  section.id === targetSectionId 
                    ? { ...section, todos: section.todos.filter(todo => todo.id !== newTodo.id) } 
                    : section
                )
              );
            }
          };

          saveTodoToDatabase();
        }
        
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        setIsEditing(false);
      }
    }
  };

  const handleAddTodo = () => {
    setIsEditing(true);
  };

  return (
    <div className="todo-input-container">
      {!isEditing ? (
        <div className="todo-placeholder" onClick={handleAddTodo}>
          Add a new todo...
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          className="new-todo-input"
          placeholder="What needs to be done?"
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
        />
      )}
    </div>
  );
};
