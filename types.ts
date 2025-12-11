
export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  GUEST = 'GUEST'
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string; // Icon name
}

export interface ServiceRequest {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  location: string; // Human readable address
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
  priceEstimate?: string;
  providerId?: string;
  createdAt: number;
  coordinates: { x: number; y: number }; // Percentage 0-100 for mock map
  providerLocation?: { x: number; y: number }; // For tracking
  eta?: string;
}

export interface ProviderProfile {
  id: string;
  name: string;
  role: string;
  rating: number; // 0-5
  reviewsCount: number;
  verified: boolean;
  skills: string[];
}

export interface GroundingResult {
  text: string;
  sources: { title: string; uri: string }[];
}
