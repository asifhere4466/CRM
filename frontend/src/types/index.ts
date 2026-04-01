export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  organizationId: string;
  createdAt?: string;
  _count?: {
    assignedCustomers: number;
  };
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizationId: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  _count?: {
    notes: number;
  };
  notes?: Note[];
}

export interface Note {
  id: string;
  content: string;
  customerId: string;
  organizationId: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogMetadata {
  noteId?: string;
  notePreview?: string;
  customerName?: string;
  customerEmail?: string;
  assignedToName?: string;
  autoAssigned?: boolean;
  changes?: Record<
    string,
    {
      from: string | null;
      to: string | null;
    }
  >;
  restored?: boolean;
}

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: ActivityLogMetadata;
  performedById: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
  organizationId: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  assignedToId?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface AssignCustomerInput {
  userId: string;
}

export interface CreateNoteInput {
  content: string;
  customerId: string;
}
