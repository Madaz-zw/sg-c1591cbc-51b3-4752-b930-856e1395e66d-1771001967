// User Types
export type UserRole = "admin" | "store_keeper" | "supervisor" | "worker" | "sales_warehouse";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

// Material Types
export interface Material {
  id: string;
  category: string;
  name: string;
  variant?: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  lastUpdated: string;
}

export interface MaterialRequest {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  requestedBy: string;
  requestedByName: string;
  jobCardNumber: string;
  status: "pending" | "approved" | "rejected";
  requestDate: string;
  approvedBy?: string;
  approvedByName?: string;
  approvalDate?: string;
  notes?: string;
}

export interface MaterialTransaction {
  id: string;
  materialId: string;
  materialName: string;
  type: "issue" | "receive" | "return";
  quantity: number;
  date: string;
  userId?: string;
  userName?: string;
  jobCardNumber?: string;
  boardName?: string;
  boardColor?: string;
  recipientName?: string;
  notes?: string;
}

// Tool Types
export interface Tool {
  id: string;
  name: string;
  code?: string;
  category: string;
  status: "available" | "checked_out" | "damaged";
  checkedOutTo?: string;
  checkedOutBy?: string;
  checkedOutDate?: string;
  isDamaged: boolean;
}

export interface ToolTransaction {
  id: string;
  toolId: string;
  toolName: string;
  type: "checkout" | "return" | "damage";
  userId: string;
  userName: string;
  date: string;
  notes?: string;
}

// Job Card Types
export type JobStatus = "fabrication" | "assembling" | "completed";

export interface JobCard {
  id: string;
  jobCardNumber: string;
  boardName: string;
  boardColor: string;
  boardType: "dinrail" | "hynman";
  recipientName: string;
  supervisorName: string;
  supervisorId: string;
  status: JobStatus;
  materialsUsed: {
    materialId: string;
    materialName: string;
    quantity: number;
    process: "fabrication" | "assembling";
  }[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  fabricationCompletedAt?: string;
  assemblingCompletedAt?: string;
  completedAt?: string;
}

// Alias for backward compatibility
export type Job = JobCard;

// Finished Board Types
export interface Board {
  id: string;
  type: "Dinrail" | "Hynman";
  color: string;
  quantity: number;
  minThreshold: number;
  lastUpdated: string;
}

export interface BoardTransaction {
  id: string;
  boardId: string;
  boardName?: string;
  type: "manufactured" | "sold";
  quantity: number;
  customerName?: string;
  userId: string;
  userName: string;
  date: string;
  notes?: string;
}

// Customer Goods Types
export interface CustomerGoods {
  id: string;
  customerName: string;
  description: string;
  quantity: number;
  receivedDate: string;
  receivedBy: string;
  receivedByName: string;
  status: "received" | "processed" | "returned";
  notes?: string;
}

// Report Types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  userId?: string;
}