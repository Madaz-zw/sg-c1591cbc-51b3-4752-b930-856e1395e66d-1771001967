import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  PlayCircle,
  Clock,
  Printer,
  Edit,
  Package,
  Camera,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { JobCard } from "@/types";
import { hasPermission } from "@/lib/mockAuth";
import { jobService } from "@/services/jobService";
import { storageService } from "@/services/storageService";
import { materialService } from "@/services/materialService";
import { pdfService } from "@/services/pdfService";
import type { Material } from "@/types";

export default function JobsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Feature States
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState(1);
  const [currentStageForMaterial, setCurrentStageForMaterial] = useState<"fabrication" | "assembling">("fabrication");
  
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    jobName: "",
    clientName: "",
    boardType: "Surface Mounted" as "Surface Mounted" | "Mini-Flush" | "Watertight" | "Enclosure",
    priority: "Normal" as "Low" | "Normal" | "High",
    notes: ""
  });

  // Edit Job Form State
  const [editJob, setEditJob] = useState({
    jobName: "",
    clientName: "",
    boardName: "",
    boardColor: "",
    boardType: "Surface Mounted" as "Surface Mounted" | "Mini-Flush" | "Watertight" | "Enclosure",
    recipientName: "",
    priority: "Normal" as "Low" | "Normal" | "High",
    notes: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!hasPermission(user, "view_job_cards")) {
      router.push("/dashboard");
      return;
    }

    loadJobs();
    loadMaterials();
  }, [isAuthenticated, user, router]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getAllJobs();
      setJobs(data);
      setFilteredJobs(data);
    } catch (error) {
      console.error("Failed to load jobs:", error);
      alert("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await materialService.getAllMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Failed to load materials:", error);
    }
  };

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(j =>
        j.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.jobCardNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(j => j.status === statusFilter);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, jobs]);

  const handlePrintJob = async (job: JobCard) => {
    // Use the new PDF service for better quality printing/downloading
    try {
      await pdfService.exportJobToPDF(job);
      toast({
        title: "PDF Generated",
        description: "Job card PDF has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportHistory = async () => {
    try {
      setExporting(true);
      await pdfService.exportJobHistoryToPDF(filteredJobs);
      toast({
        title: "History Exported",
        description: "Job history report has been downloaded.",
      });
    } catch (error) {
      console.error("Error exporting history:", error);
      toast({
        title: "Export Failed",
        description: "Could not export job history.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.jobName || !newJob.clientName) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await jobService.createJob({
        jobCardNumber: "",
        jobName: newJob.jobName,
        clientName: newJob.clientName,
        boardName: newJob.jobName,
        boardColor: "",
        boardType: newJob.boardType,
        recipientName: "",
        supervisorName: user?.name || "",
        supervisorId: user?.id || "",
        priority: newJob.priority,
        status: "fabrication",
        fabricationStatus: "Pending",
        assemblingStatus: "Pending",
        materialsUsed: [],
        createdBy: user?.id || "",
        createdByName: user?.name || "",
        notes: newJob.notes
      });

      await loadJobs();
      setNewJob({
        jobName: "",
        clientName: "",
        boardType: "Surface Mounted",
        priority: "Normal",
        notes: ""
      });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Failed to create job");
    }
  };

  const handleEditJob = (job: JobCard) => {
    setSelectedJob(job);
    setEditJob({
      jobName: job.jobName,
      clientName: job.clientName,
      boardName: job.boardName,
      boardColor: job.boardColor,
      boardType: job.boardType,
      recipientName: job.recipientName,
      priority: job.priority || "Normal",
      notes: job.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleUpdateJob = async () => {
    if (!selectedJob) return;
    
    if (!editJob.jobName || !editJob.clientName) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await jobService.updateJobDetails(selectedJob.id, {
        jobName: editJob.jobName,
        clientName: editJob.clientName,
        boardName: editJob.boardName,
        boardColor: editJob.boardColor,
        boardType: editJob.boardType,
        recipientName: editJob.recipientName,
        priority: editJob.priority,
        notes: editJob.notes
      });

      await loadJobs();
      setEditDialogOpen(false);
      setSelectedJob(null);
    } catch (error) {
      console.error("Failed to update job:", error);
      alert("Failed to update job");
    }
  };

  const handleUpdateStatus = async (
    id: string,
    type: "fabrication" | "assembling",
    status: "Pending" | "In Progress" | "Completed"
  ) => {
    try {
      await jobService.updateJobStatus(
        id,
        type,
        status,
        user?.id || "",
        user?.name || ""
      );
      await loadJobs();
      
      // Show success message
      if (type === "assembling" && status === "Completed") {
        alert("✅ Job completed successfully! Board has been added to Finished Boards inventory.");
      }
    } catch (error) {
      console.error("Failed to update job status:", error);
      alert("Failed to update job status");
    }
  };

  const handleOpenMaterialDialog = (job: JobCard, stage: "fabrication" | "assembling") => {
    setSelectedJob(job);
    setCurrentStageForMaterial(stage);
    setSelectedMaterialId("");
    setMaterialQuantity(1);
    setMaterialDialogOpen(true);
  };

  const handleAddMaterial = async () => {
    if (!selectedJob || !selectedMaterialId) return;

    try {
      const material = materials.find(m => m.id === selectedMaterialId);
      if (!material) return;

      await jobService.addMaterialsToJob(selectedJob.id, [{
        materialId: material.id,
        materialName: material.name,
        quantity: materialQuantity,
        process: currentStageForMaterial
      }]);

      await loadJobs();
      setMaterialDialogOpen(false);
    } catch (error) {
      console.error("Failed to add material:", error);
      alert("Failed to add material");
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedJob || !event.target.files || event.target.files.length === 0) return;

    try {
      setUploading(true);
      const files = Array.from(event.target.files);
      const uploadPromises = files.map(async (file) => {
        const path = `${selectedJob.jobCardNumber}/${Date.now()}-${file.name}`;
        return storageService.uploadFile(file, "job-photos", path);
      });

      const urls = await Promise.all(uploadPromises);
      await jobService.addPhotosToJob(selectedJob.id, urls);
      await loadJobs();
      
      // Update selected job to show new photos immediately if dialog is open
      const updatedJob = await jobService.getJobById(selectedJob.id);
      if (updatedJob) setSelectedJob(updatedJob);
      
    } catch (error) {
      console.error("Failed to upload photos:", error);
      alert("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "assembling":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Assembling</Badge>;
      case "fabrication":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Fabrication</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProcessStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-500 hover:bg-green-600">✓ Completed</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">⚙ In Progress</Badge>;
      case "Pending":
        return <Badge variant="outline" className="text-slate-500">○ Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canManage = hasPermission(user, "manage_job_cards");
  const canUpdateFabrication = hasPermission(user, "update_fabrication");
  const canUpdateAssembling = hasPermission(user, "update_assembling");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600 dark:text-slate-400">Loading jobs...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO
        title="Job Cards - Josm Electrical"
        description="Manage manufacturing job cards"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Job Cards</h1>
              <Badge variant="outline" className="text-lg py-1 px-3">
                {filteredJobs.length}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportHistory} 
                disabled={exporting || filteredJobs.length === 0}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                Export Report
              </Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Job Card
              </Button>
            </div>
          </div>

          {/* Edit Job Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Job Card</DialogTitle>
                <DialogDescription>
                  Update job details - {selectedJob?.jobCardNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-jobName">Job Name *</Label>
                    <Input
                      id="edit-jobName"
                      placeholder="e.g., Panel Box 20x20"
                      value={editJob.jobName}
                      onChange={(e) => setEditJob({ ...editJob, jobName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-clientName">Client Name *</Label>
                    <Input
                      id="edit-clientName"
                      placeholder="e.g., ABC Corp"
                      value={editJob.clientName}
                      onChange={(e) => setEditJob({ ...editJob, clientName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-boardName">Board Name</Label>
                    <Input
                      id="edit-boardName"
                      placeholder="Board name"
                      value={editJob.boardName}
                      onChange={(e) => setEditJob({ ...editJob, boardName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-boardColor">Board Color</Label>
                    <Input
                      id="edit-boardColor"
                      placeholder="e.g., Grey, Blue"
                      value={editJob.boardColor}
                      onChange={(e) => setEditJob({ ...editJob, boardColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Board Type</Label>
                    <Select
                      value={editJob.boardType}
                      onValueChange={(v: "Surface Mounted" | "Mini-Flush" | "Watertight" | "Enclosure") => 
                        setEditJob({ ...editJob, boardType: v })
                      }
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
                    <Label>Priority</Label>
                    <Select
                      value={editJob.priority}
                      onValueChange={(v: "Low" | "Normal" | "High") => 
                        setEditJob({ ...editJob, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-recipientName">Recipient Name</Label>
                  <Input
                    id="edit-recipientName"
                    placeholder="Who will receive this board"
                    value={editJob.recipientName}
                    onChange={(e) => setEditJob({ ...editJob, recipientName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Additional instructions..."
                    rows={3}
                    value={editJob.notes}
                    onChange={(e) => setEditJob({ ...editJob, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpdateJob} className="flex-1">
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{jobs.filter(j => j.status === "fabrication").length}</div>
                <p className="text-xs text-slate-500">In Fabrication</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{jobs.filter(j => j.status === "assembling").length}</div>
                <p className="text-xs text-slate-500">In Assembly</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{jobs.filter(j => j.status === "completed").length}</div>
                <p className="text-xs text-slate-500">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{jobs.length}</div>
                <p className="text-xs text-slate-500">Total Jobs</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="fabrication">Fabrication</SelectItem>
                    <SelectItem value="assembling">Assembling</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  No jobs found matching your criteria
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden">
                  <div className={`h-2 ${
                    job.priority === "High" ? "bg-red-500" :
                    job.priority === "Normal" ? "bg-blue-500" :
                    "bg-green-500"
                  }`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{job.jobName}</CardTitle>
                          <Badge variant="outline">{job.jobCardNumber}</Badge>
                          {job.priority === "High" && <Badge variant="destructive">High Priority</Badge>}
                        </div>
                        <CardDescription className="mt-1">
                          Client: {job.clientName} • Board: {job.boardType} {job.boardColor}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(job.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintJob(job)}
                          className="h-8 px-2"
                          title="Print Job Card"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {canManage && job.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditJob(job)}
                            className="h-8 px-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Workflow Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-600">Workflow Progress</span>
                        <span className="text-xs text-slate-500">
                          {job.status === "completed" ? "100%" : 
                           job.status === "assembling" ? "75%" :
                           job.fabricationStatus === "Completed" ? "50%" :
                           job.fabricationStatus === "In Progress" ? "25%" : "0%"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            job.status === "completed" ? "bg-green-500 w-full" :
                            job.status === "assembling" ? "bg-purple-500 w-3/4" :
                            job.fabricationStatus === "Completed" ? "bg-blue-500 w-1/2" :
                            job.fabricationStatus === "In Progress" ? "bg-blue-500 w-1/4" :
                            "bg-slate-300 w-0"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Workflow Stages Visualization */}
                    <div className="flex items-center justify-between mb-6 px-2">
                       {/* Stage 1: Fabrication */}
                       <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                            job.fabricationStatus === "Completed" ? "bg-green-100 text-green-700 border-2 border-green-500" :
                            job.fabricationStatus === "In Progress" ? "bg-blue-100 text-blue-700 border-2 border-blue-500 animate-pulse" :
                            "bg-slate-100 text-slate-400 border-2 border-slate-300"
                          }`}>1</div>
                          <span className={`text-xs font-medium ${job.fabricationStatus === "Pending" ? "text-slate-400" : "text-slate-700"}`}>Fabrication</span>
                       </div>
                       
                       {/* Connector */}
                       <div className={`flex-1 h-0.5 mx-2 ${job.fabricationStatus === "Completed" ? "bg-green-500" : "bg-slate-200"}`} />

                       {/* Stage 2: Assembling */}
                       <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                            job.assemblingStatus === "Completed" ? "bg-green-100 text-green-700 border-2 border-green-500" :
                            job.assemblingStatus === "In Progress" ? "bg-purple-100 text-purple-700 border-2 border-purple-500 animate-pulse" :
                            "bg-slate-100 text-slate-400 border-2 border-slate-300"
                          }`}>2</div>
                          <span className={`text-xs font-medium ${job.assemblingStatus === "Pending" ? "text-slate-400" : "text-slate-700"}`}>Assembling</span>
                       </div>

                       {/* Connector */}
                       <div className={`flex-1 h-0.5 mx-2 ${job.status === "completed" ? "bg-green-500" : "bg-slate-200"}`} />

                       {/* Stage 3: Finished */}
                       <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                            job.status === "completed" ? "bg-green-100 text-green-700 border-2 border-green-500" :
                            "bg-slate-100 text-slate-400 border-2 border-slate-300"
                          }`}>3</div>
                          <span className={`text-xs font-medium ${job.status === "completed" ? "text-slate-700" : "text-slate-400"}`}>Finished</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Fabrication Status */}
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <span className="text-blue-500">①</span> Fabrication
                          </h4>
                          {getProcessStatusBadge(job.fabricationStatus || "Pending")}
                        </div>
                        
                        {/* Materials Used List (Fabrication) */}
                        {job.materialsUsed.filter(m => m.process === "fabrication").length > 0 && (
                          <div className="text-xs text-slate-500 space-y-1 mt-2 border-t border-slate-200 pt-2">
                            <span className="font-semibold">Materials:</span>
                            {job.materialsUsed.filter(m => m.process === "fabrication").map((m, i) => (
                              <div key={i} className="flex justify-between">
                                <span>• {m.materialName}</span>
                                <span>x{m.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Material Button */}
                        {job.fabricationStatus === "In Progress" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-7 text-xs text-slate-500 hover:text-blue-600"
                            onClick={() => handleOpenMaterialDialog(job, "fabrication")}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Material
                          </Button>
                        )}

                        {job.fabricationBy && (
                          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 mt-2">
                            👤 {job.fabricationByName}
                          </div>
                        )}
                      </div>

                      {/* Assembling Status */}
                      <div className={`space-y-3 p-4 rounded-lg border ${
                        job.fabricationStatus === "Completed" 
                          ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" 
                          : "bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-700/50 opacity-60"
                      }`}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <span className="text-purple-500">②</span> Assembling
                          </h4>
                          {getProcessStatusBadge(job.assemblingStatus || "Pending")}
                        </div>

                        {/* Materials Used List (Assembling) */}
                        {job.materialsUsed.filter(m => m.process === "assembling").length > 0 && (
                          <div className="text-xs text-slate-500 space-y-1 mt-2 border-t border-slate-200 pt-2">
                            <span className="font-semibold">Materials:</span>
                            {job.materialsUsed.filter(m => m.process === "assembling").map((m, i) => (
                              <div key={i} className="flex justify-between">
                                <span>• {m.materialName}</span>
                                <span>x{m.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Material Button */}
                        {job.assemblingStatus === "In Progress" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-7 text-xs text-slate-500 hover:text-purple-600"
                            onClick={() => handleOpenMaterialDialog(job, "assembling")}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Material
                          </Button>
                        )}

                        {job.assemblingStatus === "Pending" && job.fabricationStatus !== "Completed" && (
                          <div className="text-xs text-slate-400 italic flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Waiting for fabrication to complete...
                          </div>
                        )}
                        {job.assemblingBy && (
                          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 mt-2">
                            👤 {job.assemblingByName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Action - Next Stage Button */}
                    {job.status !== "completed" && (canUpdateFabrication || canUpdateAssembling) && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {job.fabricationStatus === "Pending" && "Ready to start fabrication"}
                              {job.fabricationStatus === "In Progress" && "Fabrication in progress"}
                              {job.fabricationStatus === "Completed" && job.assemblingStatus === "Pending" && "Ready to start assembling"}
                              {job.fabricationStatus === "Completed" && job.assemblingStatus === "In Progress" && "Assembling in progress"}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              {job.fabricationStatus === "Pending" && "Click to begin the fabrication process"}
                              {job.fabricationStatus === "In Progress" && "Mark fabrication as complete when done"}
                              {job.fabricationStatus === "Completed" && job.assemblingStatus === "Pending" && "Click to begin the assembling process"}
                              {job.fabricationStatus === "Completed" && job.assemblingStatus === "In Progress" && "Mark assembling as complete when done"}
                            </p>
                          </div>
                          {job.fabricationStatus === "Pending" && canUpdateFabrication && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                              onClick={() => handleUpdateStatus(job.id, "fabrication", "In Progress")}
                            >
                              Start Fabrication →
                            </Button>
                          )}
                          {job.fabricationStatus === "In Progress" && canUpdateFabrication && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                              onClick={() => handleUpdateStatus(job.id, "fabrication", "Completed")}
                            >
                              Complete Fabrication ✓
                            </Button>
                          )}
                          {job.fabricationStatus === "Completed" && job.assemblingStatus === "Pending" && canUpdateAssembling && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                              onClick={() => handleUpdateStatus(job.id, "assembling", "In Progress")}
                            >
                              Start Assembling →
                            </Button>
                          )}
                          {job.fabricationStatus === "Completed" && job.assemblingStatus === "In Progress" && canUpdateAssembling && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                              onClick={() => handleUpdateStatus(job.id, "assembling", "Completed")}
                            >
                              Complete Assembling ✓
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Completion Message and Photos */}
                    {job.status === "completed" && (
                      <div className="mt-4 space-y-3">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Job Completed - Board added to Finished Boards inventory
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white hover:bg-slate-50 text-slate-600 h-8"
                            onClick={() => {
                              setSelectedJob(job);
                              setPhotoUploadOpen(true);
                            }}
                          >
                            <ImageIcon className="w-3 h-3 mr-2" />
                            {job.photoUrls && job.photoUrls.length > 0 
                              ? `${job.photoUrls.length} Photos` 
                              : "Add Photos"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add Material Dialog */}
          <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Material - {currentStageForMaterial === 'fabrication' ? 'Fabrication' : 'Assembling'}</DialogTitle>
                <DialogDescription>Record materials used in this stage</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Material</Label>
                  <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search material..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.quantity} {m.unit} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={materialQuantity} 
                    onChange={(e) => setMaterialQuantity(parseInt(e.target.value) || 0)} 
                  />
                </div>
                <Button onClick={handleAddMaterial} disabled={!selectedMaterialId} className="w-full">
                  Add Material
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Photo Upload Dialog */}
          <Dialog open={photoUploadOpen} onOpenChange={setPhotoUploadOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Job Photos</DialogTitle>
                <DialogDescription>
                  Photos for {selectedJob?.jobCardNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedJob?.photoUrls?.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border bg-slate-100">
                      <img src={url} alt={`Job photo ${index + 1}`} className="object-cover w-full h-full" />
                    </div>
                  ))}
                  <div className="flex items-center justify-center aspect-video rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors relative">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-500 mt-2">Uploading...</span>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                        <Camera className="h-8 w-8 text-slate-400" />
                        <span className="text-xs text-slate-500 mt-2">Add Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="hidden" 
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                   <Button variant="outline" onClick={() => setPhotoUploadOpen(false)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </DashboardLayout>
    </>
  );
}