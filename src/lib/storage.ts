// Local storage utilities - will be replaced with Supabase
export function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const STORAGE_KEYS = {
  USERS: "josm_users",
  MATERIALS: "josm_materials",
  TOOLS: "josm_tools",
  JOBS: "josm_jobs",
  BOARDS: "josm_boards",
  MATERIAL_REQUESTS: "josm_material_requests",
  MATERIAL_TRANSACTIONS: "josm_material_transactions",
  TOOL_TRANSACTIONS: "josm_tool_transactions",
  BOARD_TRANSACTIONS: "josm_board_transactions",
  CUSTOMER_GOODS: "josm_customer_goods"
};