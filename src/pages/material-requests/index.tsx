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
  PackagePlus,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { MaterialRequest, Material } from "@/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MaterialRequestsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [newRequest, setNewRequest] = useState({
    materialId: "",
    quantity: "",
    jobCardNumber: "",
    notes: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const storedRequests = getFromStorage<MaterialRequest>(STORAGE_KEYS.MATERIAL_REQUESTS);
    const storedMaterials = getFromStorage<Material>(STORAGE_KEYS.MATERIALS);
    setRequests(storedRequests);
    setMaterials(storedMaterials);
  }, [isAuthenticated, router]);

  const handleCreateRequest = () => {
    if (!newRequest.materialId || !newRequest.quantity || !newRequest.jobCardNumber) {
      alert("Please fill in all required fields");
      return;
    }

    const material = materials.find(m => m.id === newRequest.materialId);
    if (!material) return;

    const request: MaterialRequest = {
      id: generateId(),
      materialId: newRequest.materialId,
      materialName: `${material.name} ${material.variant ? `(${material.variant})` : ""}`,
      quantity: parseFloat(newRequest.quantity),
      requestedBy: user?.id || "",
      requestedByName: user?.name || "",
      jobCardNumber: newRequest.jobCardNumber,
      status: "pending",
      requestDate: new Date().toISOString(),
      notes: newRequest.notes || undefined
    };

    const updatedRequests = [request, ...requests];
    setRequests(updatedRequests);
    saveToStorage(STORAGE_KEYS.MATERIAL_REQUESTS, updatedRequests);
    
    setNewRequest({ materialId: "", quantity: "", jobCardNumber: "", notes: "" });
    setAddDialogOpen(false);
  };

  const handleApprove = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const material = materials.find(m => m.id === request.materialId);
    if (!material) return;

    if (material.quantity < request.quantity) {
      alert(`Insufficient stock. Available: ${material.quantity} ${material.unit}`);
      return;
    }

    // Update material quantity
    const updatedMaterials = materials.map(m => {
      if (m.id === request.materialId) {
        return { ...m, quantity: m.quantity - request.quantity, lastUpdated: new Date().toISOString() };
      }
      return m;
    });
    setMaterials(updatedMaterials);
    saveToStorage(STORAGE_KEYS.MATERIALS, updatedMaterials);

    // Update request status
    const updatedRequests = requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: "approved" as const,
          approvedBy: user?.id,
          approvedByName: user?.name,
          approvalDate: new Date().toISOString()
        };
      }
      return r;
    });
    setRequests(updatedRequests);
    saveToStorage(STORAGE_KEYS.MATERIAL_REQUESTS, updatedRequests);

    // Record transaction
    const transactions = getFromStorage(STORAGE_KEYS.MATERIAL_TRANSACTIONS);
    transactions.push({
      id: generateId(),
      materialId: request.materialId,
      materialName: request.materialName,
      type: "issue",
      quantity: request.quantity,
      jobCardNumber: request.jobCardNumber,
      performedBy: user?.id || "",
      performedByName: user?.name || "",
      date: new Date().toISOString(),
      notes: `Approved request from ${request.requestedByName}`
    });
    saveToStorage(STORAGE_KEYS.MATERIAL_TRANSACTIONS, transactions);
  };

  const handleReject = (requestId: string) => {
    const updatedRequests = requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: "rejected" as const,
          approvedBy: user?.id,
          approvedByName: user?.name,
          approvalDate: new Date().toISOString()
        };
      }
      return r;
    });
    setRequests(updatedRequests);
    saveToStorage(STORAGE_KEYS.MATERIAL_REQUESTS, updatedRequests);
  };

  const canCreate = hasPermission(user, "request_materials");
  const canApprove = hasPermission(user, "approve_requests");

  const filteredRequests = requests.filter(r =>
    r.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.jobCardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requestedByName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter(r => r.status === "pending");
  const approvedRequests = filteredRequests.filter(r => r.status === "approved");
  const rejectedRequests = filteredRequests.filter(r => r.status === "rejected");

  return (
    <>
      <SEO
        title="Material Requests - Josm Electrical"
        description="Submit and manage material requests"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Material Requests</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Submit and manage material requests for jobs
              </p>
            </div>
            {canCreate && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Material Request</DialogTitle>
                    <DialogDescription>Request materials for a job</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Material *</Label>
                      <Select value={newRequest.materialId} onValueChange={(val) => setNewRequest({ ...newRequest, materialId: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Search/Select Material" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {materials.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} {m.variant && `(${m.variant})`} - {m.quantity} {m.unit} available
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="Amount needed"
                        value={newRequest.quantity}
                        onChange={(e) => setNewRequest({ ...newRequest, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobCard">Job Card Number *</Label>
                      <Input
                        id="jobCard"
                        placeholder="e.g., JC-2024-001"
                        value={newRequest.jobCardNumber}
                        onChange={(e) => setNewRequest({ ...newRequest, jobCardNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional information..."
                        value={newRequest.notes}
                        onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleCreateRequest} className="w-full">
                      Submit Request
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
                  Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingRequests.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Approved
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedRequests.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Rejected
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedRequests.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedRequests.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedRequests.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>Awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Job Card</TableHead>
                          <TableHead>Requested By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Notes</TableHead>
                          {canApprove && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={canApprove ? 7 : 6} className="text-center py-8 text-slate-500">
                              No pending requests
                            </TableCell>
                          </TableRow>
                        ) : (
                          pendingRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.materialName}</TableCell>
                              <TableCell>{request.quantity}</TableCell>
                              <TableCell className="font-mono text-sm">{request.jobCardNumber}</TableCell>
                              <TableCell>{request.requestedByName}</TableCell>
                              <TableCell className="text-sm">{new Date(request.requestDate).toLocaleDateString()}</TableCell>
                              <TableCell className="text-sm max-w-xs truncate">{request.notes || "-"}</TableCell>
                              {canApprove && (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleApprove(request.id)}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleReject(request.id)}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
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
            </TabsContent>

            <TabsContent value="approved">
              <Card>
                <CardHeader>
                  <CardTitle>Approved Requests</CardTitle>
                  <CardDescription>Materials issued</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Job Card</TableHead>
                          <TableHead>Requested By</TableHead>
                          <TableHead>Approved By</TableHead>
                          <TableHead>Approval Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                              No approved requests
                            </TableCell>
                          </TableRow>
                        ) : (
                          approvedRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.materialName}</TableCell>
                              <TableCell>{request.quantity}</TableCell>
                              <TableCell className="font-mono text-sm">{request.jobCardNumber}</TableCell>
                              <TableCell>{request.requestedByName}</TableCell>
                              <TableCell>{request.approvedByName || "-"}</TableCell>
                              <TableCell className="text-sm">
                                {request.approvalDate ? new Date(request.approvalDate).toLocaleDateString() : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rejected">
              <Card>
                <CardHeader>
                  <CardTitle>Rejected Requests</CardTitle>
                  <CardDescription>Requests not approved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Job Card</TableHead>
                          <TableHead>Requested By</TableHead>
                          <TableHead>Rejected By</TableHead>
                          <TableHead>Rejection Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                              No rejected requests
                            </TableCell>
                          </TableRow>
                        ) : (
                          rejectedRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.materialName}</TableCell>
                              <TableCell>{request.quantity}</TableCell>
                              <TableCell className="font-mono text-sm">{request.jobCardNumber}</TableCell>
                              <TableCell>{request.requestedByName}</TableCell>
                              <TableCell>{request.approvedByName || "-"}</TableCell>
                              <TableCell className="text-sm">
                                {request.approvalDate ? new Date(request.approvalDate).toLocaleDateString() : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}