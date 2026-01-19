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
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Hammer,
  User,
  ChevronRight
} from "lucide-react";
import { JobCard, Material, MaterialTransaction } from "@/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JobCardsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  // New Job Form State
  const [newJob, setNewJob] = useState({
    jobCardNumber: "",
    boardName: "",
    boardColor: "",
    boardType: "dinrail",
    recipientName: "",
    supervisorName: "",
    supervisorId: ""
  });

  // Material Addition State
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);
  const [materialToAdd, setMaterialToAdd] = useState({
    materialId: "",
    quantity: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!hasPermission(user, "view_jobs")) {
      router.push("/dashboard");
      return;
    }

    const storedJobs = getFromStorage<JobCard>(STORAGE_KEYS.JOBS);
    const storedMaterials = getFromStorage<Material>(STORAGE_KEYS.MATERIALS);
    setJobs(storedJobs);
    setMaterials(storedMaterials);
    setFilteredJobs(storedJobs);
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(j =>
        j.jobCardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.boardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(j => j.status === statusFilter);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, jobs]);

  const handleCreateJob = () => {
    if (!newJob.jobCardNumber || !newJob.boardName || !newJob.recipientName || !newJob.supervisorName) {
      alert("Please fill in all required fields");
      return;
    }

    // Check if job card number already exists
    if (jobs.some(j => j.jobCardNumber === newJob.jobCardNumber)) {
      alert("Job Card Number already exists");
      return;
    }

    const job: JobCard = {
      id: generateId(),
      jobCardNumber: newJob.jobCardNumber,
      boardName: newJob.boardName,
      boardColor: newJob.boardColor,
      boardType: newJob.boardType as "dinrail" | "hynman",
      recipientName: newJob.recipientName,
      supervisorName: newJob.supervisorName,
      supervisorId: newJob.supervisorId || user?.id || "",
      status: "fabrication",
      materialsUsed: [],
      createdBy: user?.id || "",
      createdByName: user?.name || "",
      createdAt: new Date().toISOString()
    };

    const updatedJobs = [job, ...jobs];
    setJobs(updatedJobs);
    saveToStorage(STORAGE_KEYS.JOBS, updatedJobs);
    
    setNewJob({
      jobCardNumber: "",
      boardName: "",
      boardColor: "",
      boardType: "dinrail",
      recipientName: "",
      supervisorName: "",
      supervisorId: ""
    });
    setAddDialogOpen(false);
  };

  const handleUpdateStatus = (jobId: string, newStatus: JobCard["status"]) => {
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        const updates: Partial<JobCard> = { status: newStatus };
        if (newStatus === "assembling") {
          updates.fabricationCompletedAt = new Date().toISOString();
        } else if (newStatus === "completed") {
          updates.assemblingCompletedAt = new Date().toISOString();
          updates.completedAt = new Date().toISOString();
        }
        return { ...j, ...updates };
      }
      return j;
    });

    setJobs(updatedJobs);
    saveToStorage(STORAGE_KEYS.JOBS, updatedJobs);
  };

  const handleAddMaterialToJob = () => {
    if (!selectedJob || !materialToAdd.materialId || !materialToAdd.quantity) {
      alert("Please select material and quantity");
      return;
    }

    const quantity = parseFloat(materialToAdd.quantity);
    const material = materials.find(m => m.id === materialToAdd.materialId);

    if (!material) return;

    if (material.quantity < quantity) {
      alert(`Insufficient stock. Available: ${material.quantity} ${material.unit}`);
      return;
    }

    // 1. Deduct from inventory
    const updatedMaterials = materials.map(m => {
      if (m.id === material.id) {
        return { ...m, quantity: m.quantity - quantity, lastUpdated: new Date().toISOString() };
      }
      return m;
    });
    setMaterials(updatedMaterials);
    saveToStorage(STORAGE_KEYS.MATERIALS, updatedMaterials);

    // 2. Add to job record
    const updatedJobs = jobs.map(j => {
      if (j.id === selectedJob.id) {
        const newMaterialEntry = {
          materialId: material.id,
          materialName: `${material.name} ${material.variant ? `(${material.variant})` : ""}`,
          quantity: quantity,
          process: j.status === "fabrication" ? "fabrication" as const : "assembling" as const
        };
        return {
          ...j,
          materialsUsed: [...j.materialsUsed, newMaterialEntry]
        };
      }
      return j;
    });
    setJobs(updatedJobs);
    saveToStorage(STORAGE_KEYS.JOBS, updatedJobs);

    // 3. Record transaction
    const transactions = getFromStorage<MaterialTransaction>(STORAGE_KEYS.MATERIAL_TRANSACTIONS);
    transactions.push({
      id: generateId(),
      materialId: material.id,
      materialName: material.name,
      type: "issue",
      quantity: quantity,
      jobCardNumber: selectedJob.jobCardNumber,
      performedBy: user?.id || "",
      performedByName: user?.name || "",
      date: new Date().toISOString(),
      notes: `Used in Job ${selectedJob.jobCardNumber} (${selectedJob.status})`
    });
    saveToStorage(STORAGE_KEYS.MATERIAL_TRANSACTIONS, transactions);

    setMaterialToAdd({ materialId: "", quantity: "" });
    setAddMaterialDialogOpen(false);
  };

  const canCreate = hasPermission(user, "manage_jobs");

  return (
    <>
      <SEO
        title="Job Cards - Josm Electrical"
        description="Track manufacturing jobs and material usage"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Job Cards</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage fabrication and assembling jobs
              </p>
            </div>
            {canCreate && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Job Card
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Job Card</DialogTitle>
                    <DialogDescription>Start a new manufacturing job</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobNumber">Job Card Number *</Label>
                      <Input
                        id="jobNumber"
                        placeholder="e.g., JC-2024-001"
                        value={newJob.jobCardNumber}
                        onChange={(e) => setNewJob({ ...newJob, jobCardNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boardName">Board Name *</Label>
                      <Input
                        id="boardName"
                        placeholder="e.g., Main Distribution Board"
                        value={newJob.boardName}
                        onChange={(e) => setNewJob({ ...newJob, boardName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boardType">Board Type *</Label>
                      <Select value={newJob.boardType} onValueChange={(value) => setNewJob({ ...newJob, boardType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinrail">Dinrail</SelectItem>
                          <SelectItem value="hynman">Hynman</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boardColor">Board Color</Label>
                      <Select value={newJob.boardColor} onValueChange={(value) => setNewJob({ ...newJob, boardColor: value })}>
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
                      <Label htmlFor="recipient">Recipient Name *</Label>
                      <Input
                        id="recipient"
                        placeholder="Client or Project Name"
                        value={newJob.recipientName}
                        onChange={(e) => setNewJob({ ...newJob, recipientName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supervisor">Supervisor Name *</Label>
                      <Input
                        id="supervisor"
                        placeholder="Assign Supervisor"
                        value={newJob.supervisorName}
                        onChange={(e) => setNewJob({ ...newJob, supervisorName: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateJob} className="w-full mt-4">
                    Create Job Card
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search job #, board, client..."
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
                    <SelectItem value="fabrication">Fabrication</SelectItem>
                    <SelectItem value="assembling">Assembling</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Jobs</TabsTrigger>
              <TabsTrigger value="completed">Completed History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {filteredJobs.filter(j => j.status !== "completed").map((job) => (
                <JobCardItem 
                  key={job.id} 
                  job={job} 
                  onAddMaterial={(job) => {
                    setSelectedJob(job);
                    setAddMaterialDialogOpen(true);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                  canManage={canCreate}
                />
              ))}
              {filteredJobs.filter(j => j.status !== "completed").length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No active jobs found
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredJobs.filter(j => j.status === "completed").map((job) => (
                <JobCardItem 
                  key={job.id} 
                  job={job} 
                  onAddMaterial={() => {}} // Disabled for completed
                  onUpdateStatus={handleUpdateStatus}
                  canManage={false} // Read only
                />
              ))}
              {filteredJobs.filter(j => j.status === "completed").length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No completed jobs found
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Add Material Dialog */}
          <Dialog open={addMaterialDialogOpen} onOpenChange={setAddMaterialDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Material to Job</DialogTitle>
                <DialogDescription>
                  {selectedJob?.jobCardNumber} - {selectedJob?.boardName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Phase</p>
                  <Badge variant={selectedJob?.status === "fabrication" ? "secondary" : "default"}>
                    {selectedJob?.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label>Select Material</Label>
                  <Select 
                    value={materialToAdd.materialId} 
                    onValueChange={(val) => setMaterialToAdd({ ...materialToAdd, materialId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Search/Select Material" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} {m.variant && `(${m.variant})`} - {m.quantity} {m.unit} avail
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Amount to use"
                    value={materialToAdd.quantity}
                    onChange={(e) => setMaterialToAdd({ ...materialToAdd, quantity: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddMaterialToJob} className="w-full">
                  Confirm Material Usage
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </DashboardLayout>
    </>
  );
}

// Sub-component for Job Card Item to keep code clean
function JobCardItem({ 
  job, 
  onAddMaterial, 
  onUpdateStatus,
  canManage 
}: { 
  job: JobCard, 
  onAddMaterial: (job: JobCard) => void,
  onUpdateStatus: (id: string, status: JobCard["status"]) => void,
  canManage: boolean
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono">{job.jobCardNumber}</Badge>
              {job.status === "fabrication" && <Badge className="bg-orange-500">Fabrication</Badge>}
              {job.status === "assembling" && <Badge className="bg-blue-500">Assembling</Badge>}
              {job.status === "completed" && <Badge className="bg-green-500">Completed</Badge>}
            </div>
            <CardTitle className="text-lg">{job.boardName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className="capitalize">{job.boardType}</span>
              <span>•</span>
              <span>{job.boardColor}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {job.supervisorName}</span>
            </CardDescription>
          </div>
          
          {canManage && job.status !== "completed" && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onAddMaterial(job)}>
                <Plus className="h-3 w-3 mr-1" /> Material
              </Button>
              {job.status === "fabrication" && (
                <Button size="sm" onClick={() => onUpdateStatus(job.id, "assembling")}>
                  Move to Assembly <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              {job.status === "assembling" && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(job.id, "completed")}>
                  Mark Complete <CheckCircle2 className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500">Recipient</p>
                <p className="font-medium">{job.recipientName}</p>
              </div>
              <div>
                <p className="text-slate-500">Created Date</p>
                <p className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Materials Used ({job.materialsUsed.length})</p>
            {job.materialsUsed.length > 0 ? (
              <div className="space-y-1">
                {job.materialsUsed.slice(0, 3).map((m, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-700 dark:text-slate-300">{m.materialName}</span>
                    <span className="font-mono text-slate-500">{m.quantity} <span className="text-xs uppercase opacity-70">units</span></span>
                  </div>
                ))}
                {job.materialsUsed.length > 3 && (
                  <p className="text-xs text-center text-slate-500 pt-1">
                    + {job.materialsUsed.length - 3} more items
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No materials recorded yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}