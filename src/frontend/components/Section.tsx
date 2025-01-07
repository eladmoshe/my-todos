import React, { useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';

interface Todo {
  id: string;
  text: string;
}

interface SectionProps {
  section: {
    id: string;
    title: string;
    todos: Todo[];
  };
  index: number;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  onAddTodo: (todoText: string) => void;
  onCheckTodo: (todoId: string) => void;
}

const Section: React.FC<SectionProps> = ({ section, index, onDelete, onRename, onAddTodo, onCheckTodo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(section.title);
  const [newTodoText, setNewTodoText] = useState('');

  const handleRename = () => {
    onRename(newTitle);
    setIsEditing(false);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      onAddTodo(newTodoText);
      setNewTodoText('');
    }
  };

  return (
    <Draggable draggableId={section.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="section"
        >
          <div {...provided.dragHandleProps} className="section-header">
            {isEditing ? (
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleRename}
                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
              />
            ) : (
              <h2 onClick={() => setIsEditing(true)}>{section.title}</h2>
            )}
            <button onClick={onDelete}>Delete Section</button>
          </div>
          <Droppable droppableId={section.id} type="todo">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef}>
                {section.todos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <input
                          type="checkbox"
                          onChange={() => onCheckTodo(todo.id)}
                        />
                        {todo.text}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
          <form onSubmit={handleAddTodo}>
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add new todo"
            />
            <button type="submit">Add</button>
          </form>
        </div>
      )}
    </Draggable>
  );
};

export default Section;