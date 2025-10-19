type TableName =
  | "profiles"
  | "meals"
  | "grocery_lists"
  | "tasks"
  | "energy_windows"
  | "checkins"
  | "task_events";

type FilterOp = "eq" | "gte" | "lte" | "in";
type Filter = { column: string; value: unknown; op: FilterOp };

type MockSession = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
};

const demoUser = {
  id: "demo-user-id",
  email: "demo@lumawell.test"
};

const today = new Date().toISOString().slice(0, 10);

const initialState = {
  profiles: [
    {
      id: "profile-1",
      user_id: demoUser.id,
      name: "Alex",
      goal: "lean_strength",
      energy_pref: "balanced"
    }
  ],
  meals: [
    {
      id: "meal-1",
      preset_key: "weekday_lunch",
      title: "Mediterranean Quinoa Bowl",
      kcal: 520,
      macros: { protein: 32, carbs: 58, fat: 18 },
      recipe_url: "https://example.com/mediterranean-bowl",
      grocery: [
        { item: "Quinoa", qty: "1 cup" },
        { item: "Chickpeas", qty: "1 can" },
        { item: "Cherry tomatoes", qty: "1 cup" },
        { item: "Feta cheese", qty: "1/2 cup" }
      ]
    },
    {
      id: "meal-2",
      preset_key: "weekday_dinner",
      title: "Sheet Pan Salmon & Veggies",
      kcal: 610,
      macros: { protein: 42, carbs: 36, fat: 28 },
      recipe_url: "https://example.com/sheet-pan-salmon",
      grocery: [
        { item: "Salmon fillets", qty: "2" },
        { item: "Broccoli florets", qty: "2 cups" },
        { item: "Sweet potato", qty: "1 large" },
        { item: "Olive oil", qty: "2 tbsp" }
      ]
    },
    {
      id: "meal-3",
      preset_key: "weekend_brunch",
      title: "Protein Pancakes with Berries",
      kcal: 450,
      macros: { protein: 28, carbs: 54, fat: 14 },
      recipe_url: "https://example.com/protein-pancakes",
      grocery: [
        { item: "Rolled oats", qty: "1 cup" },
        { item: "Eggs", qty: "2" },
        { item: "Greek yogurt", qty: "1/2 cup" },
        { item: "Mixed berries", qty: "1 cup" }
      ]
    }
  ],
  grocery_lists: [
    {
      id: "grocery-1",
      user_id: demoUser.id,
      week_start: today,
      items: [
        { item: "Spinach", qty: "2 bags" },
        { item: "Eggs", qty: "12" },
        { item: "Avocados", qty: "4" },
        { item: "Chicken thighs", qty: "1kg" }
      ]
    }
  ],
  tasks: [
    {
      id: "task-1",
      user_id: demoUser.id,
      date: today,
      slot: "morning",
      type: "movement",
      title: "20 min strength circuit",
      duration_min: 30,
      intensity: "moderate",
      status: "planned"
    },
    {
      id: "task-2",
      user_id: demoUser.id,
      date: today,
      slot: "afternoon",
      type: "meal",
      title: "Protein-focused lunch prep",
      duration_min: 25,
      intensity: null,
      status: "planned"
    },
    {
      id: "task-3",
      user_id: demoUser.id,
      date: today,
      slot: "evening",
      type: "micro-habit",
      title: "5 min stretch & gratitude",
      duration_min: 5,
      intensity: "light",
      status: "planned"
    }
  ],
  energy_windows: [
    {
      id: "energy-1",
      user_id: demoUser.id,
      date: today,
      morning: 4,
      afternoon: 3,
      evening: 2,
      source: "heuristic_v1"
    }
  ],
  checkins: [] as any[],
  task_events: [] as any[]
};

const mockDb: typeof initialState = JSON.parse(JSON.stringify(initialState));

