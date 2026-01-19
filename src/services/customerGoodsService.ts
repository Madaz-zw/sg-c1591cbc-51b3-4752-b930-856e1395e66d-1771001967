import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { CustomerGoods } from "@/types";

type CustomerGoodsRow = Database["public"]["Tables"]["customer_goods"]["Row"];
type CustomerGoodsInsert = Database["public"]["Tables"]["customer_goods"]["Insert"];
type CustomerGoodsUpdate = Database["public"]["Tables"]["customer_goods"]["Update"];

export const customerGoodsService = {
  // Get all customer goods
  async getAllCustomerGoods(): Promise<CustomerGoods[]> {
    const { data, error } = await supabase
      .from("customer_goods")
      .select("*")
      .order("received_date", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToCustomerGoods);
  },

  // Create customer goods
  async createCustomerGoods(goods: Omit<CustomerGoods, "id">): Promise<CustomerGoods> {
    const insertData: CustomerGoodsInsert = {
      customer_name: goods.customerName,
      description: goods.description,
      quantity: goods.quantity,
      status: goods.status,
      received_date: goods.receivedDate,
      received_by: goods.receivedBy,
      received_by_name: goods.receivedByName,
      notes: goods.notes
    };

    const { data, error } = await supabase
      .from("customer_goods")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCustomerGoods(data);
  },

  // Update customer goods
  async updateCustomerGoods(id: string, updates: Partial<CustomerGoods>): Promise<CustomerGoods> {
    const updateData: CustomerGoodsUpdate = {};
    if (updates.customerName) updateData.customer_name = updates.customerName;
    if (updates.description) updateData.description = updates.description;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.status) updateData.status = updates.status;
    if (updates.notes) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from("customer_goods")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCustomerGoods(data);
  },

  // Delete customer goods
  async deleteCustomerGoods(id: string): Promise<void> {
    const { error } = await supabase
      .from("customer_goods")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Map database row to CustomerGoods
  mapToCustomerGoods(row: CustomerGoodsRow): CustomerGoods {
    return {
      id: row.id,
      customerName: row.customer_name,
      description: row.description,
      quantity: row.quantity,
      status: row.status as "received" | "processed" | "returned",
      receivedDate: row.received_date,
      receivedBy: row.received_by,
      receivedByName: row.received_by_name,
      notes: row.notes || undefined
    };
  }
};