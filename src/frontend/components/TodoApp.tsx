import React, { useState } from 'react';
import './todo-styles.css';

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
  const [draggedTodo, setDraggedTodo] = useState<{todoId: string, sectionId: string} | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

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
  };

  const handleTodoDragStart = (e: React.DragEvent, todoId: string, sectionId: string) => {
    setDraggedTodo({ todoId, sectionId });
    e.dataTransfer.setData('text/plain', todoId);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleTodoDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedTodo(null);
  };

  const handleTodoDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedTodo) return;

    const { todoId, sectionId: sourceSectionId } = draggedTodo;
    if (sourceSectionId === targetSectionId) return;

    const sourceSection = sections.find(s => s.id === sourceSectionId);
    const todo = sourceSection?.todos.find(t => t.id === todoId);
    
    if (todo) {
      setSections(sections.map(section => {
        if (section.id === sourceSectionId) {
          return {
            ...section,
            todos: section.todos.filter(t => t.id !== todoId)
          };
        }
        if (section.id === targetSectionId) {
          return {
            ...section,
            todos: [...section.todos, todo]
          };
        }
        return section;
      }));
    }
  };

  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.setData('text/plain', sectionId);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleSectionDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedSection(null);
  };

  const handleSectionDragOver = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSectionId) return;

    const draggedIndex = sections.findIndex(s => s.id === draggedSection);
    const targetIndex = sections.findIndex(s => s.id === targetSectionId);
    
    if (draggedIndex !== targetIndex) {
      const newSections = [...sections];
      const [draggedItem] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, draggedItem);
      setSections(newSections);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Notebook container with enhanced shadow and rounded corners */}
        <div className="bg-white rounded-xl shadow-2xl relative overflow-hidden">
          {/* Notebook holes */}
          <div className="absolute left-6 top-0 bottom-0 flex flex-col justify-around pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner"
              />
            ))}
          </div>

          {/* Red margin line */}
          <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-red-400 opacity-60"></div>
          
          {/* Content container with proper padding for holes */}
          <div className="pl-24 pr-8 py-8">
            {/* Blue lines background */}
            <div 
              className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, 
                    transparent,
                    transparent 27px,
                    #e5e7eb 27px,
                    #e5e7eb 28px
                  )`,
                backgroundPosition: '0 50px',
                opacity: 0.6
              }}
            ></div>

            {/* Header area */}
            <div className="relative mb-12">
              <h1 className="text-4xl font-serif text-gray-800 tracking-wide">
                My Notes
              </h1>
            </div>

            {/* Add Section Button */}
            <button 
              onClick={addSection}
              className="mb-8 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       transition-colors duration-200 shadow-sm hover:shadow
                       text-sm font-medium tracking-wide relative"
            >
              Add Section
            </button>

            {/* Sections Container */}
            <div className="space-y-10 relative">
              {sections.map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleSectionDragStart(e, section.id)}
                  onDragEnd={handleSectionDragEnd}
                  onDragOver={(e) => handleSectionDragOver(e, section.id)}
                  className="relative cursor-move group"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 group">
                    <h2 className="text-2xl font-serif text-gray-700 group-hover:text-gray-900 transition-colors">
                      {section.title}
                    </h2>
                    <button 
                      onClick={() => deleteSection(section.id)}
                      className="text-red-400 hover:text-red-500 transition-colors duration-200
                               opacity-0 group-hover:opacity-100 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Todos Container */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleTodoDrop(e, section.id)}
                    className="space-y-3"
                  >
                    {section.todos.map((todo) => (
                      <div
                        key={todo.id}
                        draggable
                        onDragStart={(e) => handleTodoDragStart(e, todo.id, section.id)}
                        onDragEnd={handleTodoDragEnd}
                        className="flex items-center space-x-4 py-1.5 group/todo cursor-move
                                 hover:bg-blue-50 rounded px-2 transition-colors duration-200"
                      >
                        <input
                          type="checkbox"
                          onChange={() => checkTodo(section.id, todo.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-500 
                                   focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-gray-600 font-normal text-lg">
                          {todo.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add Todo Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem('todo') as HTMLInputElement;
                      if (input.value.trim()) {
                        addTodo(section.id, input.value);
                        input.value = '';
                      }
                    }}
                    className="mt-4 flex space-x-2"
                  >
                    <input
                      type="text"
                      name="todo"
                      placeholder="Add new todo"
                      className="flex-1 rounded-lg border-gray-200 shadow-sm 
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                               placeholder:text-gray-400 text-lg py-2"
                    />
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                               transition-colors duration-200 shadow-sm hover:shadow
                               text-sm font-medium tracking-wide"
                    >
                      Add
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;