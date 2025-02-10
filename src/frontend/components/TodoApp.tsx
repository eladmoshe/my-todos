// Import React explicitly if using JSX
import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo 
} from "react";
import "./todo-styles.css";
import supabase, {
  signUp,
  signIn,
  getTodosTable,
  getSectionsTable,
  Todo,
  Section,
  TodoSection,
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
import {
  shortenUrl
} from "../utils/urlUtils";
import {
  format,
  parseISO,
  isValid,
  parse,
  formatDistanceToNow,
} from "date-fns";
import { 
  ArrowRightOnRectangleIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { 
  ChainIcon, 
  SlackPreview 
} from './todo/UtilityComponents';
import { TodoInput } from './todo/TodoInput';
import { SectionInput } from './todo/SectionInput';

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

interface TodoAppProps {
  basename?: string;
}

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, newText: string) => void;
}

interface SectionProps {
  section: TodoSection;
  onAddTodo: (sectionId: number, text: string) => void;
  onDeleteSection: (sectionId: number) => void;
  onEditSection: (sectionId: number, newTitle: string) => void;
}

const TodoApp: React.FC<TodoAppProps> = ({ basename }) => {
  console.log("Rendering TodoApp component");
  const [sections, setSections] = useState<TodoSection[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingDateId, setEditingDateId] = useState<number | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoSectionId, setNewTodoSectionId] = useState<number | null>(null);
  const [newTodoText, setNewTodoText] = useState<string>("");
  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [isOffline] = useState(!navigator.onLine);
  const [completingTodoId, setCompletingTodoId] = useState<number | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState<string>("");
  const [timeRefresh, setTimeRefresh] = useState(0);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchSections = useCallback(async () => {
    if (!user) return;

    try {
      const { data: rawSections, error: sectionsError } = await getSectionsTable(
        user.id
      )
        .select("*")
        .order("order", { ascending: true });

      if (sectionsError) {
        throw new Error(sectionsError.message);
      }

      const { data: rawTodos, error: todosError } = await getTodosTable(
        user.id
      )
        .select("*")
        .order("id", { ascending: true });

      if (todosError) {
        throw new Error(todosError.message);
      }

      const sections = (rawSections || []) as Section[];
      const todos = (rawTodos || []) as Todo[];

      const combinedData: TodoSection[] = sections.map((section) => ({
        id: section.id,
        title: section.title,
        order: section.order,
        user_id: section.user_id,
        todos: todos.filter((todo) => todo.section_id === section.id),
      }));

      setSections(combinedData);
    } catch (err) {
      console.error("Error fetching sections and todos:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
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

    let authListener: AuthListener | null = null;

    try {
      authListener = supabase.auth.onAuthStateChange(
        (event: string, session: any) => {
          setUser(session?.user || null);
        }
      );
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

  const handleAddTodo = useCallback((sectionId: number, text: string) => {
    if (!user) return;

    const newTodo: Todo = {
      id: Date.now(), // Temporary client-side ID
      text,
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      section_id: sectionId,
      user_id: user.id
    };

    // Optimistically update the UI
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
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
              section.id === sectionId 
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
            section.id === sectionId 
              ? { ...section, todos: section.todos.filter(todo => todo.id !== newTodo.id) } 
              : section
          )
        );
      }
    };

    saveTodoToDatabase();
  }, [user]);

  const startEditingSection = (sectionId: number) => {
    setEditingSectionId(sectionId);
  };

  const finishEditingSection = async (sectionId: number, newTitle: string) => {
    setEditingSectionId(null);
    if (!newTitle.trim()) return;

    try {
      const { error } = await getSectionsTable()
        .update({ title: newTitle.trim() })
        .eq("id", sectionId);

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
        user_id: user.id,
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
        todos: [],
      };

      setSections((prevSections) => [...prevSections, newTodoSection]);
    } catch (error) {
      console.error("Error adding section:", error);
    }
  };

  const deleteSection = async (sectionId: number) => {
    try {
      const { error } = await getSectionsTable().delete().eq("id", sectionId);

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
      const { error } = await getTodosTable().delete().eq("id", todoId);

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

  const handleSync = async () => {
    if (!user) return;

    try {
      console.log("Starting sync...");
      const { data: sectionsData, error: sectionsError } =
        await getSectionsTable(user.id).select("*").order("order");

      if (sectionsError) throw sectionsError;
      console.log("Fetched sections:", sectionsData);

      const { data: todosData, error: todosError } = await getTodosTable(
        user.id
      )
        .select("*")
        .order("id");

      if (todosError) throw todosError;

      // Perform sync logic here
      // This might involve updating local storage or performing other sync operations
      console.log("Sync completed successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      // Optionally show an error message to the user
    }
  };

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

  const finishEditingDate = async (
    sectionId: number,
    todoId: number,
    newDateStr: string
  ) => {
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
                  todo.id === todoId ? { ...todo, created_at: isoDate } : todo
                ),
              }
            : section
        )
      );
    }
    setEditingDateId(null);
  };

  const handleAuth = async (
    e: React.FormEvent,
    isSignUp: boolean
  ): Promise<void> => {
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
      console.error("Error signing out:", error);
    }
  };

  const isRecentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const distance = formatDistanceToNow(date);
    return distance.includes("minute") || distance.includes("hour");
  };

  const hasRecentItems = useCallback(() => {
    return sections.some((section) =>
      section.todos.some(
        (todo) =>
          isRecentDate(todo.created_at) ||
          (todo.completed && isRecentDate(todo.completed_at!))
      )
    );
  }, [sections]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (hasRecentItems()) {
      intervalId = setInterval(() => {
        setTimeRefresh((prev) => prev + 1);
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
        className={`todo-item-container ${todo.completed ? 'completed' : ''} ${
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
                  e.target.style.height = "0px";
                  e.target.style.height = e.target.scrollHeight + "px";
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
              onBlur={(e) =>
                finishEditingDate(section.id, todo.id, e.target.value)
              }
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  finishEditingDate(section.id, todo.id, e.currentTarget.value);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <div className="todo-timestamp-container">
              <span
                className="todo-timestamp"
                onClick={() => startEditingDate(todo.id)}
                title={format(
                  parseISO(todo.completed ? todo.completed_at! : todo.created_at),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              >
                {todo.completed
                  ? `Completed ${formatTimeAgo(todo.completed_at!)}`
                  : formatTimeAgo(todo.created_at)}
              </span>
            </div>
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
    if (e.key === "Enter") {
      e.preventDefault();
      finishEditingTodo(sectionId, todoId, newText);
    }
  };

  useEffect(() => {
    if (editingTodoId !== null && editInputRef.current) {
      const input = editInputRef.current;
      input.focus();
      input.style.height = "auto";
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
          getSectionsTable().update({ order: index }).eq("id", section.id)
        )
      );
    } catch (error) {
      console.error("Error updating section order:", error);
      // Optionally, revert the state if the database update fails
      setSections(sections);
    }
  };

  const addTodoToSection = async (sectionId: number, todoText: string) => {
    if (!user || !todoText.trim()) return;

    try {
      const newTodo = {
        text: todoText.trim(),
        section_id: sectionId,
        user_id: user.id,
        completed: false,
        created_at: new Date().toISOString(),
      };

      const { data: insertedTodo, error } = await getTodosTable()
        .insert(newTodo)
        .select()
        .single();

      if (error) throw error;
      if (!insertedTodo) throw new Error("No todo returned from insert");

      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                todos: [...section.todos, insertedTodo],
              }
            : section
        )
      );
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const DevBanner: React.FC = () => {
    if (process.env.NODE_ENV !== "development") return null;

    return (
      <div className="bg-yellow-400 text-black text-sm py-1 px-2 text-center font-medium">
        Development Environment
      </div>
    );
  };

  const toggleUserPanel = () => {
    setIsUserPanelOpen(!isUserPanelOpen);
  };

  const UserMenu: React.FC = () => {
    return (
      <div className="user-menu">
        <div className="user-menu-item">
          <label className="user-menu-label">
            <input 
              type="checkbox" 
              checked={showCompleted} 
              onChange={() => setShowCompleted(!showCompleted)} 
            />
            Show Completed
          </label>
        </div>
        
        <div className="user-menu-item">
          <button 
            className="user-menu-button"
            onClick={handleSync}
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Sync
          </button>
        </div>
        
        <div className="user-menu-item">
          <button 
            className="user-menu-button"
            onClick={handleSignOut}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
            Log Out
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
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

  const filteredSections = sections.map((section) => ({
    ...section,
    todos: section.todos.filter((todo) => showCompleted || !todo.completed),
  }));

  return (
    <div data-testid="todo-app" className="min-h-screen bg-gray-100">
      <DevBanner />
      {user ? (
        <div className="app-header">
          <div className="app-header-content">
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <button 
                className="user-menu-toggle"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {isUserMenuOpen ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <h1 className="app-title">ToDo</h1>
          </div>
          
          {isUserMenuOpen && (
            <UserMenu />
          )}
        </div>
      ) : (
        <div className="app-header">
          <div className="header-actions">
            <button 
              className="auth-button"
              onClick={() => setIsUserPanelOpen(!isUserPanelOpen)}
            >
              Login
            </button>
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
            </div>
          )}

          <div className="space-y-4">
            {filteredSections.map((section: TodoSection, index: number) => (
              <div 
                key={section.id} 
                className="todo-section"
                aria-labelledby={`section-header-${section.id}`}
              >
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
                            s.id === section.id ? { ...s, title: newTitle } : s
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
                      id={`section-header-${section.id}`}
                      className="text-lg font-semibold text-gray-800"
                      aria-label={`Section: ${section.title}`}
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
                      disabled={index === sections.length - 1}
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
                      className={`todo-item ${
                        editingTodoId === todo.id ? "editing" : ""
                      }`}
                    >
                      {renderTodoItem(section, todo)}
                    </div>
                  ))}
                </div>

                {/* Add Todo Input */}
                <div className="mt-4">
                  <TodoInput 
                    sectionId={section.id} 
                    sections={sections} 
                    user={user} 
                    supabase={supabase} 
                    setSections={setSections}
                    onAddTodo={(todoText) => addTodoToSection(section.id, todoText)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Section Button */}
          <div className="notebook-line flex items-center mb-4">
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;
