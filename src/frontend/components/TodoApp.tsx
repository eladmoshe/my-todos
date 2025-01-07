import React, { useState, useEffect } from 'react';
import './todo-styles.css';
import supabase, { signIn, signUp } from '../../supabaseClient';

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
  const [sections, setSections] = useState<TodoSection[]>([]);
  const [draggedTodo, setDraggedTodo] = useState<{todoId: string, sectionId: string} | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchSections();
    }
  }, [user]);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('id');
    if (error) {
      console.error('Error fetching sections:', error);
    } else {
      const sectionsWithTodos = await Promise.all(data.map(async (section) => {
        const { data: todos, error: todosError } = await supabase
          .from('todos')
          .select('*')
          .eq('section_id', section.id)
          .order('id');
        if (todosError) {
          console.error('Error fetching todos:', todosError);
          return { ...section, todos: [] };
        }
        return { ...section, todos };
      }));
      setSections(sectionsWithTodos);
    }
  };

  const addSection = async () => {
    const { data, error } = await supabase
      .from('sections')
      .insert({ title: 'New Section' })
      .select()
      .single();
    if (error) {
      console.error('Error adding section:', error);
    } else {
      setSections([...sections, { ...data, todos: [] }]);
    }
  };

  const deleteSection = async (sectionId: string) => {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId);
    if (error) {
      console.error('Error deleting section:', error);
    } else {
      setSections(sections.filter(section => section.id !== sectionId));
    }
  };

  const addTodo = async (sectionId: string, todoText: string) => {
    const { data, error } = await supabase
      .from('todos')
      .insert({ text: todoText, section_id: sectionId })
      .select()
      .single();
    if (error) {
      console.error('Error adding todo:', error);
    } else {
      setSections(sections.map(section =>
        section.id === sectionId
          ? { ...section, todos: [...section.todos, data] }
          : section
      ));
    }
  };

  const checkTodo = async (sectionId: string, todoId: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId);
    if (error) {
      console.error('Error deleting todo:', error);
    } else {
      setSections(sections.map(section =>
        section.id === sectionId
          ? { ...section, todos: section.todos.filter(todo => todo.id !== todoId) }
          : section
      ));
    }
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

  const handleTodoDrop = async (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedTodo) return;

    const { todoId, sectionId: sourceSectionId } = draggedTodo;
    if (sourceSectionId === targetSectionId) return;

    const sourceSection = sections.find(s => s.id === sourceSectionId);
    const todo = sourceSection?.todos.find(t => t.id === todoId);
    
    if (todo) {
      const { error } = await supabase
        .from('todos')
        .update({ section_id: targetSectionId })
        .eq('id', todoId);
      
      if (error) {
        console.error('Error moving todo:', error);
      } else {
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

  const handleSectionDragOver = async (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSectionId) return;

    const draggedIndex = sections.findIndex(s => s.id === draggedSection);
    const targetIndex = sections.findIndex(s => s.id === targetSectionId);
    
    if (draggedIndex !== targetIndex) {
      const newSections = [...sections];
      const [draggedItem] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, draggedItem);

      // Update the order in the database
      const updates = newSections.map((section, index) => ({
        id: section.id,
        order: index
      }));

      const { error } = await supabase
        .from('sections')
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        console.error('Error reordering sections:', error);
      } else {
        setSections(newSections);
      }
    }
  };

  const startEditingSection = (sectionId: string) => {
    setEditingSectionId(sectionId);
  };

  const finishEditingSection = async (sectionId: string, newTitle: string) => {
    const { error } = await supabase
      .from('sections')
      .update({ title: newTitle })
      .eq('id', sectionId);

    if (error) {
      console.error('Error updating section title:', error);
    } else {
      setSections(sections.map(section =>
        section.id === sectionId ? { ...section, title: newTitle } : section
      ));
    }
    setEditingSectionId(null);
  };

  const handleAuth = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { user, error } = isSignUp ? await signUp(email, password) : await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        console.log(`${isSignUp ? 'Signed up' : 'Signed in'}:`, user);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl overflow-hidden p-6">
          <h2 className="text-2xl font-serif text-gray-800 mb-6">Sign Up or Sign In</h2>
          <form onSubmit={(e) => handleAuth(e, true)} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-4">
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Sign Up</button>
              <button type="button" onClick={(e) => handleAuth(e, false)} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Sign In</button>
            </div>
          </form>
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-6">
      <div className="max-w-3xl mx-auto">
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
              className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none notebook-lines"
            ></div>

            {/* Header area */}
            <div className="relative mb-12 flex justify-between items-center">
              <h1 className="text-4xl font-serif text-gray-800 tracking-wide">
                My Notes
              </h1>
              <button onClick={handleSignOut} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Sign Out</button>
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
                    {editingSectionId === section.id ? (
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setSections(sections.map(s =>
                            s.id === section.id ? { ...s, title: newTitle } : s
                          ));
                        }}
                        onBlur={() => finishEditingSection(section.id, section.title)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            finishEditingSection(section.id, section.title);
                          }
                        }}
                        className="text-2xl font-serif text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    ) : (
                      <h2 
                        className="text-2xl font-serif text-gray-700 group-hover:text-gray-900 transition-colors cursor-pointer"
                        onClick={() => startEditingSection(section.id)}
                      >
                        {section.title}
                      </h2>
                    )}
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
