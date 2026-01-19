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
  Filter,
  MoreVertical,
  CheckCircle,
  PlayCircle,
  Clock,
  Printer
} from "lucide-react";
import { JobCard } from "@/types";
import { hasPermission } from "@/lib/mockAuth";
import { jobService } from "@/services/jobService";
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

export default function JobsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    jobName: "",
    clientName: "",
    boardType: "Dinrail" as "Dinrail" | "Hynman",
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

  const handleCreateJob = async () => {
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
        boardType: newJob.boardType.toLowerCase() as "dinrail" | "hynman",
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
        boardType: "Dinrail",
        priority: "Normal",
        notes: ""
      });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Failed to create job");
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
    } catch (error) {
      console.error("Failed to update job status:", error);
      alert("Failed to update job status");
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Job Cards</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track production jobs and status
              </p>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Job Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Job Card</DialogTitle>
                    <DialogDescription>Start a new manufacturing job</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobName">Job Name *</Label>
                      <Input
                        id="jobName"
                        placeholder="e.g., Panel Box 20x20"
                        value={newJob.jobName}
                        onChange={(e) => setNewJob({ ...newJob, jobName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        placeholder="e.g., ABC Corp"
                        value={newJob.clientName}
                        onChange={(e) => setNewJob({ ...newJob, clientName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Board Type</Label>
                        <Select
                          value={newJob.boardType}
                          onValueChange={(v: "Dinrail" | "Hynman") => setNewJob({ ...newJob, boardType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dinrail">Dinrail</SelectItem>
                            <SelectItem value="Hynman">Hynman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={newJob.priority}
                          onValueChange={(v: "Low" | "Normal" | "High") => setNewJob({ ...newJob, priority: v })}
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
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional instructions..."
                        value={newJob.notes}
                        onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleCreateJob} className="w-full">
                      Create Job Card
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

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
                          Client: {job.clientName} • Type: {job.boardType}
                        </CardDescription>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Fabrication Status */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm text-slate-500">Fabrication</h4>
                          {getStatusBadge(job.fabricationStatus)}
                        </div>
                        {canUpdateFabrication && job.fabricationStatus !== "Completed" && (
                          <div className="flex gap-2">
                            {job.fabricationStatus === "Pending" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleUpdateStatus(job.id, "fabrication", "In Progress")}
                              >
                                <PlayCircle className="w-3 h-3 mr-1" /> Start
                              </Button>
                            )}
                            {job.fabricationStatus === "In Progress" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full text-green-600 hover:text-green-700"
                                onClick={() => handleUpdateStatus(job.id, "fabrication", "Completed")}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Complete
                              </Button>
                            )}
                          </div>
                        )}
                        {job.fabricationBy && (
                          <div className="text-xs text-slate-400">
                            By: {job.fabricationByName}
                          </div>
                        )}
                      </div>

                      {/* Assembling Status */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm text-slate-500">Assembling</h4>
                          {getStatusBadge(job.assemblingStatus)}
                        </div>
                        {canUpdateAssembling && 
                         job.fabricationStatus === "Completed" && 
                         job.assemblingStatus !== "Completed" && (
                          <div className="flex gap-2">
                            {job.assemblingStatus === "Pending" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleUpdateStatus(job.id, "assembling", "In Progress")}
                              >
                                <PlayCircle className="w-3 h-3 mr-1" /> Start
                              </Button>
                            )}
                            {job.assemblingStatus === "In Progress" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full text-green-600 hover:text-green-700"
                                onClick={() => handleUpdateStatus(job.id, "assembling", "Completed")}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Complete
                              </Button>
                            )}
                          </div>
                        )}
                        {job.assemblingStatus === "Pending" && job.fabricationStatus !== "Completed" && (
                          <div className="text-xs text-slate-400 italic">
                            Waiting for fabrication...
                          </div>
                        )}
                        {job.assemblingBy && (
                          <div className="text-xs text-slate-400">
                            By: {job.assemblingByName}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}