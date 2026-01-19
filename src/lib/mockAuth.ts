import { User, UserRole } from "@/types";

// Mock authentication - will be replaced with Supabase Auth
const STORAGE_KEY = "josm_current_user";

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@josm.com",
    role: "admin",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    name: "Store Keeper",
    email: "storekeeper@josm.com",
    role: "store_keeper",
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    name: "Supervisor John",
    email: "supervisor@josm.com",
    role: "supervisor",
    createdAt: new Date().toISOString()
  },
  {
    id: "4",
    name: "Worker Sam",
    email: "worker@josm.com",
    role: "worker",
    createdAt: new Date().toISOString()
  },
  {
    id: "5",
    name: "Sales Manager",
    email: "sales@josm.com",
    role: "sales",
    createdAt: new Date().toISOString()
  }
];

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function login(email: string): User | null {
  const user = mockUsers.find(u => u.email === email);
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
}

export function logout(): void {
  setCurrentUser(null);
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  
  const permissions: Record<UserRole, string[]> = {
    admin: ["all"],
    store_keeper: [
      "view_materials",
      "manage_materials",
      "view_tools",
      "manage_tools",
      "approve_requests",
      "create_jobs",
      "view_reports"
    ],
    supervisor: [
      "view_materials",
      "view_tools",
      "create_jobs",
      "view_jobs",
      "manage_own_jobs"
    ],
    worker: [
      "view_materials",
      "request_materials",
      "checkout_tools",
      "view_own_requests"
    ],
    sales: [
      "view_boards",
      "manage_boards",
      "view_customer_goods",
      "manage_customer_goods"
    ],
    sales_warehouse: [
      "view_boards",
      "manage_boards",
      "view_customer_goods",
      "manage_customer_goods"
    ]
  };

  const userPermissions = permissions[user.role];
  return userPermissions.includes("all") || userPermissions.includes(permission);
}