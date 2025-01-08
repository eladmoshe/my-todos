export const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: jest.fn().mockImplementation((callback) => {
      // Simulate the callback being called
      callback('SIGNED_IN', { user: { id: 'test-user-id' } });
      // Return an object with an unsubscribe method
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
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
};

export default mockSupabase;

export const mockSignIn = jest.fn().mockResolvedValue({ user: null, error: null });
export const mockSignUp = jest.fn().mockResolvedValue({ user: null, error: null });
