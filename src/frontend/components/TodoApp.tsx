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
import { shortenUrl } from "../utils/urlUtils";
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
  ArrowPathIcon,
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
  order: number;
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

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="todo-app">
      {[1, 2].map((section) => (
        <div key={section} className="skeleton-section">
          <div className="skeleton skeleton-title"></div>
          {[1, 2, 3].map((todo) => (
            <div key={todo} className="skeleton skeleton-todo"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

const TodoApp: React.FC = () => {
  console.log("Rendering TodoApp component");
  const [sections, setSections] = useState<TodoSection[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoSectionId, setNewTodoSectionId] = useState<number | null>(null);
  const [newTodoText, setNewTodoText] = useState<string>("");
  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [isOffline] = useState(!navigator.onLine);
  const [completingTodoId, setCompletingTodoId] = useState<number | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState<string>("");

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

    const combinedData = sectionsData.map((section) => ({
      ...section,
      todos: todosData.filter((todo) => todo.section_id === section.id),
    }));

    setSections(combinedData);

    // Save fetched data to local storage
    for (const section of sectionsData) {
      await saveLocalSection(section);
    }
    for (const todo of todosData) {
      await saveLocalTodo(todo);
    }
  }, [user]);

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

    return () => {
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      if (!navigator.onLine) {
        const localSections = await getLocalSections();
        const localTodos = await getLocalTodos();
        if (localSections?.length > 0 && localTodos?.length > 0) {
          setSections(
            localSections.map((section) => ({
              ...section,
              todos: localTodos.filter(
                (todo) => todo.section_id === section.id
              ),
            }))
          );
        }
      } else {
        await fetchSections();
      }
    };

    loadData();
  }, [user, fetchSections]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchSections();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, fetchSections]);

  const addTodo = async (sectionId: number, todoText: string) => {
    try {
      const { data: newTodo, error } = await supabase
        .from("todos")
        .insert({ text: todoText, section_id: sectionId })
        .select()
        .single();

      if (error) throw error;

      if (newTodo) {
        setSections((prevSections) =>
          prevSections.map((section) =>
            section.id === sectionId
              ? { ...section, todos: [...section.todos, newTodo] }
              : section
          )
        );
        await saveLocalTodo(newTodo);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding todo:", error);
      return false;
    }
  };

  const handleNewTodoBlur = async (sectionId: number) => {
    const text = newTodoText.trim();
    if (text) {
      const success = await addTodo(sectionId, text);
      if (success) {
        setNewTodoText("");
        setNewTodoSectionId(null);
      }
    } else {
      setNewTodoSectionId(null);
    }
  };

  const handleNewTodoKeyPress = async (
    e: React.KeyboardEvent,
    sectionId: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = newTodoText.trim();
      if (text) {
        const success = await addTodo(sectionId, text);
        if (success) {
          setNewTodoText("");
          setNewTodoSectionId(null);
        }
      }
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

  const checkTodo = async (sectionId: number, todoId: number) => {
    // Set the completing state to trigger animation
    setCompletingTodoId(todoId);

    // Wait for animation to complete before updating state
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("todos")
      .update({ completed: true, completed_at: now })
      .eq("id", todoId)
      .select()
      .single();

    // Wait for the animation to complete
    await new Promise((resolve) => setTimeout(resolve, 400));

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
    setCompletingTodoId(null);
  };

  const deleteTodo = async (sectionId: number, todoId: number) => {
    try {
      const { error } = await supabase.from("todos").delete().eq("id", todoId);

      if (error) throw error;

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
    } catch (error) {
      console.error("Error deleting todo:", error);
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

  const handleSync = async () => {
    if (!user) return;

    try {
      console.log("Starting sync...");
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("sections")
        .select("*")
        .order("order");

      if (sectionsError) throw sectionsError;
      console.log("Fetched sections:", sectionsData);

      const { data: todosData, error: todosError } = await supabase
        .from("todos")
        .select("*")
        .order("id");

      if (todosError) throw todosError;
      console.log("Fetched todos:", todosData);

      // Clear and update local database
      const db = await openLocalDatabase();

      // Create separate transactions for clearing and updating
      const clearTransaction = db.transaction(
        ["sections", "todos"],
        "readwrite"
      );
      console.log("Clearing local data...");

      try {
        await Promise.all([
          clearTransaction.objectStore("sections").clear(),
          clearTransaction.objectStore("todos").clear(),
        ]);
        await new Promise((resolve) => {
          clearTransaction.oncomplete = resolve;
        });
        console.log("Local data cleared successfully");
      } catch (error) {
        console.error("Error clearing local data:", error);
        throw error;
      }

      // Create new transaction for saving
      const saveTransaction = db.transaction(
        ["sections", "todos"],
        "readwrite"
      );
      console.log("Saving new data...");

      try {
        const promises = [
          ...sectionsData.map((section) =>
            saveTransaction.objectStore("sections").add(section)
          ),
          ...todosData.map((todo) =>
            saveTransaction.objectStore("todos").add(todo)
          ),
        ];

        await Promise.all(promises);
        await new Promise((resolve) => {
          saveTransaction.oncomplete = resolve;
        });
        console.log("New data saved successfully");
      } catch (error) {
        console.error("Error saving new data:", error);
        throw error;
      }

      // Update state
      const combinedData = sectionsData.map((section) => ({
        ...section,
        todos: todosData.filter((todo) => todo.section_id === section.id),
      }));
      console.log("Updating React state with:", combinedData);
      setSections(combinedData);

      console.log("Sync completed successfully");
    } catch (error) {
      console.error("Error syncing data:", error);
    }
  };

  const renderAddTodoInput = (sectionId: number) => {
    if (newTodoSectionId !== sectionId) return null;
    return (
      <input
        ref={newTodoInputRef}
        type="text"
        value={newTodoText}
        onChange={(e) => setNewTodoText(e.target.value)}
        onBlur={() => handleNewTodoBlur(sectionId)}
        onKeyPress={(e) => handleNewTodoKeyPress(e, sectionId)}
        className="new-todo-input"
        placeholder="What needs to be done?"
        autoFocus
      />
    );
  };

  const renderAddTodoLink = (sectionId: number) => {
    if (newTodoSectionId === sectionId) return null;
    return (
      <button
        className="add-item-link"
        onClick={() => setNewTodoSectionId(sectionId)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Add Item
      </button>
    );
  };

  const renderAddSection = () => {
    if (editingSectionId === -1) {
      return (
        <div className="add-section">
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onBlur={handleAddSection}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddSection();
              }
            }}
            className="new-todo-input"
            placeholder="Enter section title..."
            autoFocus
          />
        </div>
      );
    }

    return (
      <button className="add-button" onClick={() => setEditingSectionId(-1)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Add Section
      </button>
    );
  };

  const handleAddSection = async () => {
    try {
      // Get the minimum order value and subtract 1 to place at top
      const minOrder = Math.min(...sections.map((s) => s.order || 0), 0);
      const newOrder = minOrder - 1;

      const result = await supabase
        .from("sections")
        .insert({ title: newSectionTitle || "New Section", order: newOrder })
        .select()
        .single();

      if (result.error) {
        console.error("Error adding section:", result.error);
        return;
      }

      setSections((prevSections) =>
        [...prevSections, { ...result.data, todos: [] }].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        )
      );
      setEditingSectionId(null);
      setNewSectionTitle("");
    } catch (error) {
      console.error("Error adding section:", error);
    }
  };

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

  const getAgeBadgeClass = (weeks: number): string => {
    if (weeks <= 0) return "";
    if (weeks >= 9) return "age-badge-older";
    return `age-badge-${weeks}`;
  };

  const renderTodoItem = (section: TodoSection, todo: Todo) => {
    const isCompleting = completingTodoId === todo.id;
    const currentDate = new Date(); // This will use the system's current time
    const createdDate = parseISO(todo.created_at);

    // Calculate the exact difference in days and convert to weeks
    const diffInDays = Math.floor(
      (currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Round to nearest week instead of floor
    const weeksOld = Math.round(diffInDays / 7);

    console.log(
      "Todo:",
      todo.text,
      "Created:",
      todo.created_at,
      "Days old:",
      diffInDays,
      "Weeks:",
      weeksOld
    );

    return (
      <div
        className={`todo-item-container ${todo.completed ? "opacity-50" : ""} ${
          isCompleting ? "completing" : ""
        }`}
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
              onChange={(e) => {
                const newText = e.target.value;
                setSections(
                  sections.map((s) =>
                    s.id === section.id
                      ? {
                          ...s,
                          todos: s.todos.map((t) =>
                            t.id === todo.id ? { ...t, text: newText } : t
                          ),
                        }
                      : s
                  )
                );
              }}
              onBlur={() => finishEditingTodo(section.id, todo.id, todo.text)}
              onKeyPress={(e) =>
                handleTodoKeyPress(e, section.id, todo.id, todo.text)
              }
              className="todo-input"
              autoFocus
            />
          ) : (
            <div
              className={`todo-item-content ${
                todo.completed ? "todo-completed" : ""
              }`}
              onClick={(e) => handleTodoClick(e, todo.id)}
            >
              <span className="todo-text-content">
                {renderTextWithLinks(todo.text)}
              </span>
              {weeksOld > 0 && (
                <span className={`age-badge ${getAgeBadgeClass(weeksOld)}`}>
                  {weeksOld}w
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => deleteTodo(section.id, todo.id)}
            className="ml-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
            title="Delete Todo"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
        <span className="todo-timestamp">
          {todo.completed
            ? `Completed: ${formatCreatedAt(todo.completed_at!)}`
            : formatCreatedAt(todo.created_at)}
        </span>
      </div>
    );
  };

  const handleTodoClick = (e: React.MouseEvent, todoId: number) => {
    if (!(e.target as HTMLElement).closest("a")) {
      setEditingTodoId(todoId);
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

  useEffect(() => {
    if (editingTodoId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.style.height = "32px"; // Set to one line height
      editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
    }
  }, [editingTodoId]);

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

  if (!user) {
    return (
      <div data-testid="todo-app" className="min-h-screen py-12 px-6">
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

  if (isLoading) {
    return <LoadingSkeleton />;
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

  return (
    <div data-testid="todo-app" className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Main content container */}
        <div className="py-8 px-4 relative">
          {/* Offline indicator */}
          {isOffline && (
            <div className="offline-indicator" role="alert">
              <p className="title">Offline Mode</p>
              <p>
                You're currently working offline. Changes will be synced when
                you're back online.
              </p>
            </div>
          )}

          {/* Sign Out Button (only show when online) */}
          {!isOffline && user && (
            <div className="flex gap-2 absolute top-4 right-4">
              <button
                onClick={handleSync}
                className="flex items-center px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                title="Sync with server"
              >
                <ArrowPathIcon className="w-5 h-5 mr-1" />
                Sync
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1" />
                Sign Out
              </button>
            </div>
          )}

          {/* Header area */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">My Tasks</h1>
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
            {renderAddSection()}
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-4">
              {filteredSections.map((section, index) => (
                <div key={section.id} className="todo-section">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 group">
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
                        className="text-2xl font-medium text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <h2
                        className="section-title"
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
                                className={`todo-item ${
                                  snapshot.isDragging ? "dragging" : ""
                                } ${
                                  completingTodoId === todo.id
                                    ? "completing"
                                    : ""
                                }`}
                              >
                                {renderTodoItem(section, todo)}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {renderAddTodoInput(section.id)}
                        {!newTodoSectionId && renderAddTodoLink(section.id)}
                      </div>
                    )}
                  </Droppable>
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
