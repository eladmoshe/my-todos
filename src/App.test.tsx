import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./frontend/App";
import TodoApp from "./frontend/components/TodoApp";
import supabase from "./supabaseClient";
import { User, UserResponse } from "@supabase/supabase-js";

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

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

jest.mock("./frontend/components/TodoApp", () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

describe("App Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    jest.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: null },
      error: null,
    } as unknown as UserResponse);
    (TodoApp as jest.Mock).mockImplementation(() => (
      <div data-testid="todo-app">TodoApp</div>
    ));

    render(<App />);
    expect(screen.getByTestId("todo-app")).toBeInTheDocument();
  });

  it("renders TodoApp component when user is authenticated", () => {
    const mockUser: User = {
      id: "test-user-id",
      email: "test@example.com",
    } as User;
    jest.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as unknown as UserResponse);
    (TodoApp as jest.Mock).mockImplementation(() => (
      <div data-testid="todo-app">Authenticated TodoApp</div>
    ));

    render(<App />);
    expect(screen.getByTestId("todo-app")).toBeInTheDocument();
    expect(screen.getByText("Authenticated TodoApp")).toBeInTheDocument();
  });

  it("renders error boundary when TodoApp throws", () => {
    jest.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: null },
      error: null,
    } as unknown as UserResponse);
    
    (TodoApp as jest.Mock).mockImplementation(() => {
      throw new Error("Test error");
    });

    render(<App />);
    
    expect(screen.getByText("Sorry.. there was an error")).toBeInTheDocument();
  });

  it("ensures state updates are atomic and don't cause inconsistencies", async () => {
    // Implement this test
    const mockUser = { id: "test-user-id", email: "test@example.com" } as User;
    jest.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as unknown as UserResponse);

    const { rerender } = render(<App />);

    // Simulate multiple state updates
    //await act(async () => {
    // Trigger state updates here
    // For example, if TodoApp has a method to add todos:
    // await (TodoApp as jest.Mock).mock.calls[0][0].onAddTodo('Todo 1');
    // await (TodoApp as jest.Mock).mock.calls[0][0].onAddTodo('Todo 2');
    //});

    // Re-render the component
    rerender(<App />);

    // Add assertions to check for consistency
    // For example:
    // expect(screen.getByText('Todo 1')).toBeInTheDocument();
    // expect(screen.getByText('Todo 2')).toBeInTheDocument();

    // You may need to adjust these assertions based on your actual implementation
  });
});
