// Import React explicitly if using JSX
import React, { useState, useEffect, useRef, useCallback } from 'react';
import "./todo-styles.css";
import supabase, { 
  signUp, 
  signIn, 
  getTodosTable, 
  getSectionsTable,
  Todo,
  Section,
  TodoSection
} from "../utils/supabaseClient";
import {
  openLocalDatabase,
  getLocalSections,
  getLocalTodos,
  saveLocalSection,
  saveLocalTodo,
  deleteLocalSection,
  deleteLocalTodo,
} from "../../utils/localDatabase";
import { shortenUrl } from "../utils/urlUtils";
import { format, parseISO, isValid, parse, formatDistanceToNow } from "date-fns";
import {
  ArrowRightOnRectangleIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface SlackPreviewProps {
  url: string;
}

interface AuthListener {
  data: {
    subscription: {
      unsubscribe: () => void;
    };
  };
}

const ChainIcon: React.FC = () => (
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

interface TodoAppProps {
  basename?: string;
}

const TodoApp: React.FC<TodoAppProps> = ({ basename }) => {
  console.log("Rendering TodoApp component");
  const [sections, setSections] = useState<TodoSection[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingDateId, setEditingDateId] = useState<number | null>(null);
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
  const [timeRefresh, setTimeRefresh] = useState(0);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);

  const fetchSections = useCallback(async () => {
    if (!user) return;

    const { data: rawSections, error: sectionsError } = await getSectionsTable(user.id)
      .select("*")
      .order('order', { ascending: true });

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError);
      return;
    }

    const { data: rawTodos, error: todosError } = await getTodosTable(user.id)
      .select("*")
      .order('id', { ascending: true });

    if (todosError) {
      console.error("Error fetching todos:", todosError);
      return;
    }

    // Ensure we have arrays even if data is null
    const sections = (rawSections || []) as Section[];
    const todos = (rawTodos || []) as Todo[];

    const combinedData: TodoSection[] = sections.map(section => ({
      id: section.id,
      title: section.title,
      order: section.order,
      user_id: section.user_id,
      todos: todos.filter(todo => todo.section_id === section.id)
    }));

    setSections(combinedData);
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

    let authListener: AuthListener | null = null;

    try {
      authListener = supabase.auth.onAuthStateChange((event: string, session: any) => {
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
    if (!user) return false;
    
    try {
      const { data: newTodo, error } = await getTodosTable()
        .insert({ 
          text: todoText, 
          section_id: sectionId,
          user_id: user.id,
          completed: false,
          created_at: new Date().toISOString()
        })
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

  const TodoInput: React.FC<{ sectionId: number }> = ({ sectionId }) => {
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
      if (e.key === 'Enter' && inputRef.current?.value.trim()) {
        void addTodo(sectionId, inputRef.current.value.trim());
        setIsEditing(false);
      }
    };

    const handleAddTodo = () => {
      setIsEditing(true);
    };

    return (
      <div className="todo-input-container">
        {!isEditing ? (
          <div 
            className="todo-placeholder" 
            onClick={handleAddTodo}
          >
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

  const startEditingSection = (sectionId: number) => {
    setEditingSectionId(sectionId);
  };

  const finishEditingSection = async (sectionId: number, newTitle: string) => {
    setEditingSectionId(null);
    if (!newTitle.trim()) return;

    try {
      const { error } = await getSectionsTable()
        .update({ title: newTitle.trim() })
        .eq('id', sectionId);

      if (error) throw error;

      setSections((prevSections) =>
        prevSections.map((section) =>
          section.id === sectionId
            ? { ...section, title: newTitle.trim() }
            : section
        )
      );
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  const addSection = async (title: string) => {
    if (!title.trim() || !user) return;

    try {
      const maxOrder = Math.max(0, ...sections.map((s) => s.order));
      const newSection = {
        title: title.trim(),
        order: maxOrder + 1,
        user_id: user.id
      };

      const { data: insertedSection, error } = await getSectionsTable()
        .insert(newSection)
        .select()
        .single();

      if (error) throw error;
      if (!insertedSection) throw new Error("No section returned from insert");

      const newTodoSection: TodoSection = {
        id: insertedSection.id,
        title: insertedSection.title,
        order: insertedSection.order,
        user_id: insertedSection.user_id,
        todos: []
      };

      setSections((prevSections) => [...prevSections, newTodoSection]);
    } catch (error) {
      console.error("Error adding section:", error);
    }
  };

  const deleteSection = async (sectionId: number) => {
    try {
      const { error } = await getSectionsTable()
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      setSections((prevSections) =>
        prevSections.filter((section) => section.id !== sectionId)
      );
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const checkTodo = async (sectionId: number, todoId: number) => {
    // Set the completing state to trigger animation
    setCompletingTodoId(todoId);

    // Wait for animation to complete before updating state
    const now = new Date().toISOString();
    const { error } = await getTodosTable()
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
      const { error } = await getTodosTable()
        .delete()
        .eq("id", todoId);

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

  const finishEditingTodo = async (
    sectionId: number,
    todoId: number,
    newText: string
  ) => {
    const { error } = await getTodosTable()
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

  const startEditingDate = (todoId: number) => {
    setEditingDateId(todoId);
  };

  const finishEditingDate = async (sectionId: number, todoId: number, newDateStr: string) => {
    // Try to parse the date string
    const parsedDate = parse(newDateStr, "yyyy-MM-dd", new Date());
    
    if (!isValid(parsedDate)) {
      alert("Please enter a valid date in the format YYYY-MM-DD");
      return;
    }

    const isoDate = parsedDate.toISOString();
    
    const { error } = await getTodosTable()
      .update({ created_at: isoDate })
      .eq("id", todoId);

    if (error) {
      console.error("Error updating todo date:", error);
      alert("Failed to update the date. Please try again.");
    } else {
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                todos: section.todos.map((todo) =>
                  todo.id === todoId
                    ? { ...todo, created_at: isoDate }
                    : todo
                ),
              }
            : section
        )
      );
    }
    setEditingDateId(null);
  };

  const handleAuth = async (e: React.FormEvent, isSignUp: boolean): Promise<void> => {
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
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsUserPanelOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSync = async () => {
    if (!user) return;

    try {
      console.log("Starting sync...");
      const { data: sectionsData, error: sectionsError } = await getSectionsTable(user.id)
        .select("*")
        .order("order");

      if (sectionsError) throw sectionsError;
      console.log("Fetched sections:", sectionsData);

      const { data: todosData, error: todosError } = await getTodosTable(user.id)
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
          ...sectionsData.map((section: Section) =>
            saveTransaction.objectStore("sections").add({
              ...section,
              last_edited: new Date().toISOString()
            })
          ),
          ...todosData.map((todo: Todo) =>
            saveTransaction.objectStore("todos").add({
              ...todo,
              last_edited: new Date().toISOString()
            })
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
      const combinedData = sectionsData.map((section: Section) => ({
        ...section,
        todos: todosData.filter((todo: Todo) => todo.section_id === section.id),
      }));
      console.log("Updating React state with:", combinedData);
      setSections(combinedData);

      console.log("Sync completed successfully");
    } catch (error) {
      console.error("Error syncing data:", error);
    }
  };

  const isRecentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const distance = formatDistanceToNow(date);
    return distance.includes('minute') || distance.includes('hour');
  };

  const hasRecentItems = useCallback(() => {
    return sections.some(section =>
      section.todos.some(todo => 
        isRecentDate(todo.created_at) || (todo.completed && isRecentDate(todo.completed_at!))
      )
    );
  }, [sections]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (hasRecentItems()) {
      intervalId = setInterval(() => {
        setTimeRefresh(prev => prev + 1);
      }, 60000); // Update every minute
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hasRecentItems]);

  const formatTimeAgo = (dateStr: string) => {
    const date = parseISO(dateStr);
    const distance = formatDistanceToNow(date, { addSuffix: true });
    
    // Replace "1 day ago" with "yesterday"
    if (distance === "1 day ago") {
      return "yesterday";
    }
    
    // Remove "about" from hour-based times
    if (distance.includes("hours ago")) {
      return distance.replace("about ", "");
    }
    
    return distance;
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
        <div className="todo-main-content">
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
                  // Auto-resize the textarea
                  e.target.style.height = '0px';
                  e.target.style.height = e.target.scrollHeight + 'px';
                  const length = e.target.value.length;
                  e.target.setSelectionRange(length, length);
                }}
                onBlur={() => finishEditingTodo(section.id, todo.id, todo.text)}
                onKeyPress={(e) =>
                  handleTodoKeyPress(e, section.id, todo.id, todo.text)
                }
                className="todo-input"
                autoFocus
                rows={1}
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
                  {weeksOld > 0 && (
                    <span className={`age-badge ${getAgeBadgeClass(weeksOld)}`}>
                      {weeksOld}w
                    </span>
                  )}
                </span>
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
        </div>
        <div className="todo-date">
          {editingDateId === todo.id ? (
            <input
              type="text"
              defaultValue={format(parseISO(todo.created_at), "yyyy-MM-dd")}
              onBlur={(e) => finishEditingDate(section.id, todo.id, e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  finishEditingDate(section.id, todo.id, e.currentTarget.value);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <span 
              onClick={() => startEditingDate(todo.id)}
              title={format(parseISO(todo.completed ? todo.completed_at! : todo.created_at), "MMM d, yyyy 'at' h:mm a")}
            >
              {todo.completed 
                ? `Completed ${formatTimeAgo(todo.completed_at!)}`
                : formatTimeAgo(todo.created_at)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleTodoClick = (e: React.MouseEvent, todoId: number) => {
    if (!(e.target as HTMLElement).closest("a")) {
      setEditingTodoId(todoId);
    }
  };

  const handleTodoKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    sectionId: number,
    todoId: number,
    newText: string
  ): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditingTodo(sectionId, todoId, newText);
    }
  };

  useEffect(() => {
    if (editingTodoId !== null && editInputRef.current) {
      const input = editInputRef.current;
      input.focus();
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
      const length = input.value.length;
      input.setSelectionRange(length, length);
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
          getSectionsTable()
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

  const DevBanner: React.FC = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="bg-yellow-400 text-black text-sm py-1 px-2 text-center font-medium">
        Development Environment
      </div>
    );
  };

  const toggleUserPanel = () => {
    setIsUserPanelOpen(!isUserPanelOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeleton />
      </div>
    );
  }

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

  // Add this custom Toggle component
  const Toggle: React.FC<{
    checked: boolean;
    onChange: () => void;
  }> = ({ checked, onChange }) => (
    <div
      className={`relative inline-block w-10 h-6 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 transition-transform duration-200 ease-in-out transform bg-white rounded-full ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </div>
  );

  return (
    <div data-testid="todo-app" className="min-h-screen bg-gray-100">
      <DevBanner />
      {user && (
        <div className="absolute top-4 right-4 z-50">
          <div className="relative">
            <button 
              onClick={toggleUserPanel} 
              className="rounded-full bg-blue-400 text-white w-10 h-10 flex items-center justify-center hover:bg-blue-500 focus:outline-none"
            >
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </button>
            
            {isUserPanelOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-200 p-4">
                <div className="text-sm font-semibold mb-2 text-gray-700">
                  {user.email}
                </div>
                <button 
                  onClick={handleSignOut}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
            {/* Removed renderAddSection() */}
          </div>

          <div className="space-y-4">
            {filteredSections.map((section: TodoSection, index: number) => (
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
                <div className="space-y-2">
                  {section.todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`todo-item ${editingTodoId === todo.id ? 'editing' : ''}`}
                    >
                      {renderTodoItem(section, todo)}
                    </div>
                  ))}
                  <TodoInput sectionId={section.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;
