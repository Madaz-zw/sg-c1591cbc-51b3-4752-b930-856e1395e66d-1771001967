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
  Download,
  Upload
} from "lucide-react";
import { Material } from "@/types";
import { getFromStorage, saveToStorage, generateId, STORAGE_KEYS } from "@/lib/storage";
import { initialMaterials } from "@/lib/initialMaterials";
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

export default function MaterialsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState("");

  // New material form
  const [newMaterial, setNewMaterial] = useState({
    category: "",
    name: "",
    variant: "",
    quantity: "",
    minThreshold: "",
    unit: "pcs"
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

    // Initialize materials from storage or use initial data
    let storedMaterials = getFromStorage<Material>(STORAGE_KEYS.MATERIALS);
    
    if (storedMaterials.length === 0) {
      // First time - initialize with your material list
      storedMaterials = initialMaterials.map(m => ({
        ...m,
        id: generateId(),
        lastUpdated: new Date().toISOString()
      }));
      saveToStorage(STORAGE_KEYS.MATERIALS, storedMaterials);
    }
    
    setMaterials(storedMaterials);
    setFilteredMaterials(storedMaterials);
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    let filtered = materials;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.variant && m.variant.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === "low") {
      filtered = filtered.filter(m => m.quantity <= m.minThreshold);
    } else if (stockFilter === "out") {
      filtered = filtered.filter(m => m.quantity === 0);
    }

    setFilteredMaterials(filtered);
  }, [searchTerm, categoryFilter, stockFilter, materials]);

  const categories = Array.from(new Set(materials.map(m => m.category))).sort();
  const lowStockCount = materials.filter(m => m.quantity <= m.minThreshold).length;
  const outOfStockCount = materials.filter(m => m.quantity === 0).length;

  const handleAddMaterial = () => {
    if (!newMaterial.category || !newMaterial.name || !newMaterial.quantity || !newMaterial.minThreshold) {
      alert("Please fill in all required fields");
      return;
    }

    const material: Material = {
      id: generateId(),
      category: newMaterial.category,
      name: newMaterial.name,
      variant: newMaterial.variant || undefined,
      quantity: parseFloat(newMaterial.quantity),
      minThreshold: parseFloat(newMaterial.minThreshold),
      unit: newMaterial.unit,
      lastUpdated: new Date().toISOString()
    };

    const updatedMaterials = [...materials, material];
    setMaterials(updatedMaterials);
    saveToStorage(STORAGE_KEYS.MATERIALS, updatedMaterials);
    
    setNewMaterial({
      category: "",
      name: "",
      variant: "",
      quantity: "",
      minThreshold: "",
      unit: "pcs"
    });
    setAddDialogOpen(false);
  };

  const handleReceiveMaterial = () => {
    if (!selectedMaterial || !receiveQuantity) {
      alert("Please enter a valid quantity");
      return;
    }

    const quantity = parseFloat(receiveQuantity);
    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const updatedMaterials = materials.map(m => {
      if (m.id === selectedMaterial.id) {
        return {
          ...m,
          quantity: m.quantity + quantity,
          lastUpdated: new Date().toISOString()
        };
      }
      return m;
    });

    setMaterials(updatedMaterials);
    saveToStorage(STORAGE_KEYS.MATERIALS, updatedMaterials);

    // Record transaction
    const transactions = getFromStorage(STORAGE_KEYS.MATERIAL_TRANSACTIONS);
    transactions.push({
      id: generateId(),
      materialId: selectedMaterial.id,
      materialName: `${selectedMaterial.category} - ${selectedMaterial.name}${selectedMaterial.variant ? ` (${selectedMaterial.variant})` : ""}`,
      type: "receive",
      quantity: quantity,
      performedBy: user?.id || "",
      performedByName: user?.name || "",
      date: new Date().toISOString(),
      notes: "Stock received"
    });
    saveToStorage(STORAGE_KEYS.MATERIAL_TRANSACTIONS, transactions);

    setReceiveQuantity("");
    setSelectedMaterial(null);
    setReceiveDialogOpen(false);
  };

  const canManage = hasPermission(user, "manage_materials");

  return (
    <>
      <SEO
        title="Materials Management - Josm Electrical"
        description="Manage raw materials inventory for electrical panel board manufacturing"
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Materials Inventory</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track and manage raw materials for panel board manufacturing
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
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Material</DialogTitle>
                    <DialogDescription>Add a new material to inventory</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
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
                      <Label htmlFor="name">Name/Rating *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., 16A"
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant">Variant</Label>
                      <Input
                        id="variant"
                        placeholder="e.g., s.p, d.p, T.p"
                        value={newMaterial.variant}
                        onChange={(e) => setNewMaterial({ ...newMaterial, variant: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Initial Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder="0"
                          value={newMaterial.quantity}
                          onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minThreshold">Min Threshold *</Label>
                        <Input
                          id="minThreshold"
                          type="number"
                          placeholder="5"
                          value={newMaterial.minThreshold}
                          onChange={(e) => setNewMaterial({ ...newMaterial, minThreshold: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={newMaterial.unit} onValueChange={(value) => setNewMaterial({ ...newMaterial, unit: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="rolls">Rolls</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="meters">Meters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddMaterial} className="w-full">
                      Add Material
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Materials
                </CardTitle>
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{materials.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Low Stock
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{lowStockCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Out of Stock
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Categories
                </CardTitle>
                <Filter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{categories.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {lowStockCount > 0 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-300">
                <strong>{lowStockCount} materials</strong> are below minimum threshold and need restocking
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
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

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stock Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Materials Table */}
          <Card>
            <CardHeader>
              <CardTitle>Materials List</CardTitle>
              <CardDescription>
                {filteredMaterials.length} materials found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Min Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 8 : 7} className="text-center py-8 text-slate-500">
                          No materials found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material) => {
                        const isLowStock = material.quantity <= material.minThreshold;
                        const isOutOfStock = material.quantity === 0;
                        
                        return (
                          <TableRow key={material.id}>
                            <TableCell className="font-medium">{material.category}</TableCell>
                            <TableCell>{material.name}</TableCell>
                            <TableCell>{material.variant || "-"}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {material.quantity} {material.unit}
                            </TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-slate-400">
                              {material.minThreshold} {material.unit}
                            </TableCell>
                            <TableCell>
                              {isOutOfStock ? (
                                <Badge variant="destructive">Out of Stock</Badge>
                              ) : isLowStock ? (
                                <Badge className="bg-orange-500 hover:bg-orange-600">Low Stock</Badge>
                              ) : (
                                <Badge className="bg-green-500 hover:bg-green-600">In Stock</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(material.lastUpdated).toLocaleDateString()}
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
                                  <Upload className="h-3 w-3 mr-1" />
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

          {/* Receive Material Dialog */}
          <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Receive Material</DialogTitle>
                <DialogDescription>
                  Add stock for {selectedMaterial?.category} - {selectedMaterial?.name}
                  {selectedMaterial?.variant && ` (${selectedMaterial.variant})`}
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
                {receiveQuantity && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm text-slate-600 dark:text-slate-400">New Stock:</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {(selectedMaterial?.quantity || 0) + parseFloat(receiveQuantity)} {selectedMaterial?.unit}
                    </p>
                  </div>
                )}
                <Button onClick={handleReceiveMaterial} className="w-full">
                  Receive Material
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
}