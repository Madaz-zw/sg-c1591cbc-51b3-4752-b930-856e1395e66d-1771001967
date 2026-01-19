import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Material, MaterialTransaction, MaterialRequest } from "@/types";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"];
type MaterialUpdate = Database["public"]["Tables"]["materials"]["Update"];
type MaterialTransactionRow = Database["public"]["Tables"]["material_transactions"]["Row"];
type MaterialTransactionInsert = Database["public"]["Tables"]["material_transactions"]["Insert"];
type MaterialRequestRow = Database["public"]["Tables"]["material_requests"]["Row"];
type MaterialRequestInsert = Database["public"]["Tables"]["material_requests"]["Insert"];

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

  // Get all requests
  async getAllRequests(): Promise<MaterialRequest[]> {
    const { data, error } = await supabase
      .from("material_requests")
      .select("*")
      .order("request_date", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToRequest);
  },

  // Create request
  async createRequest(request: Omit<MaterialRequest, "id">): Promise<MaterialRequest> {
    const insertData: MaterialRequestInsert = {
      material_id: request.materialId,
      material_name: request.materialName,
      quantity: request.quantity,
      requested_by: request.requestedBy,
      requested_by_name: request.requestedByName,
      job_card_number: request.jobCardNumber,
      // Default values for required fields not in input
      board_name: "",
      board_color: "",
      recipient_name: "",
      status: request.status,
      request_date: request.requestDate,
      notes: request.notes
    };

    const { data, error } = await supabase
      .from("material_requests")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToRequest(data);
  },

  // Update request status
  async updateRequestStatus(
    id: string,
    status: "approved" | "rejected",
    approverId: string,
    approverName: string,
    notes?: string
  ): Promise<MaterialRequest> {
    const updates: any = {
      status,
      approved_by: approverId,
      approved_by_name: approverName,
      approval_date: new Date().toISOString()
    };
    
    if (notes) updates.notes = notes;

    const { data, error } = await supabase
      .from("material_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // If approved, verify stock and create transaction automatically
    if (status === "approved" && data) {
      const request = this.mapToRequest(data);
      // Logic to deduct stock could go here, or be handled separately by the approver
    }

    return this.mapToRequest(data);
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

  // Receive material (increase quantity and record transaction)
  async receiveMaterial(
    materialId: string,
    quantity: number,
    userId: string,
    userName: string
  ): Promise<Material> {
    // Get current material
    const material = await this.getMaterialById(materialId);
    if (!material) throw new Error("Material not found");

    // Update quantity
    const newQuantity = material.quantity + quantity;
    const updated = await this.updateQuantity(materialId, newQuantity);

    // Create transaction
    await this.createTransaction({
      materialId: materialId,
      materialName: material.name,
      type: "receive",
      quantity: quantity,
      userId: userId,
      userName: userName,
      date: new Date().toISOString()
    });

    return updated;
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
  },

  // Helper mapping
  mapToRequest(row: MaterialRequestRow): MaterialRequest {
    return {
      id: row.id,
      materialId: row.material_id,
      materialName: row.material_name,
      quantity: row.quantity,
      requestedBy: row.requested_by,
      requestedByName: row.requested_by_name,
      jobCardNumber: row.job_card_number,
      status: row.status as "pending" | "approved" | "rejected",
      requestDate: row.request_date,
      approvedBy: row.approved_by || undefined,
      approvedByName: row.approved_by_name || undefined,
      approvalDate: row.approval_date || undefined,
      notes: row.notes || undefined
    };
  }
};