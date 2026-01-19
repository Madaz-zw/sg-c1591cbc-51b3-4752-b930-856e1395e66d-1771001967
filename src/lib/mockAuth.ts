import { User, UserRole } from "@/types";
import { getFromStorage, saveToStorage, generateId, STORAGE_KEYS } from "./storage";

// Current user session storage
const CURRENT_USER_KEY = "josm_current_user";

// Default users for initialization and demo
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@josm.com",
    password: "admin123",
    role: "admin",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    name: "Store Keeper",
    email: "storekeeper@josm.com",
    password: "store123",
    role: "store_keeper",
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    name: "Supervisor John",
    email: "supervisor@josm.com",
    password: "super123",
    role: "supervisor",
    createdAt: new Date().toISOString()
  },
  {
    id: "4",
    name: "Worker Sam",
    email: "worker@josm.com",
    password: "worker123",
    role: "worker",
    createdAt: new Date().toISOString()
  },
  {
    id: "5",
    name: "Sales Manager",
    email: "sales@josm.com",
    password: "sales123",
    role: "sales_warehouse",
    createdAt: new Date().toISOString()
  }
];

// Initialize default admin user if no users exist
export function initializeDefaultUsers(): void {
  if (typeof window === "undefined") return;
  
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  if (users.length === 0) {
    saveToStorage(STORAGE_KEYS.USERS, mockUsers);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    // Remove password before storing in session
    const { password, ...userWithoutPassword } = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function login(email: string, password: string): User | null {
  initializeDefaultUsers();
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
}

export function registerUser(userData: Omit<User, "id" | "createdAt">): User {
  initializeDefaultUsers();
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  // Check if email already exists
  const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existingUser) {
    throw new Error("Email already exists");
  }
  
  const newUser: User = {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveToStorage(STORAGE_KEYS.USERS, users);
  
  return newUser;
}

export function updateUser(userId: string, updates: Partial<Omit<User, "id" | "createdAt">>): User | null {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  saveToStorage(STORAGE_KEYS.USERS, users);
  
  return users[userIndex];
}

export function deleteUser(userId: string): boolean {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (filteredUsers.length === users.length) return false;
  
  saveToStorage(STORAGE_KEYS.USERS, filteredUsers);
  return true;
}

export function getAllUsers(): User[] {
  initializeDefaultUsers();
  return getFromStorage<User>(STORAGE_KEYS.USERS);
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
      "add_materials",
      "manage_materials",
      "view_tools",
      "manage_tools",
      "approve_requests",
      "create_jobs",
      "view_jobs",
      "view_reports",
      "manage_users"
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