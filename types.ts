
export type Language = 'en' | 'fr';

export enum HealthStatus {
  HEALTHY = "Healthy",
  SICK = "Sick",
  UNKNOWN = "Unknown"
}

export interface CareInstructions {
  water: string;
  light: string;
  temperature: string;
  humidity: string;
}

export interface PlantAnalysis {
  id: string; // Unique ID for history
  timestamp: number;
  scientificName: string;
  commonName: string;
  confidence: number;
  healthStatus: HealthStatus;
  diagnosis: string; // "All good" or specific disease name
  symptoms: string[];
  treatment: string[]; // Steps to cure
  careInstructions: CareInstructions;
  funFact: string;
  image?: string; // Base64 image for history recall
}

export interface PlantHistoryItem {
  id: string;
  timestamp: number;
  commonName: string;
  healthStatus: HealthStatus;
  thumbnail: string; // Base64 string (truncated for preview if needed)
}

// Community Features
export interface User {
  id: string;
  name: string;
  avatar?: string;
  isExpert: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  image?: string;
  likes: number;
  isLiked: boolean; // Local state for demo
  comments: Comment[];
  timestamp: number;
  tags: string[];
  isPinned?: boolean;
}