const mockSession: MockSession = {
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: demoUser
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function matchesFilter<Row extends Record<string, any>>(row: Row, filter: Filter) {
  const value = row[filter.column];
  const target = filter.value;
  switch (filter.op) {
    case "eq":
      return value === target;
    case "gte":
      return value >= target;
    case "lte":
      return value <= target;
    case "in":
      return Array.isArray(target) ? target.includes(value) : false;
    default:
      return true;
  }
}

function matchesFilters<Row extends Record<string, any>>(row: Row, filters: Filter[]) {
  return filters.every((filter) => matchesFilter(row, filter));
}

function applyFilters<T extends Record<string, any>>(rows: T[], filters: Filter[]) {
  if (!filters.length) return rows;
  return rows.filter((row) => matchesFilters(row, filters));
}

function applyOrder<T extends Record<string, any>>(
  rows: T[] | null | undefined,
  order: { column: string; ascending: boolean } | null
) {
  if (!rows) return [];
  if (!order) return rows;
  const { column, ascending } = order;
  return [...rows].sort((a, b) => {
    if (a[column] === b[column]) return 0;
    if (a[column] === undefined) return ascending ? -1 : 1;
    if (b[column] === undefined) return ascending ? 1 : -1;
    return ascending ? (a[column] > b[column] ? 1 : -1) : a[column] < b[column] ? 1 : -1;
  });
}

function normalizeRows<Row extends Record<string, any>>(rows: Row | Row[]) {
  return Array.isArray(rows) ? rows : [rows];
}

function upsertRows<Row extends Record<string, any>>(table: TableName, payload: Row | Row[]) {
  const rows = normalizeRows(payload);
  const target = mockDb[table] as Row[];

  rows.forEach((row) => {
    const record = { ...row } as Record<string, any>;
    if (!record.id) {
      record.id = createId(`${table}-mock`);
    }

    const matchIndex = target.findIndex((existing) => {
      if (existing.id && record.id) return existing.id === record.id;
      if ("date" in existing && "date" in record && "user_id" in existing && "user_id" in record) {
        return existing.date === record.date && existing.user_id === record.user_id;
      }
      return false;
    });

    if (matchIndex >= 0) {
      target[matchIndex] = { ...target[matchIndex], ...record };
    } else {
      target.push(record as Row);
    }
  });

  return rows;
}

function deleteRows<Row extends Record<string, any>>(table: TableName, filters: Filter[]) {
  const target = mockDb[table] as Row[];
  const toKeep = target.filter((row) => {
    return !matchesFilters(row, filters);
  });
  (mockDb[table] as Row[]).length = 0;
  toKeep.forEach((row) => (mockDb[table] as Row[]).push(row));
}

function updateRows<Row extends Record<string, any>>(
  table: TableName,
  filters: Filter[],
  values: Partial<Row>
) {
  const target = mockDb[table] as Row[];
  target.forEach((row, index) => {
    if (matchesFilters(row, filters)) {
      target[index] = { ...row, ...values };
    }
  });
}

function createQueryBuilder(table: TableName) {
  const filters: Filter[] = [];
  let order: { column: string; ascending: boolean } | null = null;
  let limit: number | null = null;

  const execute = () => {
    const tableRows = (mockDb as Record<string, any>)[table] ?? [];
    const rows = applyFilters(tableRows as any[], filters);
    const ordered = applyOrder(rows, order);
    return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
  };

  const builder: any = {
    select() {
      return builder;
    },
    maybeSingle: async () => ({
      data: execute()[0] ?? null,
      error: null
    }),
    eq(column: string, value: unknown) {
      filters.push({ column, value, op: "eq" });
      return builder;
    },
    gte(column: string, value: unknown) {
      filters.push({ column, value, op: "gte" });
      return builder;
    },
    lte(column: string, value: unknown) {
      filters.push({ column, value, op: "lte" });
      return builder;
    },
    in(column: string, values: unknown[]) {
      filters.push({ column, value: values, op: "in" });
      return builder;
    },
    limit(count: number) {
      limit = count;
      return builder;
    },
    order(column: string, options?: { ascending?: boolean }) {
      order = { column, ascending: options?.ascending !== false };
      return builder;
    },
    insert: async (rows: any) => ({
      data: upsertRows(table, normalizeRows(rows).map((row: any) => ({ ...row, id: createId(table) }))),
      error: null
    }),
    upsert: async (rows: any) => ({
      data: upsertRows(table, rows),
      error: null
    }),
    update(values: any) {
      const updateFilters: Filter[] = [];
      const updateBuilder: any = {
        eq(column: string, value: unknown) {
          updateFilters.push({ column, value, op: "eq" });
          return updateBuilder;
        },
        gte(column: string, value: unknown) {
          updateFilters.push({ column, value, op: "gte" });
          return updateBuilder;
        },
        lte(column: string, value: unknown) {
          updateFilters.push({ column, value, op: "lte" });
          return updateBuilder;
        },
        in(column: string, values: unknown[]) {
          updateFilters.push({ column, value: values, op: "in" });
          return updateBuilder;
        },
        then(onFulfilled: any, onRejected: any) {
          try {
            updateRows(table, updateFilters, values);
            const result = { data: applyFilters(mockDb[table] as any[], updateFilters), error: null };
            return Promise.resolve(result).then(onFulfilled, onRejected);
          } catch (err) {
            return Promise.reject(err).then(onFulfilled, onRejected);
          }
        }
      };
      return updateBuilder;
    },
    delete() {
      const deleteFilters: Filter[] = [];
      const deleteBuilder: any = {
        eq(column: string, value: unknown) {
          deleteFilters.push({ column, value, op: "eq" });
          return deleteBuilder;
        },
        gte(column: string, value: unknown) {
          deleteFilters.push({ column, value, op: "gte" });
          return deleteBuilder;
        },
        lte(column: string, value: unknown) {
          deleteFilters.push({ column, value, op: "lte" });
          return deleteBuilder;
        },
        in(column: string, values: unknown[]) {
          deleteFilters.push({ column, value: values, op: "in" });
          return deleteBuilder;
        },
        then(onFulfilled: any, onRejected: any) {
          try {
            deleteRows(table, deleteFilters);
            const result = { data: null, error: null };
            return Promise.resolve(result).then(onFulfilled, onRejected);
          } catch (err) {
            return Promise.reject(err).then(onFulfilled, onRejected);
          }
        }
      };
      return deleteBuilder;
    },
    then(onFulfilled: any, onRejected: any) {
      const result = { data: execute(), error: null };
      return Promise.resolve(result).then(onFulfilled, onRejected);
    }
  };

  return builder;
}

function getAuthHelpers() {
  const session = mockSession;
  return {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user: session.user }, error: null }),
    signInWithOtp: async (_: any) => ({ data: { user: session.user }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: any) => {
      const subscription = {
        unsubscribe: () => undefined
      };
      callback("SIGNED_IN", { session });
      return { data: { subscription }, error: null };
    }
  };
}

export function createMockServerClient() {
  return {
    auth: getAuthHelpers(),
    from: (table: TableName) => createQueryBuilder(table)
  };
}

export function createMockBrowserClient() {
  return {
    auth: getAuthHelpers(),
    from: (table: TableName) => createQueryBuilder(table)
  };
}
