import { AppState, DEFAULT_STATE } from '../types';

const API_URL = '/api/state';

export const fetchState = async (): Promise<AppState> => {
  try {
    const response = await fetch(API_URL);
    
    // Check if response is OK
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check if content type is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Received non-JSON response from server");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    // Fallback for first load if backend is empty/erroring (shouldn't happen in prod if docker is set up right)
    return DEFAULT_STATE;
  }
};

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
    console.error("API Save Error:", error);
    return false;
  }
};