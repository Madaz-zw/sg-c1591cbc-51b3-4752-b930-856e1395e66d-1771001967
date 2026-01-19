import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { User, UserRole } from "@/types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

export const userService = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToUser);
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data ? this.mapToUser(data) : null;
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapToUser(data) : null;
  },

  // Create new user
  async createUser(name: string, email: string, password: string, role: UserRole): Promise<User> {
    const newUser: UserInsert = {
      full_name: name,
      email,
      password, // Storing as text for now to match localStorage migration
      role,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("users")
      .insert(newUser)
      .select()
      .single();

    if (error) throw error;
    return this.mapToUser(data);
  },

  // Update user
  async updateUser(id: string, updates: Partial<UserInsert>): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToUser(data);
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Authenticate user
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapToUser(data) : null;
  },

  // Initialize default users
  async initializeDefaultUsers(): Promise<void> {
    const defaultUsers = [
      { name: "Admin User", email: "admin@josm.com", password: "admin123", role: "admin" as UserRole },
      { name: "Store Keeper", email: "storekeeper@josm.com", password: "store123", role: "store_keeper" as UserRole },
      { name: "Supervisor", email: "supervisor@josm.com", password: "super123", role: "supervisor" as UserRole },
      { name: "Worker", email: "worker@josm.com", password: "worker123", role: "worker" as UserRole },
      { name: "Sales Person", email: "sales@josm.com", password: "sales123", role: "sales_warehouse" as UserRole }
    ];

    for (const user of defaultUsers) {
      const existing = await this.getUserByEmail(user.email);
      if (!existing) {
        await this.createUser(user.name, user.email, user.password, user.role);
      }
    }
  },

  // Helper to map database row to User type
  mapToUser(row: UserRow): User {
    return {
      id: row.id,
      name: row.full_name,
      email: row.email,
      password: row.password || "",
      role: row.role as UserRole,
      createdAt: row.created_at || new Date().toISOString()
    };
  }
};