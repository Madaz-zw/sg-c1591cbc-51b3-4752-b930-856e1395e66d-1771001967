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
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Filter,
  Download
} from "lucide-react";
import { Material } from "@/types";
import { hasPermission } from "@/lib/mockAuth";
import { materialService } from "@/services/materialService";
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

export default function MaterialsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState("");
  const [loading, setLoading] = useState(true);

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    category: "",
    variant: "",
    quantity: "",
    unit: "pcs",
    minThreshold: "10"
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!hasPermission(user, "view_materials")) {
      router.push("/dashboard");
      return;
    }

    loadMaterials();
  }, [isAuthenticated, user, router]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialService.getAllMaterials();
      setMaterials(data);
      setFilteredMaterials(data);
    } catch (error) {
      console.error("Failed to load materials:", error);
      alert("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = materials;

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.variant && m.variant.toLowerCase().includes(searchTerm.toLowerCase())) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    setFilteredMaterials(filtered);
  }, [searchTerm, categoryFilter, materials]);

  const categories = Array.from(new Set(materials.map(m => m.category)));
  const totalItems = materials.reduce((sum, m) => sum + m.quantity, 0);
  const lowStockItems = materials.filter(m => m.quantity <= m.minThreshold);

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.category || !newMaterial.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await materialService.createMaterial({
        name: newMaterial.name,
        category: newMaterial.category,
        variant: newMaterial.variant || undefined,
        quantity: parseInt(newMaterial.quantity),
        unit: newMaterial.unit,
        minThreshold: parseInt(newMaterial.minThreshold)
      });

      await loadMaterials();
      setNewMaterial({ name: "", category: "", variant: "", quantity: "", unit: "pcs", minThreshold: "10" });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add material:", error);
      alert("Failed to add material");
    }
  };

  const handleReceiveMaterial = async () => {
    if (!selectedMaterial || !receiveQuantity) return;

    const quantity = parseInt(receiveQuantity);

    try {
      await materialService.receiveMaterial(
        selectedMaterial.id,
        quantity,
        user?.id || "",
        user?.name || ""
      );

      await loadMaterials();
      setReceiveQuantity("");
      setSelectedMaterial(null);
      setReceiveDialogOpen(false);
    } catch (error) {
      console.error("Failed to receive material:", error);
      alert("Failed to receive material");
    }
  };

  const canManage = hasPermission(user, "manage_materials");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600 dark:text-slate-400">Loading materials...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO
        title="Materials Inventory - Josm Electrical"
        description="Manage raw materials and inventory"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Materials Inventory</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track raw materials and components
              </p>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Material</DialogTitle>
                    <DialogDescription>Add a new material to inventory</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Material Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., MCB Breaker"
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        placeholder="e.g., CHINT MCB"
                        value={newMaterial.category}
                        onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant">Variant</Label>
                      <Input
                        id="variant"
                        placeholder="e.g., 6A s.p"
                        value={newMaterial.variant}
                        onChange={(e) => setNewMaterial({ ...newMaterial, variant: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder="0"
                          value={newMaterial.quantity}
                          onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Select value={newMaterial.unit} onValueChange={(value) => setNewMaterial({ ...newMaterial, unit: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcs">Pieces</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="ltr">Liters</SelectItem>
                            <SelectItem value="mtr">Meters</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Minimum Threshold *</Label>
                      <Input
                        id="threshold"
                        type="number"
                        placeholder="10"
                        value={newMaterial.minThreshold}
                        onChange={(e) => setNewMaterial({ ...newMaterial, minThreshold: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddMaterial} className="w-full">
                      Add Material
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
                  Total Items in Stock
                </CardTitle>
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalItems}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Material Types
                </CardTitle>
                <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{materials.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Low Stock Items
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{lowStockItems.length}</div>
              </CardContent>
            </Card>
          </div>

          {lowStockItems.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-300">
                <strong>{lowStockItems.length} materials</strong> are below minimum threshold and need restocking
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
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
              <CardTitle>Material List</CardTitle>
              <CardDescription>
                {filteredMaterials.length} items found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Min Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-slate-500">
                          No materials found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material) => {
                        const isLowStock = material.quantity <= material.minThreshold;
                        
                        return (
                          <TableRow key={material.id}>
                            <TableCell className="font-medium">{material.name}</TableCell>
                            <TableCell>{material.category}</TableCell>
                            <TableCell>{material.variant || "-"}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {material.quantity} {material.unit}
                            </TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-slate-400">
                              {material.minThreshold} {material.unit}
                            </TableCell>
                            <TableCell>
                              {material.quantity === 0 ? (
                                <Badge variant="destructive">Out of Stock</Badge>
                              ) : isLowStock ? (
                                <Badge className="bg-orange-500 hover:bg-orange-600">Low Stock</Badge>
                              ) : (
                                <Badge className="bg-green-500 hover:bg-green-600">In Stock</Badge>
                              )}
                            </TableCell>
                            {canManage && (
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedMaterial(material);
                                    setReceiveDialogOpen(true);
                                  }}
                                >
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Receive
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

          <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Receive Material</DialogTitle>
                <DialogDescription>
                  {selectedMaterial?.name} {selectedMaterial?.variant && `(${selectedMaterial.variant})`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Stock</Label>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedMaterial?.quantity} {selectedMaterial?.unit}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiveQty">Quantity to Receive *</Label>
                  <Input
                    id="receiveQty"
                    type="number"
                    placeholder="Enter quantity"
                    value={receiveQuantity}
                    onChange={(e) => setReceiveQuantity(e.target.value)}
                  />
                </div>
                <Button onClick={handleReceiveMaterial} className="w-full">
                  Confirm Receipt
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
}