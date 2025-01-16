import React, { useState, useEffect, useRef, useCallback } from "react";
import "./todo-styles.css";
import supabase, { signUp, signIn } from "../../supabaseClient";
import {
  openLocalDatabase,
  getLocalSections,
  getLocalTodos,
  saveLocalSection,
  saveLocalTodo,
} from "../../utils/localDatabase";
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
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
// import { User } from "@supabase/supabase-js";

const ChainIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="inline-block mr-1 mb-1"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

interface Todo {
  id: number;
  text: string;
  created_at: string; // This is the PostgreSQL timestamp string
  completed: boolean;
  completed_at: string | null;
}

interface TodoSection {
  id: number;
  title: string;
  todos: Todo[];
}

const SlackPreview: React.FC<SlackPreviewProps> = ({ url }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/slack-preview?url=${encodeURIComponent(url)}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPreview(data.preview);
      } catch (error) {
        console.error("Error fetching Slack preview:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (isLoading) return <div>Loading preview...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!preview) return null;

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-md shadow-lg max-w-md">
      <p className="text-sm text-gray-600">{preview}</p>
    </div>
  );
};

interface SlackPreviewProps {
  url: string;
}

import { shortenUrl } from '../utils/urlUtils';

const TodoApp: React.FC = () => {
  console.log("Rendering TodoApp component");
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
  const [showCompleted, setShowCompleted] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [isOffline] = useState(!navigator.onLine);

  const fetchSections = useCallback(async () => {
    if (!user) return;

    const { data: sectionsData, error: sectionsError } = await supabase
      .from("sections")
      .select("*")
      .order("order");

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError);
      return;
    }

    const { data: todosData, error: todosError } = await supabase
      .from("todos")
      .select("*")
      .order("id");

    if (todosError) {
      console.error("Error fetching todos:", todosError);
      return;
    }

    const combinedData = combineData(sectionsData, todosData);
    setSections(combinedData);

    // Save fetched data to local storage
    for (const section of sectionsData) {
      await saveLocalSection(section);
    }
    for (const todo of todosData) {
      await saveLocalTodo(todo);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    const localSections = await getLocalSections();
    const localTodos = await getLocalTodos();

    if (localSections?.length > 0 && localTodos?.length > 0) {
      setSections(combineData(localSections, localTodos));
    } else if (navigator.onLine) {
      await fetchSections();
    }
  }, [fetchSections]);

  useCallback(async () => {
    if (isOffline) return;

    const localSections = await getLocalSections();
    const localTodos = await getLocalTodos();

    // Sync sections
    for (const localSection of localSections) {
      const { data: serverSection, error } = await supabase
        .from("sections")
        .select("*")
        .eq("id", localSection.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching server section:", error);
        continue;
      }

      if (
        !serverSection ||
        new Date(localSection.last_edited) > new Date(serverSection.last_edited)
      ) {
        const { error: upsertError } = await supabase
          .from("sections")
          .upsert(localSection, { onConflict: "id" });

        if (upsertError) console.error("Error syncing section:", upsertError);
      } else {
        await saveLocalSection(serverSection);
      }
    }

    // Sync todos (similar to sections)
    for (const localTodo of localTodos) {
      const { data: serverTodo, error } = await supabase
        .from("todos")
        .select("*")
        .eq("id", localTodo.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching server todo:", error);
        continue;
      }

      if (
        !serverTodo ||
        new Date(localTodo.last_edited) > new Date(serverTodo.last_edited)
      ) {
        const { error: upsertError } = await supabase
          .from("todos")
          .upsert(localTodo, { onConflict: "id" });

        if (upsertError) console.error("Error syncing todo:", upsertError);
      } else {
        await saveLocalTodo(serverTodo);
      }
    }

    // Fetch latest data from server
    await fetchSections();
  }, [isOffline, fetchSections]);

  useEffect(() => {
    const initializeApp = async () => {
      await openLocalDatabase();
      if (navigator.onLine) {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;
          setUser(data?.user || null);
        } catch (error) {
          console.error("Error fetching user:", error);
          setUser(null);
        }
      }
    };

    let authListener: {
      data: { subscription: { unsubscribe: () => void } };
    } | null = null;

    try {
      authListener = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null);
      });
    } catch (error) {
      console.error("Error setting up auth listener:", error);
    }

    initializeApp();
    loadData();

    return () => {
      authListener?.data.subscription.unsubscribe();
    };
  }, [loadData]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const combineData = (sections: any[], todos: any[]): TodoSection[] => {
    return sections.map((section) => ({
      ...section,
      todos: todos.filter((todo) => todo.section_id === section.id),
    }));
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
    const sectionToDelete = sections.find(
      (section) => section.id === sectionId
    );
    if (!sectionToDelete) return;

    if (sectionToDelete.todos.length > 0) {
      const confirmDelete = window.confirm(
        `This section contains ${sectionToDelete.todos.length} todo item(s). Are you sure you want to delete this section and all its todos?`
      );
      if (!confirmDelete) return;
    }

    try {
      // Delete all todos in the section
      await supabase.from("todos").delete().eq("section_id", sectionId);

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
    const { data: newTodo, error } = await supabase
      .from("todos")
      .insert({ text: todoText, section_id: sectionId })
      .select()
      .single();
    if (error) {
      console.error("Error adding todo:", error);
    } else if (newTodo) {
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? { ...section, todos: [...section.todos, newTodo] }
            : section
        )
      );
    }
  };

  const checkTodo = async (sectionId: number, todoId: number) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("todos")
      .update({ completed: true, completed_at: now })
      .eq("id", todoId)
      .select()
      .single();

    if (error) {
      console.error("Error updating todo:", error);
    } else {
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                todos: section.todos.map((todo) =>
                  todo.id === todoId
                    ? { ...todo, completed: true, completed_at: now }
                    : todo
                ),
              }
            : section
        )
      );
    }
  };

  const toggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  const filteredSections = sections.map((section) => ({
    ...section,
    todos: section.todos.filter((todo) => showCompleted || !todo.completed),
  }));

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
      const { user: authUser, error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        console.log(`${isSignUp ? "Signed up" : "Signed in"}:`, authUser);
        setUser(authUser);
        await loadData();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      setUser(null);
      setSections([]);
    }
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

  const handleTodoKeyPress = async (
    e: React.KeyboardEvent,
    sectionId: number,
    todoId: number,
    newText: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await finishEditingTodo(sectionId, todoId, newText);
    }
  };

  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = "32px"; // Set to one line height
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleTodoChange = (
    sectionId: number,
    todoId: number,
    newText: string
  ) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              todos: s.todos.map((t) =>
                t.id === todoId ? { ...t, text: newText } : t
              ),
            }
          : s
      )
    );
    if (editInputRef.current) {
      autoResizeTextarea(editInputRef.current);
    }
  };

  const handleTodoClick = (e: React.MouseEvent, todoId: number) => {
    if (!(e.target as HTMLElement).closest("a")) {
      setEditingTodoId(todoId);
    }
  };

  const handleTodoBlur = (
    sectionId: number,
    todoId: number,
    newText: string
  ) => {
    finishEditingTodo(sectionId, todoId, newText);
    setEditingTodoId(null);
  };

  useEffect(() => {
    if (editingTodoId !== null && editInputRef.current) {
      editInputRef.current.focus();
      autoResizeTextarea(editInputRef.current);
    }
  }, [editingTodoId]);

  const formatCreatedAt = (timestamp: string) => {
    return format(parseISO(timestamp), "MMM d, yyyy 'at' h:mm a");
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <React.Fragment key={index}>
            <a
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="todo-link"
            >
              <ChainIcon />
              {shortenUrl(part)}
            </a>
            <SlackPreview url={part} />
          </React.Fragment>
        );
      }
      return part;
    });
  };

  const renderTodoItem = (section: TodoSection, todo: Todo) => {
    return (
      <div
        className={`todo-item-container ${todo.completed ? "opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => checkTodo(section.id, todo.id)}
          className="todo-checkbox"
        />
        <div className="todo-content-wrapper">
          {editingTodoId === todo.id ? (
            <textarea
              ref={editInputRef}
              value={todo.text}
              onChange={(e) =>
                handleTodoChange(section.id, todo.id, e.target.value)
              }
              onBlur={(e) =>
                handleTodoBlur(section.id, todo.id, e.target.value)
              }
              onKeyPress={(e) =>
                handleTodoKeyPress(e, section.id, todo.id, todo.text)
              }
              className="w-full p-2 border rounded"
              autoFocus
            />
          ) : (
            <div
              className={`todo-item-content ${
                todo.completed ? "todo-completed" : ""
              }`}
              onClick={(e) => handleTodoClick(e, todo.id)}
            >
              {renderTextWithLinks(todo.text)}
            </div>
          )}
        </div>
        <span className="todo-timestamp">
          {todo.completed
            ? `Completed: ${formatCreatedAt(todo.completed_at!)}`
            : formatCreatedAt(todo.created_at)}
        </span>
      </div>
    );
  };

  if (!user) {
    return (
      <div
        data-testid="todo-app"
        className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-6"
      >
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

  // Add this custom Toggle component
  const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({
    checked,
    onChange,
  }) => (
    <div
      className={`relative inline-block w-10 h-6 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
      onClick={onChange}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 transition-transform duration-200 ease-in-out transform bg-white rounded-full ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </div>
  );

  const reorderSection = async (
    sectionId: number,
    direction: "up" | "down"
  ) => {
    const currentIndex = sections.findIndex(
      (section) => section.id === sectionId
    );
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === sections.length - 1)
    ) {
      return; // Can't move further in this direction
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newSections = [...sections];
    const [movedSection] = newSections.splice(currentIndex, 1);
    newSections.splice(newIndex, 0, movedSection);

    setSections(newSections);

    // Update the order in the database
    try {
      await Promise.all(
        newSections.map((section, index) =>
          supabase
            .from("sections")
            .update({ order: index })
            .eq("id", section.id)
        )
      );
    } catch (error) {
      console.error("Error updating section order:", error);
      // Optionally, revert the state if the database update fails
      setSections(sections);
    }
  };

  return (
    <div
      data-testid="todo-app"
      className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-6"
    >
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
          {/* Offline indicator */}
          {isOffline && (
            <div
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
              role="alert"
            >
              <p className="font-bold">Offline Mode</p>
              <p>
                You're currently working offline. Changes will be synced when
                you're back online.
              </p>
            </div>
          )}

          {/* Sign Out Button (only show when online) */}
          {!isOffline && user && (
            <button
              onClick={handleSignOut}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title="Sign Out"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </button>
          )}

          {/* Header area */}
          <div className="relative mb-12">
            <h1 className="text-4xl font-serif text-gray-800 tracking-wide">
              Elad's Notes
            </h1>
          </div>

          {/* Controls line */}
          <div className="flex items-center mb-8 border-b border-gray-200 pb-2">
            {/* Filters dropdown */}
            <div className="relative" ref={filtersRef}>
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
              >
                Filters ▼
              </button>
              {isFiltersOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 flex items-center justify-between">
                      <span>Show completed</span>
                      <Toggle
                        checked={showCompleted}
                        onChange={toggleShowCompleted}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Section Button */}
          <div className="notebook-line flex items-center mb-4">
            <button
              onClick={addSection}
              className="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium"
            >
              + Add Section
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-4">
              {filteredSections.map((section, index) => (
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => reorderSection(section.id, "up")}
                        className="text-gray-400 hover:text-blue-500 transition-colors duration-200
                                   opacity-0 group-hover:opacity-100"
                        title="Move Section Up"
                        disabled={index === 0}
                      >
                        <ChevronUpIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => reorderSection(section.id, "down")}
                        className="text-gray-400 hover:text-blue-500 transition-colors duration-200
                                   opacity-0 group-hover:opacity-100"
                        title="Move Section Down"
                        disabled={index === filteredSections.length - 1}
                      >
                        <ChevronDownIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-200
                                   opacity-0 group-hover:opacity-100"
                        title="Delete Section"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
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
                                {renderTodoItem(section, todo)}
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
