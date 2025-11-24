import { AppState, DEFAULT_STATE, Task, User } from '../types';

const STATE_API_URL = '/api/state';
const API_BASE_URL = '/api';

/**
 * Fetch state from backend
 */
export const fetchState = async (): Promise<AppState> => {
  try {
    const response = await fetch(STATE_API_URL);

    if (!response.ok) {
      console.warn(`API responded with status ${response.status}, using default state.`);
      return DEFAULT_STATE;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('API returned non-JSON content, using default state.');
      return DEFAULT_STATE;
    }

    const json = await response.json();

    if (!json || typeof json !== 'object') {
      console.warn('API returned invalid JSON format, using default state.');
      return DEFAULT_STATE;
    }

    // Merge with default to ensure new fields exist
    return {
      ...DEFAULT_STATE,
      ...json,
      users: Array.isArray(json.users) ? json.users : [],
      tasks: Array.isArray(json.tasks) ? json.tasks : [],
      theme: json.theme === 'dark' ? 'dark' : 'light',
    };
  } catch (error) {
    console.error('API Fetch Error:', error);
    return DEFAULT_STATE;
  }
};

/**
 * Save state to backend
 */
export const saveState = async (state: AppState): Promise<boolean> => {
  try {
    const response = await fetch(STATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    });

    return response.ok;
  } catch (error) {
    console.error('API Save Error:', error);
    return false;
  }
};

/**
 * Approve a task via backend. This will also update the child's balance
 * in a single atomic transaction.
 */
export const approveTaskApi = async (
  taskId: string,
): Promise<{ task: Task; user: User }> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let message = `Failed to approve task (status ${response.status})`;
    try {
      const data = await response.json();
      if (data && typeof (data as any).error === 'string') {
        message = (data as any).error;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const json = await response.json();
  return json as { task: Task; user: User };
};
/**
 * Update a task (for status changes etc.). Uses PATCH /api/tasks/:id.
 */
export const updateTaskApi = async (
  taskId: string,
  body: Partial<Pick<Task, 'status' | 'title' | 'description' | 'reward'>> & {
    completedAt?: number | null;
  },
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Failed to update task (status ${response.status})`;
    try {
      const data = await response.json();
      if (data && typeof (data as any).error === 'string') {
        message = (data as any).error;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return (await response.json()) as Task;
};
/**
 * Create a new task via POST /api/tasks
 */
export const createTaskApi = async (
  payload: Omit<Task, 'completedAt'> & { completedAt?: number | null },
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Failed to create task (status ${response.status})`;
    try {
      const data = await response.json();
      if (data && typeof (data as any).error === 'string') {
        message = (data as any).error;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return (await response.json()) as Task;
};

