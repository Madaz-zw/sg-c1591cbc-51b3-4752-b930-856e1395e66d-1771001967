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
  PackageOpen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Package
} from "lucide-react";
import { CustomerGoods } from "@/types";
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

export default function CustomerGoodsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [goods, setGoods] = useState<CustomerGoods[]>([]);
  const [filteredGoods, setFilteredGoods] = useState<CustomerGoods[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CustomerGoods | null>(null);

  const [newGoods, setNewGoods] = useState({
    customerName: "",
    description: "",
    quantity: "",
    notes: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!hasPermission(user, "view_customer_goods")) {
      router.push("/dashboard");
      return;
    }

    const storedGoods = getFromStorage<CustomerGoods>(STORAGE_KEYS.CUSTOMER_GOODS);
    setGoods(storedGoods);
    setFilteredGoods(storedGoods);
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    let filtered = goods;

    if (searchTerm) {
      filtered = filtered.filter(g =>
        g.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    setFilteredGoods(filtered);
  }, [searchTerm, statusFilter, goods]);

  const receivedCount = goods.filter(g => g.status === "received").length;
  const processedCount = goods.filter(g => g.status === "processed").length;
  const returnedCount = goods.filter(g => g.status === "returned").length;

  const handleAddGoods = () => {
    if (!newGoods.customerName || !newGoods.description || !newGoods.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    const item: CustomerGoods = {
      id: generateId(),
      customerName: newGoods.customerName,
      description: newGoods.description,
      quantity: parseInt(newGoods.quantity),
      receivedDate: new Date().toISOString(),
      receivedBy: user?.id || "",
      receivedByName: user?.name || "",
      status: "received",
      notes: newGoods.notes || undefined
    };

    const updatedGoods = [item, ...goods];
    setGoods(updatedGoods);
    saveToStorage(STORAGE_KEYS.CUSTOMER_GOODS, updatedGoods);
    
    setNewGoods({ customerName: "", description: "", quantity: "", notes: "" });
    setAddDialogOpen(false);
  };

  const handleUpdateStatus = (newStatus: CustomerGoods["status"]) => {
    if (!selectedItem) return;

    const updatedGoods = goods.map(g => {
      if (g.id === selectedItem.id) {
        return { ...g, status: newStatus };
      }
      return g;
    });

    setGoods(updatedGoods);
    saveToStorage(STORAGE_KEYS.CUSTOMER_GOODS, updatedGoods);
    setSelectedItem(null);
    setUpdateDialogOpen(false);
  };

  const canManage = hasPermission(user, "manage_customer_goods");

  return (
    <>
      <SEO
        title="Customer Goods - Josm Electrical"
        description="Track goods received from customers"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customer Goods</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track goods received from customers for processing
              </p>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Goods
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Customer Goods</DialogTitle>
                    <DialogDescription>Log goods received from customer</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        placeholder="Enter customer name"
                        value={newGoods.customerName}
                        onChange={(e) => setNewGoods({ ...newGoods, customerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the goods received"
                        value={newGoods.description}
                        onChange={(e) => setNewGoods({ ...newGoods, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="Number of items"
                        value={newGoods.quantity}
                        onChange={(e) => setNewGoods({ ...newGoods, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional information..."
                        value={newGoods.notes}
                        onChange={(e) => setNewGoods({ ...newGoods, notes: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddGoods} className="w-full">
                      Record Goods
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
                  Received
                </CardTitle>
                <PackageOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{receivedCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Processed
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{processedCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Returned
                </CardTitle>
                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{returnedCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search customer, description..."
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
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Goods Log</CardTitle>
              <CardDescription>
                {filteredGoods.length} items found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Received By</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGoods.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-slate-500">
                          No customer goods recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGoods.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.customerName}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {item.status === "received" ? (
                              <Badge className="bg-blue-500 hover:bg-blue-600">Received</Badge>
                            ) : item.status === "processed" ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Processed</Badge>
                            ) : (
                              <Badge className="bg-purple-500 hover:bg-purple-600">Returned</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(item.receivedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">{item.receivedByName}</TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              {item.status === "received" && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setUpdateDialogOpen(true);
                                    }}
                                  >
                                    Update Status
                                  </Button>
                                </div>
                              )}
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

          <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Status</DialogTitle>
                <DialogDescription>
                  {selectedItem?.customerName} - {selectedItem?.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                    <Badge>{selectedItem?.status}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Update To:</Label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateStatus("processed")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Mark as Processed
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus("returned")}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Mark as Returned
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
}