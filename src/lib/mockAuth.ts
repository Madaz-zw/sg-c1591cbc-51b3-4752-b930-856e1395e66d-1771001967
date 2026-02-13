import { User, UserRole } from "@/types";
import { getFromStorage, saveToStorage, generateId, STORAGE_KEYS } from "./storage";

// Default demo users for initial setup
export const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@josm.com", password: "admin123", role: "admin", createdAt: new Date().toISOString() },
  { id: "2", name: "Store Keeper", email: "storekeeper@josm.com", password: "store123", role: "store_keeper", createdAt: new Date().toISOString() },
  { id: "3", name: "Supervisor", email: "supervisor@josm.com", password: "super123", role: "supervisor", createdAt: new Date().toISOString() },
  { id: "4", name: "Worker", email: "worker@josm.com", password: "worker123", role: "worker", createdAt: new Date().toISOString() },
  { id: "5", name: "Sales Person", email: "sales@josm.com", password: "sales123", role: "sales_warehouse", createdAt: new Date().toISOString() }
];

// Initialize default users if storage is empty
export function initializeDefaultUsers() {
  const existingUsers = getFromStorage<User>(STORAGE_KEYS.USERS);
  if (existingUsers.length === 0) {
    saveToStorage(STORAGE_KEYS.USERS, mockUsers);
  }
}

// Register a new user
export function registerUser(name: string, email: string, password: string, role: UserRole): User | null {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  // Check if email already exists
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return null;
  }

  const newUser: User = {
    id: generateId(),
    name,
    email,
    password,
    role,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveToStorage(STORAGE_KEYS.USERS, users);
  return newUser;
}

// Login function
export function login(email: string, password: string): User | null {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (user) {
    // Don't store current user here - let AuthContext handle it
    return user;
  }
  
  return null;
}

// Get current user (deprecated - use AuthContext instead)
export function getCurrentUser(): User | null {
  return null;
}

// Logout function
export function logout() {
  // Session management handled by AuthContext
}

// Get all users (for user management)
export function getAllUsers(): User[] {
  return getFromStorage<User>(STORAGE_KEYS.USERS);
}

// Update user
export function updateUser(userId: string, updates: Partial<User>): boolean {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return false;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  saveToStorage(STORAGE_KEYS.USERS, users);
  return true;
}

// Delete user
export function deleteUser(userId: string): boolean {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (filteredUsers.length === users.length) return false;
  
  saveToStorage(STORAGE_KEYS.USERS, filteredUsers);
  return true;
}

// Permission system
const permissions: Record<UserRole, string[]> = {
  admin: ["all"],
  store_keeper: [
    "view_materials", "manage_materials",
    "view_tools", "manage_tools",
    "view_jobs", "manage_jobs",
    "view_boards", "manage_boards",
    "view_reports", "manage_reports",
    "view_material_requests", "manage_material_requests",
    "manage_users"
  ],
  supervisor: [
    "view_materials",
    "view_tools",
    "view_jobs", "manage_jobs",
    "view_boards",
    "view_reports",
    "view_material_requests",
    "update_fabrication",
    "update_assembling"
  ],
  worker: [
    "view_materials",
    "view_tools",
    "view_jobs",
    "view_material_requests", "create_material_requests",
    "update_fabrication",
    "update_assembling"
  ],
  sales_warehouse: [
    "view_boards", "manage_boards",
    "view_customer_goods", "manage_customer_goods",
    "view_reports"
  ]
};

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  const userPermissions = permissions[user.role];
  return userPermissions.includes("all") || userPermissions.includes(permission);
}