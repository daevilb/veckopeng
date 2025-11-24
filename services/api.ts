import { AppState, DEFAULT_STATE } from '../types';

const API_URL = '/api/state';

/**
 * Fetch state from backend
 */
export const fetchState = async (): Promise<AppState> => {
  try {
    const response = await fetch(API_URL);

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
    const response = await fetch(API_URL, {
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
