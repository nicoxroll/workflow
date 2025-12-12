
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

// "Store" / Professional Profile on the map
export interface ProviderStore {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  rating: number;
  reviewsCount: number;
  coordinates: { x: number; y: number };
  range: number; // Radius in meters
  address: string;
  status: 'OPEN' | 'BUSY' | 'CLOSED';
  priceBase: string; // e.g. "Visita $15.000"
  // New fields for Store View
  heroImage?: string;
  description?: string;
  portfolioImages?: string[];
}

// The specific order/request sent TO a provider (Direct)
export interface ServiceOrder {
  id: string;
  providerId: string;
  providerName: string;
  clientId: string;
  description: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  location: string;
  clientCoordinates: { x: number; y: number };
  priceEstimate: string;
  createdAt: number;
}

export interface RequestApplicant {
  providerId: string;
  providerName: string;
  rating: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

// New: Client public request (DiDi style)
export interface PublicRequest {
  id: string;
  ownerId: string; // To identify if it is mine
  clientId: string;
  category: ServiceCategory; // e.g. Plomeria
  description: string;
  offerPrice: string; // The user sets this
  coordinates: { x: number; y: number };
  address: string;
  createdAt: number;
  status: 'OPEN' | 'ACCEPTED';
  applicants: RequestApplicant[]; // List of providers who applied
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isMe: boolean;
}

export interface ChatSession {
  id: string;
  orderId: string;
  participants: string; // Name of the other person
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  avatar?: string;
}

export interface GroundingResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export interface SavedAddress {
  id: string;
  name: string; // e.g., "Casa", "Trabajo"
  address: string;
  coordinates: { x: number; y: number };
}
