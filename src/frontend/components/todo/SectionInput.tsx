import React, { useState, useRef, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { TodoSection } from '../../utils/supabaseClient';

interface SectionInputProps {
  supabase: SupabaseClient;
  user: any;
  setSections: React.Dispatch<React.SetStateAction<TodoSection[]>>;
  getSectionsTable: () => any;
}

export const SectionInput: React.FC<SectionInputProps> = ({ 
  supabase, 
  user, 
  setSections, 
  getSectionsTable 
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

  const addSection = async (title: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sections')
        .insert({ 
          title: title.trim(), 
          user_id: user.id 
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newSection = data[0];
        setSections(prevSections => [...prevSections, { 
          ...newSection, 
          todos: [] 
        }]);
      }
    } catch (err) {
      console.error('Error adding section:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputRef.current?.value.trim()) {
      addSection(inputRef.current.value.trim());
      setIsEditing(false);
    }
  };

  const handleAddSection = () => {
    setIsEditing(true);
  };

  return (
    <div className="section-input-container">
      {!isEditing ? (
        <div 
          className="todo-placeholder" 
          onClick={handleAddSection}
        >
          Add a new section...
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          className="new-todo-input"
          placeholder="Enter section name"
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
        />
      )}
    </div>
  );
};
