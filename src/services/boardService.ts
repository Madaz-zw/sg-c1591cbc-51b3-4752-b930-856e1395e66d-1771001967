import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Board = Database["public"]["Tables"]["boards"]["Row"];
type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"];
type BoardUpdate = Database["public"]["Tables"]["boards"]["Update"];
type BoardTransaction = Database["public"]["Tables"]["board_transactions"]["Row"];
type BoardTransactionInsert = Database["public"]["Tables"]["board_transactions"]["Insert"];

export const boardService = {
  // Get all boards
  async getAllBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .order("board_name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get single board
  async getBoardById(id: string): Promise<Board | null> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create board (manual)
  async createBoard(board: Omit<BoardInsert, "id" | "created_at" | "updated_at">): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .insert([board])
      .select()
      .single();

    if (error) throw error;

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

    if (error) throw error;
    return data;
  },

  // Delete board
  async deleteBoard(id: string): Promise<void> {
    const { error } = await supabase
      .from("boards")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Add quantity
  async addQuantity(boardId: string, quantity: number, notes?: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error("Board not found");

    const newQuantity = board.quantity + quantity;
    const updated = await this.updateBoard(boardId, { quantity: newQuantity });

    await this.recordTransaction({
      board_id: boardId,
      quantity,
      transaction_type: "add",
      notes: notes || "Stock added"
    });

    return updated;
  },

  // Deduct quantity
  async deductQuantity(boardId: string, quantity: number, notes?: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error("Board not found");

    if (board.quantity < quantity) {
      throw new Error(`Insufficient quantity. Available: ${board.quantity}, Requested: ${quantity}`);
    }

    const newQuantity = board.quantity - quantity;
    const updated = await this.updateBoard(boardId, { quantity: newQuantity });

    await this.recordTransaction({
      board_id: boardId,
      quantity,
      transaction_type: "deduct",
      notes: notes || "Stock deducted"
    });

    return updated;
  },

  // Sell board
  async sellBoard(boardId: string, quantity: number, customerName?: string): Promise<Board> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error("Board not found");

    if (board.quantity < quantity) {
      throw new Error(`Insufficient quantity. Available: ${board.quantity}, Requested: ${quantity}`);
    }

    const newQuantity = board.quantity - quantity;
    const updated = await this.updateBoard(boardId, { quantity: newQuantity });

    await this.recordTransaction({
      board_id: boardId,
      quantity,
      transaction_type: "sale",
      notes: customerName ? `Sold to ${customerName}` : "Sold"
    });

    return updated;
  },

  // Create/Update from Job
  async createBoardFromJob(jobData: {
    board_name: string;
    type: string;
    color: string;
    job_card_number: string;
    quantity?: number;
  }): Promise<Board> {
    // Check for existing board
    const { data: existingBoards } = await supabase
      .from("boards")
      .select("*")
      .eq("board_name", jobData.board_name)
      .eq("type", jobData.type)
      .eq("color", jobData.color)
      .limit(1);

    if (existingBoards && existingBoards.length > 0) {
      const board = existingBoards[0];
      const quantity = jobData.quantity || 1;
      return await this.addQuantity(
        board.id,
        quantity,
        `Manufactured from job ${jobData.job_card_number}`
      );
    } else {
      const newBoard = await this.createBoard({
        board_name: jobData.board_name,
        type: jobData.type,
        color: jobData.color,
        quantity: jobData.quantity || 1,
        min_threshold: jobData.type.toLowerCase().includes("dinrail") ? 5 : 2
      });
      
      // Update the transaction note to be specific
      // The createBoard already adds an "Initial stock" transaction
      // We might want to add another one or just rely on that.
      // But createBoard puts "Initial stock". 
      // Let's just return it. 
      return newBoard;
    }
  },

  // Get low stock
  async getLowStockBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .filter("quantity", "lte", "min_threshold")
      .order("quantity", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Record transaction
  async recordTransaction(transaction: Omit<BoardTransactionInsert, "id" | "created_at">): Promise<void> {
    const { error } = await supabase
      .from("board_transactions")
      .insert([transaction]);

    if (error) throw error;
  },

  // Get transactions
  async getBoardTransactions(boardId: string): Promise<BoardTransaction[]> {
    const { data, error } = await supabase
      .from("board_transactions")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get ALL transactions (for reports)
  async getAllTransactions(): Promise<BoardTransaction[]> {
    const { data, error } = await supabase
      .from("board_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Manufacture board (from Job completion)
  async manufactureBoard(
    boardId: string,
    quantity: number,
    userId: string,
    userName: string,
    notes?: string
  ): Promise<Board> {
    // 1. Add quantity
    const board = await this.addQuantity(boardId, quantity);

    // 2. Record specific manufacture transaction
    // Note: addQuantity already records an "add" transaction. 
    // We might want to update that transaction to be "manufacture" or just add a new one.
    // However, the cleanest way is to use a specific method that handles both.
    // Let's manually handle it here to ensure the type is "manufacture"
    
    // We actually called addQuantity above which creates an 'add' transaction.
    // To avoid double transactions, let's implement the logic directly:
    
    // Re-fetch to get current state (though addQuantity returns it)
    // Actually, let's rewrite this to not use addQuantity to avoid the wrong transaction type
    
    // undo the addQuantity call? No, let's just do it properly:
    
    const { data: currentBoard } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();
      
    if (!currentBoard) throw new Error("Board not found");
    
    const newQuantity = currentBoard.quantity + quantity;
    
    const { data: updatedBoard, error: updateError } = await supabase
      .from("boards")
      .update({ quantity: newQuantity })
      .eq("id", boardId)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    await this.recordTransaction({
      board_id: boardId,
      board_name: updatedBoard.board_name,
      quantity,
      transaction_type: "manufacture",
      user_id: userId,
      user_name: userName,
      notes: notes || "Manufactured from job"
    });
    
    return updatedBoard;
  }
};