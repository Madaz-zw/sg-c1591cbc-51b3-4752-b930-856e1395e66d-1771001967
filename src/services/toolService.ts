import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Tool, ToolTransaction } from "@/types";

type ToolRow = Database["public"]["Tables"]["tools"]["Row"];
type ToolInsert = Database["public"]["Tables"]["tools"]["Insert"];
type ToolTransactionRow = Database["public"]["Tables"]["tool_transactions"]["Row"];
type ToolTransactionInsert = Database["public"]["Tables"]["tool_transactions"]["Insert"];

export const toolService = {
  // Get all tools
  async getAllTools(): Promise<Tool[]> {
    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToTool);
  },

  // Get tool by ID
  async getToolById(id: string): Promise<Tool | null> {
    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapToTool(data) : null;
  },

  // Create tool
  async createTool(tool: Omit<Tool, "id">): Promise<Tool> {
    const newTool: ToolInsert = {
      name: tool.name,
      code: tool.code || null,
      category: tool.category || null,
      status: tool.status,
      checked_out_to: tool.checkedOutTo || null,
      checked_out_by: tool.checkedOutBy || null,
      checked_out_date: tool.checkedOutDate || null,
      is_damaged: tool.isDamaged || false
    };

    console.log("Creating tool with data:", newTool);

    const { data, error } = await supabase
      .from("tools")
      .insert(newTool)
      .select()
      .single();

    if (error) {
      console.error("Tool creation error:", error);
      throw error;
    }
    
    console.log("Tool created successfully:", data);
    return this.mapToTool(data);
  },

  // Update tool
  async updateTool(id: string, updates: Partial<ToolInsert>): Promise<Tool> {
    const { data, error } = await supabase
      .from("tools")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToTool(data);
  },

  // Delete tool
  async deleteTool(id: string): Promise<void> {
    const { error } = await supabase
      .from("tools")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Internal helper for checkout update
  async _updateToolCheckoutStatus(id: string, workerName: string, userId: string): Promise<Tool> {
    return this.updateTool(id, {
      status: "checked_out",
      checked_out_to: workerName,
      checked_out_by: userId,
      checked_out_date: new Date().toISOString()
    });
  },

  // Checkout tool with transaction
  async checkoutTool(
    id: string,
    workerName: string,
    userId: string,
    userName: string
  ): Promise<Tool> {
    // Get tool info
    const tool = await this.getToolById(id);
    if (!tool) throw new Error("Tool not found");

    // Update tool status
    const updated = await this._updateToolCheckoutStatus(id, workerName, userId);

    // Create transaction
    await this.createTransaction({
      toolId: id,
      toolName: tool.name,
      type: "checkout",
      userId: userId,
      userName: userName,
      date: new Date().toISOString(),
      notes: `Checked out to ${workerName}`
    });

    return updated;
  },

  // Return tool with transaction
  async returnTool(
    id: string,
    userId: string,
    userName: string,
    notes?: string
  ): Promise<Tool> {
    // Get tool info
    const tool = await this.getToolById(id);
    if (!tool) throw new Error("Tool not found");

    // Update tool status
    const updated = await this.updateTool(id, {
      status: "available",
      checked_out_to: null,
      checked_out_by: null,
      checked_out_date: null
    });

    // Create transaction
    await this.createTransaction({
      toolId: id,
      toolName: tool.name,
      type: "return",
      userId: userId,
      userName: userName,
      date: new Date().toISOString(),
      notes: notes
    });

    return updated;
  },

  // Mark tool as damaged with transaction
  async markAsDamaged(
    id: string,
    userId: string,
    userName: string,
    notes: string
  ): Promise<Tool> {
    // Get tool info
    const tool = await this.getToolById(id);
    if (!tool) throw new Error("Tool not found");

    // Update tool status
    const updated = await this.updateTool(id, {
      status: "damaged",
      is_damaged: true,
      checked_out_to: null,
      checked_out_by: null,
      checked_out_date: null
    });

    // Create transaction
    await this.createTransaction({
      toolId: id,
      toolName: tool.name,
      type: "damage",
      userId: userId,
      userName: userName,
      date: new Date().toISOString(),
      notes: notes
    });

    return updated;
  },

  // Get all transactions
  async getAllTransactions(): Promise<ToolTransaction[]> {
    const { data, error } = await supabase
      .from("tool_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToTransaction);
  },

  // Create transaction
  async createTransaction(transaction: Omit<ToolTransaction, "id">): Promise<ToolTransaction> {
    const newTransaction: ToolTransactionInsert = {
      tool_id: transaction.toolId,
      tool_name: transaction.toolName,
      transaction_type: transaction.type,
      user_id: transaction.userId,
      user_name: transaction.userName,
      date: transaction.date,
      notes: transaction.notes || null
    };

    const { data, error } = await supabase
      .from("tool_transactions")
      .insert(newTransaction)
      .select()
      .single();

    if (error) throw error;
    return this.mapToTransaction(data);
  },

  // Helper functions
  mapToTool(row: ToolRow): Tool {
    return {
      id: row.id,
      name: row.name,
      code: row.code || undefined,
      category: row.category || "General",
      status: row.status as "available" | "checked_out" | "damaged",
      checkedOutTo: row.checked_out_to || undefined,
      checkedOutBy: row.checked_out_by || undefined,
      checkedOutDate: row.checked_out_date || undefined,
      isDamaged: row.is_damaged || false
    };
  },

  mapToTransaction(row: ToolTransactionRow): ToolTransaction {
    return {
      id: row.id,
      toolId: row.tool_id,
      toolName: row.tool_name || "",
      type: row.transaction_type as "checkout" | "return" | "damage",
      userId: row.user_id || "",
      userName: row.user_name || "",
      date: row.date || row.created_at || new Date().toISOString(),
      notes: row.notes || undefined
    };
  }
};