import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import {
  CircuitBoard,
  Plus,
  Search,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle
} from "lucide-react";
import { Board } from "@/types";
import { hasPermission } from "@/lib/mockAuth";
import { boardService } from "@/services/boardService";
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
import { Textarea } from "@/components/ui/textarea";

export default function BoardsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [manufactureDialogOpen, setManufactureDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [newBoardDialogOpen, setNewBoardDialogOpen] = useState(false);

  // Form States
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const [newBoard, setNewBoard] = useState({
    type: "Surface Mounted" as "Surface Mounted" | "Mini-Flush" | "Watertight" | "Enclosure",
    color: "",
    minThreshold: 5
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!hasPermission(user, "view_finished_boards")) {
      router.push("/dashboard");
      return;
    }

    loadBoards();
  }, [isAuthenticated, user, router]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await boardService.getAllBoards();
      setBoards(data);
    } catch (error) {
      console.error("Failed to load boards:", error);
      alert("Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoard.color) {
      alert("Please enter a board color");
      return;
    }

    try {
      await boardService.createBoard({
        type: newBoard.type,
        color: newBoard.color,
        quantity: 0,
        minThreshold: newBoard.minThreshold,
        lastUpdated: new Date().toISOString()
      });

      await loadBoards();
      setNewBoard({ type: "Surface Mounted", color: "", minThreshold: 5 });
      setNewBoardDialogOpen(false);
    } catch (error) {
      console.error("Failed to create board:", error);
      alert("Failed to create board");
    }
  };

  const handleManufacture = async () => {
    if (!selectedBoard || quantity < 1) return;

    try {
      await boardService.manufactureBoard(
        selectedBoard.id,
        quantity,
        user?.id || "",
        user?.name || "",
        notes
      );

      await loadBoards();
      setQuantity(1);
      setNotes("");
      setSelectedBoard(null);
      setManufactureDialogOpen(false);
    } catch (error) {
      console.error("Failed to manufacture board:", error);
      alert("Failed to manufacture board");
    }
  };

  const handleSell = async () => {
    if (!selectedBoard || quantity < 1 || !customerName) {
      alert("Please fill in all required fields");
      return;
    }

    if (selectedBoard.quantity < quantity) {
      alert("Insufficient stock!");
      return;
    }

    try {
      await boardService.sellBoard(
        selectedBoard.id,
        quantity,
        customerName,
        user?.id || "",
        user?.name || "",
        notes
      );

      await loadBoards();
      setQuantity(1);
      setCustomerName("");
      setNotes("");
      setSelectedBoard(null);
      setSellDialogOpen(false);
    } catch (error) {
      console.error("Failed to sell board:", error);
      alert("Failed to sell board");
    }
  };

  const canManage = hasPermission(user, "manage_finished_boards");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600 dark:text-slate-400">Loading boards...</div>
        </div>
      </DashboardLayout>
    );
  }

  const lowStockBoards = boards.filter(b => b.quantity <= b.minThreshold);
  const totalStock = boards.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <>
      <SEO
        title="Finished Boards - Josm Electrical"
        description="Inventory of finished dinrail and hynman boards"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Finished Boards</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage stock of Dinrail and Hynman boards
              </p>
            </div>
            {canManage && (
              <Dialog open={newBoardDialogOpen} onOpenChange={setNewBoardDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Board Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Board Type</DialogTitle>
                    <DialogDescription>Define a new board configuration</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Board Type</Label>
                      <Select
                        value={newBoard.type}
                        onValueChange={(v: "Surface Mounted" | "Mini-Flush" | "Watertight" | "Enclosure") => setNewBoard({ ...newBoard, type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Surface Mounted">Surface Mounted</SelectItem>
                          <SelectItem value="Mini-Flush">Mini-Flush</SelectItem>
                          <SelectItem value="Watertight">Watertight</SelectItem>
                          <SelectItem value="Enclosure">Enclosure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        placeholder="e.g., Orange, White, Grey"
                        value={newBoard.color}
                        onChange={(e) => setNewBoard({ ...newBoard, color: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minThreshold">Low Stock Alert Level</Label>
                      <Input
                        id="minThreshold"
                        type="number"
                        min="1"
                        value={newBoard.minThreshold}
                        onChange={(e) => setNewBoard({ ...newBoard, minThreshold: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button onClick={handleCreateBoard} className="w-full">
                      Add Board Type
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
                  Total Stock
                </CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalStock}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Board Types
                </CardTitle>
                <CircuitBoard className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{boards.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Low Stock Alerts
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lowStockBoards.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Status</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 5 : 4} className="text-center py-8 text-slate-500">
                          No boards found in inventory
                        </TableCell>
                      </TableRow>
                    ) : (
                      boards.map((board) => (
                        <TableRow key={board.id}>
                          <TableCell className="font-medium">{board.type}</TableCell>
                          <TableCell>{board.color}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${
                              board.quantity <= board.minThreshold ? "text-red-600" : "text-slate-900 dark:text-white"
                            }`}>
                              {board.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            {board.quantity <= board.minThreshold ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-green-500 hover:bg-green-600">In Stock</Badge>
                            )}
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBoard(board);
                                    setManufactureDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Stock
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => {
                                    setSelectedBoard(board);
                                    setSellDialogOpen(true);
                                  }}
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Sell
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Manufacture Dialog */}
          <Dialog open={manufactureDialogOpen} onOpenChange={setManufactureDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock (Manufactured)</DialogTitle>
                <DialogDescription>
                  Adding stock for {selectedBoard?.type} - {selectedBoard?.color}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Quantity Manufactured</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="e.g., Batch #123"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleManufacture} className="w-full">
                  Update Stock
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Sell Dialog */}
          <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Sale</DialogTitle>
                <DialogDescription>
                  Selling {selectedBoard?.type} - {selectedBoard?.color}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Quantity Sold</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedBoard?.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Additional sale details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleSell} className="w-full">
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