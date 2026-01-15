/**
 * Mock utilities for Supabase client
 * Used in API route tests
 */

type MockQueryBuilderResult = {
  data: unknown;
  error: { message: string; code: string } | null;
};

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  returns: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

/**
 * Create a chainable mock query builder
 */
export function createMockQueryBuilder(
  result: MockQueryBuilderResult = { data: null, error: null }
): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };

  // Make methods return the builder for chaining, but single/maybeSingle return result
  Object.keys(builder).forEach((key) => {
    if (key !== "single" && key !== "maybeSingle") {
      (builder[key as keyof MockQueryBuilder] as ReturnType<typeof vi.fn>).mockReturnValue(builder);
    }
  });

  return builder;
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient(options?: {
  user?: { id: string; email: string } | null;
  queryResults?: Record<string, MockQueryBuilderResult>;
}) {
  const { user = null, queryResults = {} } = options ?? {};

  const defaultQueryBuilder = createMockQueryBuilder();

  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (queryResults[table]) {
      return createMockQueryBuilder(queryResults[table]);
    }
    return defaultQueryBuilder;
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: fromMock,
  };
}

/**
 * Create a mock authenticated user
 */
export function createMockUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: "user-uuid-123",
    email: "test@example.com",
    ...overrides,
  };
}

/**
 * Mock Supabase error
 */
export function createSupabaseError(message: string, code = "PGRST116") {
  return {
    message,
    code,
  };
}
