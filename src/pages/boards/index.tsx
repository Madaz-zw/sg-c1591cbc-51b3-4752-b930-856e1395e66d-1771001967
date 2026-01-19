import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CircuitBoard,
  Plus,
  Search,
  AlertTriangle,
  ShoppingCart,
  TrendingDown,
  Filter
} from "lucide-react";
import { Board, BoardTransaction } from "@/types";
import { getFromStorage, saveToStorage, generateId, STORAGE_KEYS } from "@/lib/storage";
import { hasPermission } from "@/lib/mockAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

export default function BoardsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<Board[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [newBoard, setNewBoard] = useState({
    type: "",
    color: "",
    quantity: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!hasPermission(user, "view_boards")) {
      router.push("/dashboard");
      return;
    }

    const storedBoards = getFromStorage<Board>(STORAGE_KEYS.BOARDS);
    setBoards(storedBoards);
    setFilteredBoards(storedBoards);
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    let filtered = boards;

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.color.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(b => b.type === typeFilter);
    }

    setFilteredBoards(filtered);
  }, [searchTerm, typeFilter, boards]);

  const totalBoards = boards.reduce((sum, b) => sum + b.quantity, 0);
  
  // Check for low stock based on rules: 5 for Dinrail, 2 for Hynman
  const lowStockBoards = boards.filter(b => {
    const threshold = b.type.toLowerCase().includes("dinrail") ? 5 : 2;
    return b.quantity <= threshold && b.quantity > 0;
  });

  const handleAddBoard = () => {
    if (!newBoard.type || !newBoard.color || !newBoard.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    const quantity = parseInt(newBoard.quantity);
    
    // Check if board with same type and color exists
    const existingBoardIndex = boards.findIndex(
      b => b.type === newBoard.type && b.color === newBoard.color
    );

    const updatedBoards = [...boards];

    if (existingBoardIndex >= 0) {
      updatedBoards[existingBoardIndex] = {
        ...updatedBoards[existingBoardIndex],
        quantity: updatedBoards[existingBoardIndex].quantity + quantity,
        lastUpdated: new Date().toISOString()
      };
    } else {
      const board: Board = {
        id: generateId(),
        type: newBoard.type as "Dinrail" | "Hynman",
        color: newBoard.color,
        quantity: quantity,
        minThreshold: newBoard.type === "Dinrail" ? 5 : 2,
        lastUpdated: new Date().toISOString()
      };
      updatedBoards.push(board);
    }

    setBoards(updatedBoards);
    saveToStorage(STORAGE_KEYS.BOARDS, updatedBoards);
    
    // Record transaction
    const transactions = getFromStorage<BoardTransaction>(STORAGE_KEYS.BOARD_TRANSACTIONS);
    transactions.push({
      id: generateId(),
      boardId: existingBoardIndex >= 0 ? updatedBoards[existingBoardIndex].id : updatedBoards[updatedBoards.length - 1].id,
      boardName: `${newBoard.type} - ${newBoard.color}`,
      type: "manufactured",
      quantity: quantity,
      userId: user?.id || "",
      userName: user?.name || "",
      date: new Date().toISOString(),
      notes: "Production completed"
    });
    saveToStorage(STORAGE_KEYS.BOARD_TRANSACTIONS, transactions);

    setNewBoard({ type: "", color: "", quantity: "" });
    setAddDialogOpen(false);
  };

  const handleSellBoard = () => {
    if (!selectedBoard || !sellQuantity) return;

    const quantity = parseInt(sellQuantity);
    if (quantity > selectedBoard.quantity) {
      alert("Cannot sell more than available quantity");
      return;
    }

    const updatedBoards = boards.map(b => {
      if (b.id === selectedBoard.id) {
        return {
          ...b,
          quantity: b.quantity - quantity,
          lastUpdated: new Date().toISOString()
        };
      }
      return b;
    });

    setBoards(updatedBoards);
    saveToStorage(STORAGE_KEYS.BOARDS, updatedBoards);

    // Record transaction
    const transactions = getFromStorage<BoardTransaction>(STORAGE_KEYS.BOARD_TRANSACTIONS);
    transactions.push({
      id: generateId(),
      boardId: selectedBoard.id,
      boardName: `${selectedBoard.type} - ${selectedBoard.color}`,
      type: "sold",
      quantity: quantity,
      userId: user?.id || "",
      userName: user?.name || "",
      customerName: customerName,
      date: new Date().toISOString(),
      notes: "Sold to customer"
    });
    saveToStorage(STORAGE_KEYS.BOARD_TRANSACTIONS, transactions);

    setSellQuantity("");
    setCustomerName("");
    setSelectedBoard(null);
    setSellDialogOpen(false);
  };

  const canManage = hasPermission(user, "manage_boards");

  return (
    <>
      <SEO
        title="Finished Boards - Josm Electrical"
        description="Inventory of finished electrical panel boards"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Finished Boards</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track manufactured boards and sales
              </p>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Production
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Finished Boards</DialogTitle>
                    <DialogDescription>Add newly manufactured boards to inventory</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="boardType">Board Type *</Label>
                      <Select value={newBoard.type} onValueChange={(value) => setNewBoard({ ...newBoard, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dinrail">Dinrail</SelectItem>
                          <SelectItem value="Hynman">Hynman</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boardColor">Color *</Label>
                      <Select value={newBoard.color} onValueChange={(value) => setNewBoard({ ...newBoard, color: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Orange">Orange</SelectItem>
                          <SelectItem value="White">White</SelectItem>
                          <SelectItem value="Grey">Grey</SelectItem>
                          <SelectItem value="Red">Red</SelectItem>
                          <SelectItem value="Black">Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="0"
                        value={newBoard.quantity}
                        onChange={(e) => setNewBoard({ ...newBoard, quantity: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddBoard} className="w-full">
                      Add to Inventory
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Boards in Stock
                </CardTitle>
                <CircuitBoard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalBoards}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Low Stock Types
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{lowStockBoards.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Sold (This Month)
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {/* Placeholder - would calculate from transactions */}
                  -
                </div>
              </CardContent>
            </Card>
          </div>

          {lowStockBoards.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-300">
                <strong>{lowStockBoards.length} board types</strong> are below minimum threshold (5 for Dinrail, 2 for Hynman)
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search boards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Dinrail">Dinrail</SelectItem>
                    <SelectItem value="Hynman">Hynman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory List</CardTitle>
              <CardDescription>
                {filteredBoards.length} items found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Min Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBoards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-slate-500">
                          No finished boards in stock
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBoards.map((board) => {
                        const threshold = board.type === "Dinrail" ? 5 : 2;
                        const isLowStock = board.quantity <= threshold;
                        
                        return (
                          <TableRow key={board.id}>
                            <TableCell className="font-medium">{board.type}</TableCell>
                            <TableCell>{board.color}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {board.quantity}
                            </TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-slate-400">
                              {threshold}
                            </TableCell>
                            <TableCell>
                              {board.quantity === 0 ? (
                                <Badge variant="destructive">Out of Stock</Badge>
                              ) : isLowStock ? (
                                <Badge className="bg-orange-500 hover:bg-orange-600">Low Stock</Badge>
                              ) : (
                                <Badge className="bg-green-500 hover:bg-green-600">In Stock</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(board.lastUpdated).toLocaleDateString()}
                            </TableCell>
                            {canManage && (
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBoard(board);
                                    setSellDialogOpen(true);
                                  }}
                                  disabled={board.quantity === 0}
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Sell
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sell Board</DialogTitle>
                <DialogDescription>
                  {selectedBoard?.type} - {selectedBoard?.color}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Stock</Label>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedBoard?.quantity}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellQty">Quantity to Sell *</Label>
                  <Input
                    id="sellQty"
                    type="number"
                    placeholder="Enter quantity"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                  />
                </div>
                <Button onClick={handleSellBoard} className="w-full">
                  Confirm Sale
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
}