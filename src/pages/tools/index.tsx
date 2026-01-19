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
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  UserCheck,
  ToolIcon,
  Filter
} from "lucide-react";
import { Tool, ToolTransaction } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";

export default function ToolsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [workerName, setWorkerName] = useState("");
  const [notes, setNotes] = useState("");

  const [newTool, setNewTool] = useState({
    name: "",
    code: "",
    category: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!hasPermission(user, "view_tools")) {
      router.push("/dashboard");
      return;
    }

    const storedTools = getFromStorage<Tool>(STORAGE_KEYS.TOOLS);
    setTools(storedTools);
    setFilteredTools(storedTools);
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    let filtered = tools;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.checkedOutByName && t.checkedOutByName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    setFilteredTools(filtered);
  }, [searchTerm, statusFilter, categoryFilter, tools]);

  const categories = Array.from(new Set(tools.map(t => t.category))).sort();
  const availableCount = tools.filter(t => t.status === "available").length;
  const checkedOutCount = tools.filter(t => t.status === "checked_out").length;
  const damagedCount = tools.filter(t => t.status === "damaged").length;

  const handleAddTool = () => {
    if (!newTool.name || !newTool.code || !newTool.category) {
      alert("Please fill in all required fields");
      return;
    }

    const tool: Tool = {
      id: generateId(),
      name: newTool.name,
      code: newTool.code,
      status: "available",
      category: newTool.category
    };

    const updatedTools = [...tools, tool];
    setTools(updatedTools);
    saveToStorage(STORAGE_KEYS.TOOLS, updatedTools);
    
    setNewTool({ name: "", code: "", category: "" });
    setAddDialogOpen(false);
  };

  const handleCheckout = () => {
    if (!selectedTool || !workerName) {
      alert("Please enter worker name");
      return;
    }

    const updatedTools = tools.map(t => {
      if (t.id === selectedTool.id) {
        return {
          ...t,
          status: "checked_out" as const,
          checkedOutBy: user?.id,
          checkedOutByName: workerName,
          checkedOutAt: new Date().toISOString()
        };
      }
      return t;
    });

    setTools(updatedTools);
    saveToStorage(STORAGE_KEYS.TOOLS, updatedTools);

    const transactions = getFromStorage<ToolTransaction>(STORAGE_KEYS.TOOL_TRANSACTIONS);
    transactions.push({
      id: generateId(),
      toolId: selectedTool.id,
      toolName: `${selectedTool.name} (${selectedTool.code})`,
      type: "checkout",
      workerName: workerName,
      workerId: user?.id || "",
      date: new Date().toISOString(),
      notes: notes || undefined
    });
    saveToStorage(STORAGE_KEYS.TOOL_TRANSACTIONS, transactions);

    setWorkerName("");
    setNotes("");
    setSelectedTool(null);
    setCheckoutDialogOpen(false);
  };

  const handleReturn = () => {
    if (!selectedTool) return;

    const updatedTools = tools.map(t => {
      if (t.id === selectedTool.id) {
        return {
          ...t,
          status: "available" as const,
          checkedOutBy: undefined,
          checkedOutByName: undefined,
          checkedOutAt: undefined
        };
      }
      return t;
    });

    setTools(updatedTools);
    saveToStorage(STORAGE_KEYS.TOOLS, updatedTools);

    const transactions = getFromStorage<ToolTransaction>(STORAGE_KEYS.TOOL_TRANSACTIONS);
    transactions.push({
      id: generateId(),
      toolId: selectedTool.id,
      toolName: `${selectedTool.name} (${selectedTool.code})`,
      type: "return",
      workerName: selectedTool.checkedOutByName || "",
      workerId: selectedTool.checkedOutBy || "",
      date: new Date().toISOString(),
      notes: notes || undefined
    });
    saveToStorage(STORAGE_KEYS.TOOL_TRANSACTIONS, transactions);

    setNotes("");
    setSelectedTool(null);
    setReturnDialogOpen(false);
  };

  const handleMarkDamaged = () => {
    if (!selectedTool) return;

    const updatedTools = tools.map(t => {
      if (t.id === selectedTool.id) {
        return {
          ...t,
          status: "damaged" as const,
          checkedOutBy: undefined,
          checkedOutByName: undefined,
          checkedOutAt: undefined
        };
      }
      return t;
    });

    setTools(updatedTools);
    saveToStorage(STORAGE_KEYS.TOOLS, updatedTools);

    const transactions = getFromStorage<ToolTransaction>(STORAGE_KEYS.TOOL_TRANSACTIONS);
    transactions.push({
      id: generateId(),
      toolId: selectedTool.id,
      toolName: `${selectedTool.name} (${selectedTool.code})`,
      type: "damage",
      workerName: user?.name || "",
      workerId: user?.id || "",
      date: new Date().toISOString(),
      notes: notes || "Tool marked as damaged"
    });
    saveToStorage(STORAGE_KEYS.TOOL_TRANSACTIONS, transactions);

    setNotes("");
    setSelectedTool(null);
    setDamageDialogOpen(false);
  };

  const canManage = hasPermission(user, "manage_tools");

  return (
    <>
      <SEO
        title="Tools & Equipment - Josm Electrical"
        description="Manage tools and equipment checkout system"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tools & Equipment</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track tool checkout, returns, and maintenance
              </p>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tool
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Tool</DialogTitle>
                    <DialogDescription>Add a new tool to inventory</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="toolName">Tool Name *</Label>
                      <Input
                        id="toolName"
                        placeholder="e.g., Cordless drill emtop"
                        value={newTool.name}
                        onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toolCode">Code/Number *</Label>
                      <Input
                        id="toolCode"
                        placeholder="e.g., 1, 2, m1, x1"
                        value={newTool.code}
                        onChange={(e) => setNewTool({ ...newTool, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toolCategory">Category *</Label>
                      <Input
                        id="toolCategory"
                        placeholder="e.g., Drills, Spanners, Grinders"
                        value={newTool.category}
                        onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddTool} className="w-full">
                      Add Tool
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Tools
                </CardTitle>
                <ToolIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{tools.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Available
                </CardTitle>
                <Wrench className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{availableCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Checked Out
                </CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{checkedOutCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Damaged
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{damagedCount}</div>
              </CardContent>
            </Card>
          </div>

          {damagedCount > 0 && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-300">
                <strong>{damagedCount} tools</strong> are marked as damaged and need attention
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tools List</CardTitle>
              <CardDescription>
                {filteredTools.length} tools found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Checked Out By</TableHead>
                      <TableHead>Checked Out At</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-slate-500">
                          No tools found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTools.map((tool) => (
                        <TableRow key={tool.id} className={tool.status === "checked_out" ? "bg-blue-50 dark:bg-blue-950/20" : ""}>
                          <TableCell className="font-medium">{tool.name}</TableCell>
                          <TableCell>{tool.code}</TableCell>
                          <TableCell>{tool.category}</TableCell>
                          <TableCell>
                            {tool.status === "available" ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
                            ) : tool.status === "checked_out" ? (
                              <Badge className="bg-blue-500 hover:bg-blue-600">Checked Out</Badge>
                            ) : (
                              <Badge variant="destructive">Damaged</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {tool.checkedOutByName ? (
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {tool.checkedOutByName}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            {tool.checkedOutAt ? new Date(tool.checkedOutAt).toLocaleString() : "-"}
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {tool.status === "available" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTool(tool);
                                      setCheckoutDialogOpen(true);
                                    }}
                                  >
                                    Checkout
                                  </Button>
                                )}
                                {tool.status === "checked_out" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTool(tool);
                                        setReturnDialogOpen(true);
                                      }}
                                    >
                                      Return
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedTool(tool);
                                        setDamageDialogOpen(true);
                                      }}
                                    >
                                      Damage
                                    </Button>
                                  </>
                                )}
                                {tool.status === "damaged" && (
                                  <Badge variant="outline" className="text-red-600 border-red-600">
                                    Needs Repair
                                  </Badge>
                                )}
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

          <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Checkout Tool</DialogTitle>
                <DialogDescription>
                  {selectedTool?.name} ({selectedTool?.code})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workerName">Worker Name *</Label>
                  <Input
                    id="workerName"
                    placeholder="Enter worker name"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkoutNotes">Notes (Optional)</Label>
                  <Textarea
                    id="checkoutNotes"
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleCheckout} className="w-full">
                  Checkout Tool
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Return Tool</DialogTitle>
                <DialogDescription>
                  {selectedTool?.name} ({selectedTool?.code}) - Currently with {selectedTool?.checkedOutByName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="returnNotes">Notes (Optional)</Label>
                  <Textarea
                    id="returnNotes"
                    placeholder="Condition, issues, etc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleReturn} className="w-full">
                  Return Tool
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={damageDialogOpen} onOpenChange={setDamageDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Tool as Damaged</DialogTitle>
                <DialogDescription>
                  {selectedTool?.name} ({selectedTool?.code})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-300">
                    This tool will be marked as damaged and unavailable for checkout
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="damageNotes">Damage Description *</Label>
                  <Textarea
                    id="damageNotes"
                    placeholder="Describe the damage..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleMarkDamaged} variant="destructive" className="w-full">
                  Mark as Damaged
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
}