export function createInitialState() {
  return {
    industry: null,
    processes: [],
    description: "",
    systems: [],
    customSystems: [],
    connections: {},
    dataOperations: [],
    dataComplexity: null,
    documents: [],
    documentActions: [],
    email: { actions: [] },
    communication: [],
    ai: [],
    approvals: null,
    branches: null,
    exceptions: null,
    volume: null,
    criticality: null,
    testEnvironment: null,
    hosting: null,
    rpa: { steps: null, screens: null, risks: [] },
    datev: { scope: [], multipleClients: false },
    estimatedBudget: null,
    careRecommendation: null,
    complexity: null
  };
}

export function serializeConfiguration(state) {
  const safeState = structuredClone(state);
  delete safeState.estimatedBudget;
  delete safeState.careRecommendation;
  delete safeState.complexity;
  // Freitext kann personenbezogene Angaben enthalten und gehört nicht in einen Share-Link.
  delete safeState.description;
  return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(safeState)))));
}

export function deserializeConfiguration(value) {
  try {
    const decoded = decodeURIComponent(escape(atob(decodeURIComponent(value))));
    const parsed = JSON.parse(decoded);
    return mergeState(createInitialState(), parsed);
  } catch {
    return createInitialState();
  }
}

export function mergeState(base, update) {
  const merged = { ...base, ...update };
  merged.email = { ...base.email, ...(update?.email || {}) };
  merged.rpa = { ...base.rpa, ...(update?.rpa || {}) };
  merged.datev = { ...base.datev, ...(update?.datev || {}) };
  return merged;
}

export function createStateStore(initialState = createInitialState()) {
  let state = mergeState(createInitialState(), initialState);
  const listeners = new Set();

  return {
    getState: () => state,
    update(patch) {
      state = mergeState(state, typeof patch === "function" ? patch(state) : patch);
      listeners.forEach((listener) => listener(state));
      return state;
    },
    reset() {
      state = createInitialState();
      listeners.forEach((listener) => listener(state));
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
