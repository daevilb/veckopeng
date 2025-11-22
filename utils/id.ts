export const generateId = () => {
  try {
    if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
      return (crypto as any).randomUUID();
    }
  } catch {
    // ignore
  }

  // Fallback if crypto.randomUUID doesn't exist
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};
