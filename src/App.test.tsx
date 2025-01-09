import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import TodoApp from "./frontend/components/TodoApp";
import supabase from "./supabaseClient";
import { AuthError, User, UserResponse } from "@supabase/supabase-js";

// Mock the entire supabaseClient module
jest.mock("./supabaseClient", () => ({
  __esModule: true,
  default: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Mock the TodoApp component
jest.mock("./frontend/components/TodoApp", () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

describe("App Component", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders without crashing", () => {
    jest.spyOn(supabase.auth, "getUser").mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    } as unknown as UserResponse);
    (TodoApp as jest.Mock).mockImplementation(() => <div data-testid="todo-app">TodoApp</div>);
    
    render(<App />);
    expect(screen.getByTestId("todo-app")).toBeInTheDocument();
  });

  it("renders TodoApp component when user is authenticated", () => {
    const mockUser: User = { id: "test-user-id", email: "test@example.com" } as User;
    jest.spyOn(supabase.auth, "getUser").mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    } as unknown as UserResponse);
    (TodoApp as jest.Mock).mockImplementation(() => <div data-testid="todo-app">Authenticated TodoApp</div>);
    
    render(<App />);
    expect(screen.getByTestId("todo-app")).toBeInTheDocument();
    expect(screen.getByText("Authenticated TodoApp")).toBeInTheDocument();
  });

  it("renders error boundary when TodoApp throws", () => {
    jest.spyOn(supabase.auth, "getUser").mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    } as unknown as UserResponse);
    (TodoApp as jest.Mock).mockImplementation(() => {
      throw new Error("Test error");
    });

    render(<App />);
    expect(screen.getByText("Sorry.. there was an error")).toBeInTheDocument();
  });

  it('ensures state updates are atomic and don\'t cause inconsistencies', async () => {
    // Implement this test
    const mockUser = { id: 'test-user-id', email: 'test@example.com' } as User;
    jest.spyOn(supabase.auth, "getUser").mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    } as unknown as UserResponse);

    const { rerender } = render(<App />);

    // Simulate multiple state updates
    await act(async () => {
      // Trigger state updates here
      // For example, if TodoApp has a method to add todos:
      // await (TodoApp as jest.Mock).mock.calls[0][0].onAddTodo('Todo 1');
      // await (TodoApp as jest.Mock).mock.calls[0][0].onAddTodo('Todo 2');
    });

    // Re-render the component
    rerender(<App />);

    // Add assertions to check for consistency
    // For example:
    // expect(screen.getByText('Todo 1')).toBeInTheDocument();
    // expect(screen.getByText('Todo 2')).toBeInTheDocument();

    // You may need to adjust these assertions based on your actual implementation
  });
});
