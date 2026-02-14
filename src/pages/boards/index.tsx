import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart, Package, AlertTriangle, Edit, Trash2, History } from "lucide-react";
import { boardService } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Board = Database["public"]["Tables"]["boards"]["Row"];
type BoardTransaction = Database["public"]["Tables"]["board_transactions"]["Row"];

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [lowStockBoards, setLowStockBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [isTransactionsDialogOpen, setIsTransactionsDialogOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [transactions, setTransactions] = useState<BoardTransaction[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    board_name: "",
    type: "Dinrail" as string,
    color: "",
    quantity: 1,
    min_threshold: 5,
  });

  const [quantityOperation, setQuantityOperation] = useState<"add" | "deduct">("add");
  const [quantityAmount, setQuantityAmount] = useState(1);
  const [operationNotes, setOperationNotes] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    loadBoards();
    loadLowStockBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await boardService.getAllBoards();
      setBoards(data);
    } catch (error) {
      console.error("Error loading boards:", error);
      toast({
        title: "Error",
        description: "Failed to load boards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLowStockBoards = async () => {
    try {
      const data = await boardService.getLowStockBoards();
      setLowStockBoards(data);
    } catch (error) {
      console.error("Error loading low stock boards:", error);
    }
  };

  const handleAddBoard = async () => {
    try {
      await boardService.createBoard(formData);
      toast({
        title: "Success",
        description: "Board added successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadBoards();
      loadLowStockBoards();
    } catch (error) {
      console.error("Error adding board:", error);
      toast({
        title: "Error",
        description: "Failed to add board",
        variant: "destructive",
      });
    }
  };

  const handleEditBoard = async () => {
    if (!selectedBoard) return;

    try {
      await boardService.updateBoard(selectedBoard.id, {
        board_name: formData.board_name,
        type: formData.type,
        color: formData.color,
        min_threshold: formData.min_threshold,
      });
      toast({
        title: "Success",
        description: "Board updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedBoard(null);
      resetForm();
      loadBoards();
      loadLowStockBoards();
    } catch (error) {
      console.error("Error updating board:", error);
      toast({
        title: "Error",
        description: "Failed to update board",
        variant: "destructive",
      });
    }
  };

  const handleQuantityOperation = async () => {
    if (!selectedBoard) return;

    try {
      if (quantityOperation === "add") {
        await boardService.addQuantity(selectedBoard.id, quantityAmount, operationNotes);
        toast({
          title: "Success",
          description: `Added ${quantityAmount} units to ${selectedBoard.board_name}`,
        });
      } else {
        await boardService.deductQuantity(selectedBoard.id, quantityAmount, operationNotes);
        toast({
          title: "Success",
          description: `Deducted ${quantityAmount} units from ${selectedBoard.board_name}`,
        });
      }
      setIsQuantityDialogOpen(false);
      setSelectedBoard(null);
      setQuantityAmount(1);
      setOperationNotes("");
      loadBoards();
      loadLowStockBoards();
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleSellBoard = async () => {
    if (!selectedBoard) return;

    try {
      await boardService.sellBoard(selectedBoard.id, quantityAmount, customerName);
      toast({
        title: "Success",
        description: `Sold ${quantityAmount} units of ${selectedBoard.board_name}`,
      });
      setIsSellDialogOpen(false);
      setSelectedBoard(null);
      setQuantityAmount(1);
      setCustomerName("");
      loadBoards();
      loadLowStockBoards();
    } catch (error: any) {
      console.error("Error selling board:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sell board",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBoard = async (board: Board) => {
    if (!confirm(`Are you sure you want to delete ${board.board_name}?`)) return;

    try {
      await boardService.deleteBoard(board.id);
      toast({
        title: "Success",
        description: "Board deleted successfully",
      });
      loadBoards();
      loadLowStockBoards();
    } catch (error) {
      console.error("Error deleting board:", error);
      toast({
        title: "Error",
        description: "Failed to delete board",
        variant: "destructive",
      });
    }
  };

  const handleViewTransactions = async (board: Board) => {
    try {
      setSelectedBoard(board);
      const data = await boardService.getBoardTransactions(board.id);
      setTransactions(data);
      setIsTransactionsDialogOpen(true);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (board: Board) => {
    setSelectedBoard(board);
    setFormData({
      board_name: board.board_name,
      type: board.type,
      color: board.color,
      quantity: board.quantity,
      min_threshold: board.min_threshold,
    });
    setIsEditDialogOpen(true);
  };

  const openQuantityDialog = (board: Board, operation: "add" | "deduct") => {
    setSelectedBoard(board);
    setQuantityOperation(operation);
    setQuantityAmount(1);
    setOperationNotes("");
    setIsQuantityDialogOpen(true);
  };

  const openSellDialog = (board: Board) => {
    setSelectedBoard(board);
    setQuantityAmount(1);
    setCustomerName("");
    setIsSellDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      board_name: "",
      type: "Dinrail",
      color: "",
      quantity: 1,
      min_threshold: 5,
    });
  };

  const getStockStatus = (board: Board) => {
    if (board.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (board.quantity <= board.min_threshold) {
      return <Badge className="bg-yellow-500">Low Stock</Badge>;
    } else {
      return <Badge className="bg-green-500">In Stock</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Finished Boards Inventory</h1>
            <p className="text-muted-foreground">
              Manage finished electrical panel boards
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Package className="mr-2 h-4 w-4" />
            Add New Board
          </Button>
        </div>

        {lowStockBoards.length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>
                {lowStockBoards.length} board(s) are running low on stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {lowStockBoards.map((board) => (
                  <li key={board.id} className="flex justify-between items-center">
                    <span className="font-medium">
                      {board.board_name} ({board.type} - {board.color})
                    </span>
                    <Badge variant="outline" className="bg-white dark:bg-gray-800">
                      {board.quantity} units (Min: {board.min_threshold})
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Boards</CardTitle>
            <CardDescription>
              View and manage your finished boards inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : boards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No boards found. Add your first board to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Board Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Min. Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boards.map((board) => (
                    <TableRow key={board.id}>
                      <TableCell className="font-medium">{board.board_name}</TableCell>
                      <TableCell>{board.type}</TableCell>
                      <TableCell>{board.color}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {board.quantity}
                      </TableCell>
                      <TableCell className="text-right">{board.min_threshold}</TableCell>
                      <TableCell>{getStockStatus(board)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openQuantityDialog(board, "add")}
                            title="Add Stock"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openQuantityDialog(board, "deduct")}
                            title="Deduct Stock"
                            disabled={board.quantity === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSellDialog(board)}
                            title="Sell Board"
                            disabled={board.quantity === 0}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTransactions(board)}
                            title="View History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(board)}
                            title="Edit Board"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBoard(board)}
                            title="Delete Board"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Board</DialogTitle>
              <DialogDescription>
                Add a new finished board to your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="board_name">Board Name</Label>
                <Input
                  id="board_name"
                  value={formData.board_name}
                  onChange={(e) =>
                    setFormData({ ...formData, board_name: e.target.value })
                  }
                  placeholder="e.g., Main Distribution Board"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      type: value,
                      min_threshold: value.toLowerCase().includes("dinrail") ? 5 : 2,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinrail">Dinrail</SelectItem>
                    <SelectItem value="Hynman">Hynman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="e.g., Grey, White, Black"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Initial Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="min_threshold">Minimum Quantity Alert</Label>
                <Input
                  id="min_threshold"
                  type="number"
                  min="1"
                  value={formData.min_threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_threshold: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBoard}>Add Board</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
              <DialogDescription>Update board information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_board_name">Board Name</Label>
                <Input
                  id="edit_board_name"
                  value={formData.board_name}
                  onChange={(e) =>
                    setFormData({ ...formData, board_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinrail">Dinrail</SelectItem>
                    <SelectItem value="Hynman">Hynman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_color">Color</Label>
                <Input
                  id="edit_color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_min_threshold">Minimum Quantity Alert</Label>
                <Input
                  id="edit_min_threshold"
                  type="number"
                  min="1"
                  value={formData.min_threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_threshold: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditBoard}>Update Board</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isQuantityDialogOpen} onOpenChange={setIsQuantityDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {quantityOperation === "add" ? "Add Stock" : "Deduct Stock"}
              </DialogTitle>
              <DialogDescription>
                {selectedBoard?.board_name} - Current: {selectedBoard?.quantity} units
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity_amount">Quantity</Label>
                <Input
                  id="quantity_amount"
                  type="number"
                  min="1"
                  value={quantityAmount}
                  onChange={(e) => setQuantityAmount(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="operation_notes">Notes (Optional)</Label>
                <Input
                  id="operation_notes"
                  value={operationNotes}
                  onChange={(e) => setOperationNotes(e.target.value)}
                  placeholder="e.g., Received from factory"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsQuantityDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleQuantityOperation}>
                {quantityOperation === "add" ? "Add" : "Deduct"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sell Board</DialogTitle>
              <DialogDescription>
                {selectedBoard?.board_name} - Available: {selectedBoard?.quantity} units
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sell_quantity">Quantity to Sell</Label>
                <Input
                  id="sell_quantity"
                  type="number"
                  min="1"
                  max={selectedBoard?.quantity || 1}
                  value={quantityAmount}
                  onChange={(e) => setQuantityAmount(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="customer_name">Customer Name (Optional)</Label>
                <Input
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., ABC Company"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSellDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSellBoard}>Sell</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isTransactionsDialogOpen}
          onOpenChange={setIsTransactionsDialogOpen}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Transaction History</DialogTitle>
              <DialogDescription>
                {selectedBoard?.board_name} - {selectedBoard?.type} ({selectedBoard?.color})
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.transaction_type === "add" ||
                              transaction.transaction_type === "manufacture"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.transaction_type === "add" ||
                          transaction.transaction_type === "manufacture"
                            ? "+"
                            : "-"}
                          {transaction.quantity}
                        </TableCell>
                        <TableCell>{transaction.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}