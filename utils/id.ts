// Simple unique ID generator for Veckopeng
// Produces IDs like: "xk2fh8s9-1701239123"

export const generateId = (): string => {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `${random}-${timestamp}`;
};
