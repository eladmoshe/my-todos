import React, { useState } from 'react';
import Section from './Section';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';

interface Todo {
  id: string;
  text: string;
}

interface TodoSection {
  id: string;
  title: string;
  todos: Todo[];
}

const TodoApp: React.FC = () => {
  const [sections, setSections] = useState<TodoSection[]>([
    { id: '1', title: 'To Do', todos: [] },
  ]);

  const addSection = () => {
    const newSection: TodoSection = {
      id: Date.now().toString(),
      title: 'New Section',
      todos: [],
    };
    setSections([...sections, newSection]);
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  const renameSection = (sectionId: string, newTitle: string) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    ));
  };

  const addTodo = (sectionId: string, todoText: string) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            todos: [...section.todos, { id: Date.now().toString(), text: todoText }],
          }
        : section
    ));
  };

  const checkTodo = (sectionId: string, todoId: string) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? { ...section, todos: section.todos.filter(todo => todo.id !== todoId) }
        : section
    ));
    // TODO: Implement archiving logic
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) {
      return;
    }

    if (type === 'section') {
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      setSections(newSections);
    } else if (type === 'todo') {
      const sourceSection = sections.find(section => section.id === source.droppableId);
      const destSection = sections.find(section => section.id === destination.droppableId);

      if (sourceSection && destSection) {
        const sourceTodos = Array.from(sourceSection.todos);
        const destTodos = source.droppableId === destination.droppableId ? sourceTodos : Array.from(destSection.todos);
        const [reorderedTodo] = sourceTodos.splice(source.index, 1);
        destTodos.splice(destination.index, 0, reorderedTodo);

        setSections(sections.map(section => {
          if (section.id === sourceSection.id) {
            return { ...section, todos: sourceTodos };
          }
          if (section.id === destSection.id) {
            return { ...section, todos: destTodos };
          }
          return section;
        }));
      }
    }
  };

  return (
    <div className="todo-app">
      <h1>Todo App</h1>
      <button onClick={addSection}>Add Section</button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections" type="section">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sections.map((section, index) => (
                <Section
                  key={section.id}
                  section={section}
                  index={index}
                  onDelete={() => deleteSection(section.id)}
                  onRename={(newTitle) => renameSection(section.id, newTitle)}
                  onAddTodo={(todoText) => addTodo(section.id, todoText)}
                  onCheckTodo={(todoId) => checkTodo(section.id, todoId)}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default TodoApp;