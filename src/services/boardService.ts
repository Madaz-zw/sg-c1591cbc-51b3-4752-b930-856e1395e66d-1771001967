import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Board, BoardTransaction } from "@/types";

type BoardRow = Database["public"]["Tables"]["boards"]["Row"];
type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"];
type BoardUpdate = Database["public"]["Tables"]["boards"]["Update"];
type BoardTransactionRow = Database["public"]["Tables"]["board_transactions"]["Row"];
type BoardTransactionInsert = Database["public"]["Tables"]["board_transactions"]["Insert"];

export const boardService = {
  // Get all boards
  async getAllBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .order("type", { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToBoard);
  },

  // Create board
  async createBoard(board: Omit<Board, "id">): Promise<Board> {
    const insertData: BoardInsert = {
      type: board.type,
      color: board.color,
      quantity: board.quantity,
      min_threshold: board.minThreshold
    };

    const { data, error } = await supabase
      .from("boards")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToBoard(data);
  },

  // Update board
  async updateBoard(id: string, updates: Partial<Board>): Promise<Board> {
    const updateData: BoardUpdate = {};
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.minThreshold !== undefined) updateData.min_threshold = updates.minThreshold;
    if (updates.lastUpdated) updateData.updated_at = updates.lastUpdated;

    const { data, error } = await supabase
      .from("boards")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToBoard(data);
  },

  // Get low stock boards
  async getLowStockBoards(): Promise<Board[]> {
    const all = await this.getAllBoards();
    return all.filter(b => b.quantity <= b.minThreshold);
  },

  // Board Transactions
  async getAllTransactions(): Promise<BoardTransaction[]> {
    const { data, error } = await supabase
      .from("board_transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToTransaction);
  },

  // Manufacture boards (add stock)
  async manufactureBoard(
    boardId: string,
    quantity: number,
    userId: string,
    userName: string,
    notes?: string
  ): Promise<Board> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error("Board not found");

    // 1. Update board stock
    const updatedBoard = await this.updateBoard(boardId, {
      quantity: board.quantity + quantity,
      lastUpdated: new Date().toISOString()
    });

    // 2. Create transaction
    await this.createTransaction({
      boardId,
      type: "manufactured",
      quantity,
      userId,
      userName,
      date: new Date().toISOString(),
      notes
    });

    return updatedBoard;
  },

  // Sell boards (reduce stock)
  async sellBoard(
    boardId: string,
    quantity: number,
    customerName: string,
    userId: string,
    userName: string,
    notes?: string
  ): Promise<Board> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error("Board not found");

    if (board.quantity < quantity) {
      throw new Error("Insufficient stock");
    }

    // 1. Update board stock
    const updatedBoard = await this.updateBoard(boardId, {
      quantity: board.quantity - quantity,
      lastUpdated: new Date().toISOString()
    });

    // 2. Create transaction
    await this.createTransaction({
      boardId,
      type: "sold",
      quantity,
      customerName,
      userId,
      userName,
      date: new Date().toISOString(),
      notes
    });

    return updatedBoard;
  },

  async createTransaction(transaction: Omit<BoardTransaction, "id">): Promise<BoardTransaction> {
    const insertData: BoardTransactionInsert = {
      board_id: transaction.boardId,
      board_name: transaction.boardName,
      type: transaction.type,
      quantity: transaction.quantity,
      customer_name: transaction.customerName,
      user_id: transaction.userId,
      user_name: transaction.userName,
      date: transaction.date,
      notes: transaction.notes
    };

    const { data, error } = await supabase
      .from("board_transactions")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToTransaction(data);
  },

  // Initialize default boards
  async initializeBoards(): Promise<void> {
    const existing = await this.getAllBoards();
    if (existing.length > 0) return;

    const defaultBoards = [
      { type: "Surface Mounted", color: "Orange", quantity: 0, minThreshold: 5 },
      { type: "Surface Mounted", color: "White", quantity: 0, minThreshold: 5 },
      { type: "Surface Mounted", color: "Grey", quantity: 0, minThreshold: 5 },
      { type: "Mini-Flush", color: "Red", quantity: 0, minThreshold: 2 },
      { type: "Mini-Flush", color: "Black", quantity: 0, minThreshold: 2 },
      { type: "Watertight", color: "Grey", quantity: 0, minThreshold: 5 },
      { type: "Enclosure", color: "White", quantity: 0, minThreshold: 5 }
    ];

    for (const board of defaultBoards) {
      await this.createBoard(board as any);
    }
  },

  // Mappers
  mapToBoard(row: BoardRow): Board {
    return {
      id: row.id,
      type: row.type as "Surface Mounted" | "Mini-Flush" | "Watertight" | "Enclosure",
      color: row.color,
      quantity: row.quantity,
      minThreshold: row.min_threshold,
      lastUpdated: row.updated_at || new Date().toISOString()
    };
  },

  mapToTransaction(row: BoardTransactionRow): BoardTransaction {
    return {
      id: row.id,
      boardId: row.board_id,
      boardName: row.board_name,
      type: row.type as "manufactured" | "sold",
      quantity: row.quantity,
      customerName: row.customer_name || undefined,
      userId: row.user_id,
      userName: row.user_name,
      date: row.date,
      notes: row.notes || undefined
    };
  }
};