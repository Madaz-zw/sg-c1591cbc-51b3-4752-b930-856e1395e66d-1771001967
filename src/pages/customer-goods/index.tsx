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
  Package,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { CustomerGoods } from "@/types";
import { hasPermission } from "@/lib/mockAuth";
import { customerGoodsService } from "@/services/customerGoodsService";
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
  const [selectedGoods, setSelectedGoods] = useState<CustomerGoods | null>(null);
  const [loading, setLoading] = useState(true);

  const [newGoods, setNewGoods] = useState({
    customerName: "",
    description: "",
    quantity: 1,
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

    loadGoods();
  }, [isAuthenticated, user, router]);

  const loadGoods = async () => {
    try {
      setLoading(true);
      const data = await customerGoodsService.getAllCustomerGoods();
      setGoods(data);
      setFilteredGoods(data);
    } catch (error) {
      console.error("Failed to load customer goods:", error);
      alert("Failed to load customer goods");
    } finally {
      setLoading(false);
    }
  };

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

  const receivedGoods = goods.filter(g => g.status === "received");
  const processedGoods = goods.filter(g => g.status === "processed");
  const returnedGoods = goods.filter(g => g.status === "returned");

  const handleAddGoods = async () => {
    if (!newGoods.customerName || !newGoods.description) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await customerGoodsService.createCustomerGoods({
        customerName: newGoods.customerName,
        description: newGoods.description,
        quantity: newGoods.quantity,
        receivedBy: user?.id || "",
        receivedByName: user?.name || "",
        status: "received",
        receivedDate: new Date().toISOString(),
        notes: newGoods.notes || undefined
      });

      await loadGoods();
      setNewGoods({
        customerName: "",
        description: "",
        quantity: 1,
        notes: ""
      });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add customer goods:", error);
      alert("Failed to add customer goods");
    }
  };

  const handleUpdateStatus = async (newStatus: "received" | "processed" | "returned") => {
    if (!selectedGoods) return;

    try {
      await customerGoodsService.updateCustomerGoods(selectedGoods.id, {
        status: newStatus
      });

      await loadGoods();
      setSelectedGoods(null);
      setUpdateDialogOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Received</Badge>;
      case "processed":
        return <Badge className="bg-green-500 hover:bg-green-600">Processed</Badge>;
      case "returned":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Returned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canManage = hasPermission(user, "manage_customer_goods");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600 dark:text-slate-400">Loading customer goods...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO
        title="Customer Goods - Josm Electrical"
        description="Track customer goods received and processed"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customer Goods</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track items received from customers
              </p>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer Goods
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Customer Goods</DialogTitle>
                    <DialogDescription>Record new items received from customer</DialogDescription>
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
                        placeholder="Describe the goods..."
                        value={newGoods.description}
                        onChange={(e) => setNewGoods({ ...newGoods, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newGoods.quantity}
                        onChange={(e) => setNewGoods({ ...newGoods, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional notes..."
                        value={newGoods.notes}
                        onChange={(e) => setNewGoods({ ...newGoods, notes: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddGoods} className="w-full">
                      Add Goods
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
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{receivedGoods.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Processed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{processedGoods.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Returned
                </CardTitle>
                <XCircle className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{returnedGoods.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search customer goods..."
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
              <CardTitle>Customer Goods List</CardTitle>
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
                          No customer goods found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGoods.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.customerName}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(item.receivedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">{item.receivedByName}</TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedGoods(item);
                                  setUpdateDialogOpen(true);
                                }}
                              >
                                Update Status
                              </Button>
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
                  {selectedGoods?.customerName} - {selectedGoods?.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleUpdateStatus("received")}
                    className="w-full"
                    variant="outline"
                  >
                    Mark as Received
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("processed")}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Mark as Processed
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("returned")}
                    className="w-full"
                    variant="secondary"
                  >
                    Mark as Returned
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
}