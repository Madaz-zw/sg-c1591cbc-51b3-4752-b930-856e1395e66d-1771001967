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
      status: tool.status,
      checked_out_to: tool.checkedOutTo || null,
      checked_out_by: tool.checkedOutBy || null,
      checked_out_date: tool.checkedOutDate || null,
      is_damaged: tool.isDamaged || false
    };

    const { data, error } = await supabase
      .from("tools")
      .insert(newTool)
      .select()
      .single();

    if (error) throw error;
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

  // Check out tool
  async checkOutTool(id: string, workerName: string, userId: string): Promise<Tool> {
    return this.updateTool(id, {
      status: "checked_out",
      checked_out_to: workerName,
      checked_out_by: userId,
      checked_out_date: new Date().toISOString()
    });
  },

  // Return tool
  async returnTool(id: string): Promise<Tool> {
    return this.updateTool(id, {
      status: "available",
      checked_out_to: null,
      checked_out_by: null,
      checked_out_date: null
    });
  },

  // Mark tool as damaged
  async markAsDamaged(id: string): Promise<Tool> {
    return this.updateTool(id, {
      status: "damaged",
      is_damaged: true
    });
  },

  // Get all transactions
  async getAllTransactions(): Promise<ToolTransaction[]> {
    const { data, error } = await supabase
      .from("tool_transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToTransaction);
  },

  // Create transaction
  async createTransaction(transaction: Omit<ToolTransaction, "id">): Promise<ToolTransaction> {
    const newTransaction: ToolTransactionInsert = {
      tool_id: transaction.toolId,
      tool_name: transaction.toolName,
      type: transaction.type,
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
      status: row.status as "available" | "checked_out" | "damaged",
      checkedOutTo: row.checked_out_to || undefined,
      checkedOutBy: row.checked_out_by || undefined,
      checkedOutDate: row.checked_out_date || undefined,
      isDamaged: row.is_damaged
    };
  },

  mapToTransaction(row: ToolTransactionRow): ToolTransaction {
    return {
      id: row.id,
      toolId: row.tool_id,
      toolName: row.tool_name,
      type: row.type as "checkout" | "return" | "damaged",
      userId: row.user_id,
      userName: row.user_name,
      date: row.date,
      notes: row.notes || undefined
    };
  }
};