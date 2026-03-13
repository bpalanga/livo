export type UserRole = 'admin' | 'agent' | 'tenant';

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Listing {
  id: number;
  title: string;
  price: number;
  location: string;
  amenities: string[];
  imageUrl: string;
  status: 'Available' | 'Pending' | 'Rented';
  agentId: number;
  createdAt: string;
}

export interface Inquiry {
  id: number;
  tenantId: number;
  agentId: number;
  propertyId: number;
  message: string;
  status: 'Pending' | 'Approved' | 'Declined';
  timestamp: string;
  tenantName?: string;
  propertyTitle?: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  inquiryId: number;
  content: string;
  timestamp: string;
  senderName?: string;
}

export interface Notification {
  id: number;
  recipient_id: number;
  sender_id: number;
  property_id: number;
  message: string;
  is_read: boolean;
  timestamp: string;
}
