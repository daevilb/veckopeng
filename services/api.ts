import { AppState, DEFAULT_STATE, Task, User } from '../types';

const API_BASE_URL = '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const familyKey = localStorage.getItem('veckopeng.familyKey');
  if (familyKey) {
    headers['x-family-key'] = familyKey;
  }
  return headers;
}

/**
 * Fetch state from backend
 */
export const fetchState = async (): Promise<AppState> => {
  try {
    const response = await fetch(`${API_BASE_URL}/state`, {
      headers: getHeaders(),
    });

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
    const response = await fetch(`${API_BASE_URL}/state`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(state),
    });
    return response.ok;
  } catch (error) {
    console.error('API Save Error:', error);
    return false;
  }
};

export const approveTaskApi = async (taskId: string, approved: boolean): Promise<{ task: Task; user: User }> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ approved }), 
  });

  if (!response.ok) throw new Error('Failed to approve task');
  return response.json();
};

export const updateTaskApi = async (
  taskId: string,
  body: Partial<Pick<Task, 'status' | 'title' | 'description' | 'reward'>> & { completedAt?: number | null },
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
};

export const createTaskApi = async (
  payload: Partial<Task>,
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
};

export const createUserApi = async (user: Omit<User, 'id'>): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(user),
  });

  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
};

export const updateUserApi = async (id: string, updates: Partial<User>): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error('Failed to update user');
  return response.json();
};