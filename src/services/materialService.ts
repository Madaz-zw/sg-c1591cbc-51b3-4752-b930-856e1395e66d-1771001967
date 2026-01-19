import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Material, MaterialTransaction } from "@/types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"];
type MaterialTransactionRow = Database["public"]["Tables"]["material_transactions"]["Row"];
type MaterialTransactionInsert = Database["public"]["Tables"]["material_transactions"]["Insert"];

export const materialService = {
  // Get all materials
  async getAllMaterials(): Promise<Material[]> {
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("category", { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToMaterial);
  },

  // Get material by ID
  async getMaterialById(id: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapToMaterial(data) : null;
  },

  // Create material
  async createMaterial(material: Omit<Material, "id">): Promise<Material> {
    const newMaterial: MaterialInsert = {
      category: material.category,
      name: material.name,
      variant: material.variant || null,
      quantity: material.quantity,
      min_threshold: material.minThreshold,
      unit: material.unit
    };

    const { data, error } = await supabase
      .from("materials")
      .insert(newMaterial)
      .select()
      .single();

    if (error) throw error;
    return this.mapToMaterial(data);
  },

  // Update material
  async updateMaterial(id: string, updates: Partial<MaterialInsert>): Promise<Material> {
    const { data, error } = await supabase
      .from("materials")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToMaterial(data);
  },

  // Update quantity
  async updateQuantity(id: string, quantity: number): Promise<Material> {
    // For specific quantity updates, we might need a more robust approach in production
    // to handle concurrent updates, but this works for now.
    return this.updateMaterial(id, { quantity });
  },

  // Get transactions
  async getAllTransactions(): Promise<MaterialTransaction[]> {
    const { data, error } = await supabase
      .from("material_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToTransaction);
  },

  // Create transaction
  async createTransaction(transaction: Omit<MaterialTransaction, "id">): Promise<MaterialTransaction> {
    const newTransaction: MaterialTransactionInsert = {
      material_id: transaction.materialId,
      material_name: transaction.materialName,
      transaction_type: transaction.type,
      quantity: transaction.quantity,
      user_id: transaction.userId,
      user_name: transaction.userName,
      job_card_number: transaction.jobCardNumber,
      board_name: transaction.boardName,
      board_color: transaction.boardColor,
      recipient_name: transaction.recipientName,
      date: transaction.date,
      notes: transaction.notes
    };

    const { data, error } = await supabase
      .from("material_transactions")
      .insert(newTransaction)
      .select()
      .single();

    if (error) throw error;
    return this.mapToTransaction(data);
  },

  // Get low stock
  async getLowStockMaterials(): Promise<Material[]> {
    const all = await this.getAllMaterials();
    return all.filter(m => m.quantity <= m.minThreshold);
  },

  // Initialize
  async initializeMaterials(materials: Material[]): Promise<void> {
    for (const material of materials) {
      // Check if exists by name/category/variant
      const { data } = await supabase
        .from("materials")
        .select("id")
        .eq("category", material.category)
        .eq("name", material.name)
        .eq("variant", material.variant || "")
        .single();
        
      if (!data) {
        await this.createMaterial(material);
      }
    }
  },

  // Mappers
  mapToMaterial(row: MaterialRow): Material {
    return {
      id: row.id,
      category: row.category,
      name: row.name,
      variant: row.variant || undefined,
      quantity: row.quantity,
      minThreshold: row.min_threshold,
      unit: row.unit,
      lastUpdated: row.updated_at || undefined
    };
  },

  mapToTransaction(row: MaterialTransactionRow): MaterialTransaction {
    return {
      id: row.id,
      materialId: row.material_id,
      materialName: row.material_name || "",
      type: row.transaction_type as "issue" | "receive" | "return",
      quantity: row.quantity,
      userId: row.user_id || "",
      userName: row.user_name || "",
      jobCardNumber: row.job_card_number || undefined,
      boardName: row.board_name || undefined,
      boardColor: row.board_color || undefined,
      recipientName: row.recipient_name || undefined,
      date: row.date || row.created_at || new Date().toISOString(),
      notes: row.notes || undefined
    };
  }
};