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
  Wrench,
  Plus,
  Search,
  LogOut,
  LogIn,
  AlertTriangle,
  Filter
} from "lucide-react";
import { Tool } from "@/types";
import { hasPermission } from "@/lib/mockAuth";
import { toolService } from "@/services/toolService";
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
  const [checkoutName, setCheckoutName] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [loading, setLoading] = useState(true);

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

    loadTools();
  }, [isAuthenticated, user, router]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await toolService.getAllTools();
      setTools(data);
      setFilteredTools(data);
    } catch (error) {
      console.error("Failed to load tools:", error);
      alert("Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tools;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.code && t.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
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

  const categories = Array.from(new Set(tools.map(t => t.category)));
  const availableTools = tools.filter(t => t.status === "available");
  const checkedOutTools = tools.filter(t => t.status === "checked_out");
  const damagedTools = tools.filter(t => t.isDamaged);

  const handleAddTool = async () => {
    if (!newTool.name || !newTool.category) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await toolService.createTool({
        name: newTool.name,
        code: newTool.code || undefined,
        category: newTool.category,
        status: "available",
        isDamaged: false
      });

      await loadTools();
      setNewTool({ name: "", code: "", category: "" });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add tool:", error);
      alert("Failed to add tool");
    }
  };

  const handleCheckout = async () => {
    if (!selectedTool || !checkoutName.trim()) {
      alert("Please enter worker name");
      return;
    }

    try {
      await toolService.checkoutTool(
        selectedTool.id,
        checkoutName.trim(),
        user?.id || "",
        user?.name || ""
      );

      await loadTools();
      setCheckoutName("");
      setSelectedTool(null);
      setCheckoutDialogOpen(false);
    } catch (error) {
      console.error("Failed to checkout tool:", error);
      alert("Failed to checkout tool");
    }
  };

  const handleReturn = async () => {
    if (!selectedTool) return;

    try {
      await toolService.returnTool(
        selectedTool.id,
        user?.id || "",
        user?.name || "",
        returnNotes
      );

      await loadTools();
      setReturnNotes("");
      setSelectedTool(null);
      setReturnDialogOpen(false);
    } catch (error) {
      console.error("Failed to return tool:", error);
      alert("Failed to return tool");
    }
  };

  const handleMarkDamaged = async () => {
    if (!selectedTool) return;

    try {
      await toolService.markAsDamaged(
        selectedTool.id,
        user?.id || "",
        user?.name || "",
        damageNotes
      );

      await loadTools();
      setDamageNotes("");
      setSelectedTool(null);
      setDamageDialogOpen(false);
    } catch (error) {
      console.error("Failed to mark tool as damaged:", error);
      alert("Failed to mark tool as damaged");
    }
  };

  const canManage = hasPermission(user, "manage_tools");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600 dark:text-slate-400">Loading tools...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO
        title="Tools & Equipment - Josm Electrical"
        description="Manage tools and equipment inventory"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tools & Equipment</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track tool checkouts and returns
              </p>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
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
                      <Label htmlFor="name">Tool Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Cordless drill emtop"
                        value={newTool.name}
                        onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Code/Number</Label>
                      <Input
                        id="code"
                        placeholder="e.g., 1, 2, M1"
                        value={newTool.code}
                        onChange={(e) => setNewTool({ ...newTool, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        placeholder="e.g., Drills, Spanners, Hammers"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Available Tools
                </CardTitle>
                <Wrench className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{availableTools.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Checked Out
                </CardTitle>
                <LogOut className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{checkedOutTools.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Damaged Tools
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{damagedTools.length}</div>
              </CardContent>
            </Card>
          </div>

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
              <CardTitle>Tool List</CardTitle>
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
                      <TableHead>Checked Out To</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 6 : 5} className="text-center py-8 text-slate-500">
                          No tools found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTools.map((tool) => (
                        <TableRow key={tool.id} className={tool.isDamaged ? "bg-red-50 dark:bg-red-950/20" : ""}>
                          <TableCell className="font-medium">
                            {tool.name}
                            {tool.isDamaged && (
                              <Badge variant="destructive" className="ml-2">Damaged</Badge>
                            )}
                          </TableCell>
                          <TableCell>{tool.code || "-"}</TableCell>
                          <TableCell>{tool.category}</TableCell>
                          <TableCell>
                            {tool.status === "available" ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
                            ) : tool.status === "checked_out" ? (
                              <Badge className="bg-orange-500 hover:bg-orange-600">Checked Out</Badge>
                            ) : (
                              <Badge variant="destructive">Damaged</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {tool.checkedOutTo ? (
                              <span className="font-semibold text-orange-600 dark:text-orange-400">
                                {tool.checkedOutTo}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {tool.status === "available" && !tool.isDamaged && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTool(tool);
                                      setCheckoutDialogOpen(true);
                                    }}
                                  >
                                    <LogOut className="h-3 w-3 mr-1" />
                                    Checkout
                                  </Button>
                                )}
                                {tool.status === "checked_out" && !tool.isDamaged && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTool(tool);
                                        setReturnDialogOpen(true);
                                      }}
                                    >
                                      <LogIn className="h-3 w-3 mr-1" />
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
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Damaged
                                    </Button>
                                  </>
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
                  {selectedTool?.name} {selectedTool?.code && `(${selectedTool.code})`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workerName">Worker Name *</Label>
                  <Input
                    id="workerName"
                    placeholder="Enter worker name"
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCheckout} className="w-full">
                  Confirm Checkout
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Return Tool</DialogTitle>
                <DialogDescription>
                  {selectedTool?.name} {selectedTool?.code && `(${selectedTool.code})`}
                  <br />
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">
                    Checked out to: {selectedTool?.checkedOutTo}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="returnNotes">Notes (Optional)</Label>
                  <Textarea
                    id="returnNotes"
                    placeholder="Any notes about the tool condition..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleReturn} className="w-full">
                  Confirm Return
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={damageDialogOpen} onOpenChange={setDamageDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Tool as Damaged</DialogTitle>
                <DialogDescription>
                  {selectedTool?.name} {selectedTool?.code && `(${selectedTool.code})`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="damageNotes">Damage Description *</Label>
                  <Textarea
                    id="damageNotes"
                    placeholder="Describe the damage..."
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
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