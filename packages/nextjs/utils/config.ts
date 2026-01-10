/**
 * Configuration for backend services
 * Uses environment variables with fallback to localhost for development
 */

export const config = {
  mlUrl: process.env.NEXT_PUBLIC_ML_URL || "http://localhost:8000",
  storageUrl: process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:3001",
  ponderUrl: process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069",
};
