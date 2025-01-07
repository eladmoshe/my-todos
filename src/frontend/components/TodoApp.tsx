import React, { useState, useEffect, useRef } from "react";
import "./todo-styles.css";
import supabase, { signIn, signUp } from "../../supabaseClient";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { format, parseISO } from "date-fns"; // Make sure to install this package: npm install date-fns
import {
  ArrowRightOnRectangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const ChainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 mb-1">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

interface Todo {
  id: number;
  text: string;
  created_at: string; // This is the PostgreSQL timestamp string
}

interface TodoSection {
  id: number;
  title: string;
  todos: Todo[];
}

const TodoApp: React.FC = () => {
  const [sections, setSections] = useState<TodoSection[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTodoSectionId, setNewTodoSectionId] = useState<number | null>(null);
  const [newTodoText, setNewTodoText] = useState<string>("");
  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const formatCreatedAt = (timestamp: string) => {
    // Parse the PostgreSQL timestamp and format it
    const date = parseISO(timestamp);
    return format(date, "MMM d, yyyy HH:mm");
  };

  const shortenUrl = (url: string, maxLength: number = 50) => {
    // Remove the protocol (http:// or https://)
    let displayUrl = url.replace(/^https?:\/\//, '');
    
    if (displayUrl.length <= maxLength) return displayUrl;
    
    // Calculate lengths
    const ellipsis = '...';
    const frontLength = Math.ceil((maxLength - ellipsis.length) / 2);
    const backLength = Math.floor((maxLength - ellipsis.length) / 2);
    
    // Truncate the middle
    return displayUrl.substring(0, frontLength) + 
           ellipsis + 
           displayUrl.substring(displayUrl.length - backLength);
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const shortenedUrl = shortenUrl(part);
        return (
          <React.Fragment key={index}>
            <ChainIcon />
            <a
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="todo-link"
              title={part}
            >
              {shortenedUrl}
            </a>
          </React.Fragment>
        );
      }
      return part;
    });
  };

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
      .from("sections")
      .select("*")
      .order("id");
    if (error) {
      console.error("Error fetching sections:", error);
    } else {
      const sectionsWithTodos = await Promise.all(
        data.map(async (section) => {
          const { data: todos, error: todosError } = await supabase
            .from("todos")
            .select("*")
            .eq("section_id", section.id)
            .order("id");
          if (todosError) {
            console.error("Error fetching todos:", todosError);
            return { ...section, todos: [] };
          }
          return { ...section, todos };
        })
      );
      setSections(sectionsWithTodos);
    }
  };

  const addSection = async () => {
    const { data, error } = await supabase
      .from("sections")
      .insert({ title: "New Section" })
      .select()
      .single();
    if (error) {
      console.error("Error adding section:", error);
    } else {
      setSections([...sections, { ...data, todos: [] }]);
    }
  };

  const deleteSection = async (sectionId: number) => {
    const sectionToDelete = sections.find(section => section.id === sectionId);
    if (!sectionToDelete) return;

    if (sectionToDelete.todos.length > 0) {
      const confirmDelete = window.confirm(
        `This section contains ${sectionToDelete.todos.length} todo item(s). Are you sure you want to delete this section and all its todos?`
      );
      if (!confirmDelete) return;
    }

    try {
      // Delete all todos in the section
      await supabase
        .from("todos")
        .delete()
        .eq("section_id", sectionId);

      // Delete the section
      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;

      setSections(sections.filter((section) => section.id !== sectionId));
    } catch (error) {
      console.error("Error deleting section:", error);
      // You might want to show an error message to the user here
    }
  };

  const addTodo = async (sectionId: number, todoText: string) => {
    const { data, error } = await supabase
      .from("todos")
      .insert({ text: todoText, section_id: sectionId })
      .select()
      .single();
    if (error) {
      console.error("Error adding todo:", error);
    } else {
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? { ...section, todos: [...section.todos, data] }
            : section
        )
      );
    }
  };

  const checkTodo = async (sectionId: number, todoId: number) => {
    const { error } = await supabase.from("todos").delete().eq("id", todoId);
    if (error) {
      console.error("Error deleting todo:", error);
    } else {
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                todos: section.todos.filter((todo) => todo.id !== todoId),
              }
            : section
        )
      );
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    // If dropped outside the list
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceSection = sections.find(
      (s) => s.id.toString() === source.droppableId
    );
    const destSection = sections.find(
      (s) => s.id.toString() === destination.droppableId
    );

    if (!sourceSection || !destSection) {
      return;
    }

    const newSections = [...sections];
    const [reorderedTodo] = sourceSection.todos.splice(source.index, 1);
    destSection.todos.splice(destination.index, 0, reorderedTodo);

    setSections(newSections);

    // Update the database
    const { error } = await supabase
      .from("todos")
      .update({ section_id: parseInt(destination.droppableId, 10) })
      .eq("id", reorderedTodo.id);

    if (error) {
      console.error("Error updating todo:", error);
    }
  };

  const startEditingSection = (sectionId: number) => {
    setEditingSectionId(sectionId);
  };

  const finishEditingSection = async (sectionId: number, newTitle: string) => {
    const { error } = await supabase
      .from("sections")
      .update({ title: newTitle })
      .eq("id", sectionId);

    if (error) {
      console.error("Error updating section title:", error);
    } else {
      setSections(
        sections.map((section) =>
          section.id === sectionId ? { ...section, title: newTitle } : section
        )
      );
    }
    setEditingSectionId(null);
  };

  const startEditingTodo = (todoId: number) => {
    setEditingTodoId(todoId);
  };

  const finishEditingTodo = async (
    sectionId: number,
    todoId: number,
    newText: string
  ) => {
    const { error } = await supabase
      .from("todos")
      .update({ text: newText })
      .eq("id", todoId);

    if (error) {
      console.error("Error updating todo:", error);
    } else {
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                todos: section.todos.map((todo) =>
                  todo.id === todoId ? { ...todo, text: newText } : todo
                ),
              }
            : section
        )
      );
    }
    setEditingTodoId(null);
  };

  const handleAuth = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { user, error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        console.log(`${isSignUp ? "Signed up" : "Signed in"}:`, user);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
  };

  const addEmptyTodo = (sectionId: number) => {
    setNewTodoSectionId(sectionId);
    setNewTodoText("");
    setTimeout(() => {
      if (newTodoInputRef.current) {
        newTodoInputRef.current.focus();
      }
    }, 0);
  };

  const handleNewTodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodoText(e.target.value);
  };

  const handleNewTodoBlur = async (sectionId: number) => {
    if (newTodoText.trim() !== "") {
      await addTodo(sectionId, newTodoText);
    }
    setNewTodoSectionId(null);
    setNewTodoText("");
  };

  const handleNewTodoKeyPress = async (
    e: React.KeyboardEvent,
    sectionId: number
  ) => {
    if (e.key === "Enter") {
      await handleNewTodoBlur(sectionId);
    }
  };

  const handleExistingTodoBlur = async (
    sectionId: number,
    todoId: number,
    newText: string
  ) => {
    await finishEditingTodo(sectionId, todoId, newText);
  };

  const handleExistingTodoKeyPress = async (
    e: React.KeyboardEvent,
    sectionId: number,
    todoId: number,
    newText: string
  ) => {
    if (e.key === "Enter") {
      await handleExistingTodoBlur(sectionId, todoId, newText);
    }
  };

  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    sectionId: number,
    todoId: number
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finishEditingTodo(
        sectionId,
        todoId,
        (e.target as HTMLTextAreaElement).value
      );
    }
  };

  const handleTodoClick = (e: React.MouseEvent, todoId: number) => {
    if (!(e.target as HTMLElement).closest('a')) {
      setEditingTodoId(todoId);
    }
  };

  const handleTodoBlur = (sectionId: number, todoId: number, newText: string) => {
    finishEditingTodo(sectionId, todoId, newText);
    setEditingTodoId(null);
  };

  useEffect(() => {
    if (editingTodoId !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTodoId]);

  const renderTodoItem = (section: TodoSection, todo: Todo) => {
    if (editingTodoId === todo.id) {
      return (
        <textarea
          ref={editInputRef}
          value={todo.text}
          onChange={(e) => {
            const newText = e.target.value;
            setSections(sections.map(s => 
              s.id === section.id 
                ? {...s, todos: s.todos.map(t => 
                    t.id === todo.id ? {...t, text: newText} : t
                  )}
                : s
            ));
          }}
          onBlur={() => handleTodoBlur(section.id, todo.id, todo.text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleTodoBlur(section.id, todo.id, todo.text);
            }
          }}
          className="todo-input"
        />
      );
    }

    return (
      <div 
        className="todo-item-content"
        onClick={(e) => handleTodoClick(e, todo.id)}
      >
        {renderTextWithLinks(todo.text)}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl overflow-hidden p-6">
          <h2 className="text-2xl font-serif text-gray-800 mb-6">
            Sign Up or Sign In
          </h2>
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
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={(e) => handleAuth(e, false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Sign In
              </button>
            </div>
          </form>
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Notebook holes */}
        <div className="absolute left-4 top-4 bottom-4 flex flex-col justify-around">
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
        <div className="pl-24 pr-8 py-8 notebook-lines relative">
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            title="Sign Out"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
          </button>

          {/* Header area */}
          <div className="relative mb-12">
            <h1 className="text-4xl font-serif text-gray-800 tracking-wide">
              Elad's Notes
            </h1>
          </div>

          {/* Add Section Button */}
          <div className="notebook-line flex items-center mb-8">
            <button
              onClick={addSection}
              className="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
            >
              + Add Section
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="relative">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 group notebook-line">
                    {editingSectionId === section.id ? (
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setSections(
                            sections.map((s) =>
                              s.id === section.id
                                ? { ...s, title: newTitle }
                                : s
                            )
                          );
                        }}
                        onBlur={() =>
                          finishEditingSection(section.id, section.title)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
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
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200
                               opacity-0 group-hover:opacity-100"
                      title="Delete Section"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Todos Container */}
                  <Droppable droppableId={section.id.toString()} type="todo">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`${
                          snapshot.isDraggingOver ? "bg-blue-50" : ""
                        } space-y-2`}
                      >
                        {section.todos.map((todo, index) => (
                          <Draggable
                            key={todo.id}
                            draggableId={todo.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`notebook-line py-2 px-2 rounded
                                           hover:bg-blue-50 transition-colors duration-200 group
                                           ${
                                             snapshot.isDragging
                                               ? "bg-blue-100 shadow-md"
                                               : ""
                                           }`}
                              >
                                <div className="todo-item-container">
                                  <div className="todo-content-wrapper">
                                    <input
                                      type="checkbox"
                                      onChange={() =>
                                        checkTodo(section.id, todo.id)
                                      }
                                      className="todo-checkbox"
                                    />
                                    {renderTodoItem(section, todo)}
                                  </div>
                                  <span className="todo-timestamp">
                                    {formatCreatedAt(todo.created_at)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {newTodoSectionId === section.id && (
                          <div className="notebook-line flex items-center">
                            <div className="todo-checkbox"></div>
                            <input
                              ref={newTodoInputRef}
                              type="text"
                              value={newTodoText}
                              onChange={handleNewTodoChange}
                              onBlur={() => handleNewTodoBlur(section.id)}
                              onKeyPress={(e) =>
                                handleNewTodoKeyPress(e, section.id)
                              }
                              className="flex-1 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-gray-600 text-lg"
                              placeholder="New todo"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Todo Button */}
                  {newTodoSectionId !== section.id && (
                    <div className="notebook-line flex items-center">
                      <button
                        onClick={() => addEmptyTodo(section.id)}
                        className="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
                      >
                        + Add
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;
