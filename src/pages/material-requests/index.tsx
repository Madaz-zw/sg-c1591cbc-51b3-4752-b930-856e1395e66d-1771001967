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
  ClipboardList,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from "lucide-react";
import { Material, MaterialRequest } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";

export default function MaterialRequestsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaterialRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [newRequest, setNewRequest] = useState({
    materialId: "",
    quantity: 1,
    jobCardNumber: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, materialsData] = await Promise.all([
        materialService.getAllRequests(),
        materialService.getAllMaterials()
      ]);
      setRequests(requestsData);
      setFilteredRequests(requestsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = requests;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.jobCardNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Role-based filtering: Workers only see their own requests
    if (user && user.role === "worker") {
      filtered = filtered.filter(r => r.requestedBy === user.id);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, requests, user]);

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const handleAddRequest = async () => {
    if (!newRequest.materialId || !newRequest.jobCardNumber) {
      alert("Please fill in all required fields");
      return;
    }

    const selectedMaterial = materials.find(m => m.id === newRequest.materialId);
    if (!selectedMaterial) return;

    try {
      await materialService.createRequest({
        materialId: newRequest.materialId,
        materialName: selectedMaterial.name,
        quantity: newRequest.quantity,
        requestedBy: user?.id || "",
        requestedByName: user?.name || "",
        jobCardNumber: newRequest.jobCardNumber,
        status: "pending",
        requestDate: new Date().toISOString()
      });

      await loadData();
      setNewRequest({
        materialId: "",
        quantity: 1,
        jobCardNumber: ""
      });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to create request:", error);
      alert("Failed to create request");
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || processing) return;

    try {
      setProcessing(true);
      await materialService.updateRequestStatus(
        selectedRequest.id,
        "approved",
        user?.id || "",
        user?.name || "",
        approvalNotes
      );

      await loadData();
      setApprovalNotes("");
      setSelectedRequest(null);
      setApproveDialogOpen(false);
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert(error instanceof Error ? error.message : "Failed to approve request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || processing) return;

    try {
      setProcessing(true);
      await materialService.updateRequestStatus(
        selectedRequest.id,
        "rejected",
        user?.id || "",
        user?.name || "",
        rejectionNotes
      );

      await loadData();
      setRejectionNotes("");
      setSelectedRequest(null);
      setRejectDialogOpen(false);
    } catch (error) {
      console.error("Failed to reject request:", error);
      alert(error instanceof Error ? error.message : "Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canApprove = hasPermission(user, "approve_requests");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600 dark:text-slate-400">Loading requests...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO
        title="Material Requests - Josm Electrical"
        description="Manage material requests and approvals"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Material Requests</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track and manage material requests from workers
              </p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Material Request</DialogTitle>
                  <DialogDescription>Request materials for a job card</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material *</Label>
                    <Select
                      value={newRequest.materialId}
                      onValueChange={(value) => setNewRequest({ ...newRequest, materialId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.quantity} {material.unit} available)
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
                      min="1"
                      value={newRequest.quantity}
                      onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobCard">Job Card Number *</Label>
                    <Input
                      id="jobCard"
                      placeholder="e.g., JC-001"
                      value={newRequest.jobCardNumber}
                      onChange={(e) => setNewRequest({ ...newRequest, jobCardNumber: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddRequest} className="w-full">
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{pendingRequests.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Approved
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{approvedRequests.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Rejected
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{rejectedRequests.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search requests..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>
                {filteredRequests.length} requests found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Job Card</TableHead>
                      <TableHead>Status</TableHead>
                      {canApprove && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canApprove ? 7 : 6} className="text-center py-8 text-slate-500">
                          No requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(request.requestDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{request.materialName}</TableCell>
                          <TableCell>{request.quantity}</TableCell>
                          <TableCell>{request.requestedByName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.jobCardNumber}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          {canApprove && request.status === "pending" && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600 h-8 px-2"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setApproveDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 px-2"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                          {canApprove && request.status !== "pending" && (
                            <TableCell className="text-right">
                              <span className="text-xs text-slate-500">
                                {request.status === "approved" ? "Approved by" : "Rejected by"} {request.approvedByName}
                              </span>
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

          <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Request</DialogTitle>
                <DialogDescription>
                  Approve {selectedRequest?.quantity} {selectedRequest?.materialName} for {selectedRequest?.jobCardNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="approvalNotes">Notes (Optional)</Label>
                  <Textarea
                    id="approvalNotes"
                    placeholder="Approval notes..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleApprove} className="w-full bg-green-500 hover:bg-green-600" disabled={processing}>
                  Confirm Approval
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Request</DialogTitle>
                <DialogDescription>
                  Reject request for {selectedRequest?.materialName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rejectionNotes">Reason for Rejection *</Label>
                  <Textarea
                    id="rejectionNotes"
                    placeholder="Please explain why..."
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleReject} variant="destructive" className="w-full" disabled={processing}>
                  Confirm Rejection
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
}