<![CDATA[
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Board = Database["public"]["Tables"]["boards"]["Row"];
type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"];
type BoardUpdate = Database["public"]["Tables"]["boards"]["Update"];
type BoardTransaction = Database["public"]["Tables"]["board_transactions"]["Row"];
type BoardTransactionInsert = Database["public"]["Tables"]["board_transactions"]["Insert"];

export const boardService = {
  // Get all boards with their current quantities
  async getAllBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .order("board_name", { ascending: true });

    if (error) {
      console.error("Error fetching boards:", error);
      throw error;
    }

    return data || [];
  },

  // Get a single board by ID
  async getBoardById(id: string): Promise<Board | null> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching board:", error);
      throw error;
    }

    return data;
  },

  // Create a new board (manual addition)
  async createBoard(board: Omit<BoardInsert, "id" | "created_at" | "updated_at">): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .insert([board])
      .select()
      .single();

    if (error) {
      console.error("Error creating board:", error);
      throw error;
    }

    // Record transaction
    if (data && board.quantity > 0) {
      await this.recordTransaction({
        board_id: data.id,
        quantity: board.quantity,
        transaction_type: "add",
        notes: "Initial stock"
      });
    }

    return data;
  },

  // Update board
  async updateBoard(id: string, updates: BoardUpdate): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating board:", error);
      throw error;
    }

    return data;
  },

  // Delete board
  async deleteBoard(id: string): Promise<void> {
    const { error } = await supabase
      .from("boards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting board:", error);
      throw error;
    }
  },

  // Add quantity to board (receive new stock)
  async addQuantity(boardId: string, quantity: number, notes?: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error("Board not found");

    const newQuantity = board.quantity + quantity;

    const updated = await this.updateBoard(boardId, {
      quantity: newQuantity
    });

    // Record transaction
    await this.recordTransaction({
      board_id: boardId,
      quantity,
      transaction_type: "add",
      notes: notes || "Stock added"
    });

    return updated;
  },

  // Deduct quantity from board (sale/usage)
  async deductQuantity(boardId: string, quantity: number, notes?: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error("Board not found");

    if (board.quantity < quantity) {
      throw new Error(`Insufficient quantity. Available: ${board.quantity}, Requested: ${quantity}`);
    }

    const newQuantity = board.quantity - quantity;

    const updated = await this.updateBoard(boardId, {
      quantity: newQuantity
    });

    // Record transaction
    await this.recordTransaction({
      board_id: boardId,
      quantity,
      transaction_type: "deduct",
      notes: notes || "Stock deducted"
    });

    return updated;
  },

  // Sell board (deduct quantity)
  async sellBoard(boardId: string, quantity: number, customerName?: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error("Board not found");

    if (board.quantity < quantity) {
      throw new Error(`Insufficient quantity. Available: ${board.quantity}, Requested: ${quantity}`);
    }

    const newQuantity = board.quantity - quantity;

    const updated = await this.updateBoard(boardId, {
      quantity: newQuantity
    });

    // Record transaction
    await this.recordTransaction({
      board_id: boardId,
      quantity,
      transaction_type: "sale",
      notes: customerName ? `Sold to ${customerName}` : "Sold"
    });

    return updated;
  },

  // Create board from completed job (automatic)
  async createBoardFromJob(jobData: {
    board_name: string;
    type: string;
    color: string;
    job_card_number: string;
    quantity?: number;
  }): Promise<Board> {
    // Check if board with same name, type, and color already exists
    const { data: existingBoards } = await supabase
      .from("boards")
      .select("*")
      .eq("board_name", jobData.board_name)
      .eq("type", jobData.type)
      .eq("color", jobData.color)
      .limit(1);

    if (existingBoards && existingBoards.length > 0) {
      // Board exists, add to quantity
      const board = existingBoards[0];
      const quantity = jobData.quantity || 1;
      return await this.addQuantity(
        board.id,
        quantity,
        `Manufactured from job ${jobData.job_card_number}`
      );
    } else {
      // Create new board
      const newBoard = await this.createBoard({
        board_name: jobData.board_name,
        type: jobData.type,
        color: jobData.color,
        quantity: jobData.quantity || 1,
        minimum_quantity: jobData.type.toLowerCase().includes("dinrail") ? 5 : 2
      });

      // Record transaction
      await this.recordTransaction({
        board_id: newBoard.id,
        quantity: jobData.quantity || 1,
        transaction_type: "manufacture",
        notes: `Manufactured from job ${jobData.job_card_number}`
      });

      return newBoard;
    }
  },

  // Get low stock boards
  async getLowStockBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .filter("quantity", "lte", "minimum_quantity")
      .order("quantity", { ascending: true });

    if (error) {
      console.error("Error fetching low stock boards:", error);
      throw error;
    }

    return data || [];
  },

  // Record board transaction
  async recordTransaction(transaction: Omit<BoardTransactionInsert, "id" | "created_at">): Promise<void> {
    const { error } = await supabase
      .from("board_transactions")
      .insert([transaction]);

    if (error) {
      console.error("Error recording transaction:", error);
      throw error;
    }
  },

  // Get board transactions
  async getBoardTransactions(boardId: string): Promise<BoardTransaction[]> {
    const { data, error } = await supabase
      .from("board_transactions")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }

    return data || [];
  }
};
</![CDATA[>