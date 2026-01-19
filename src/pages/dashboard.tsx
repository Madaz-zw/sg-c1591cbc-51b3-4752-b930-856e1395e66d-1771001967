import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SEO } from "@/components/SEO";
import {
  Package,
  Wrench,
  ClipboardList,
  Box,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { Material, Tool, JobCard, FinishedBoard, MaterialRequest } from "@/types";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [boards, setFinishedBoards] = useState<FinishedBoard[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MaterialRequest[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Load data from localStorage
    const storedMaterials = localStorage.getItem("josm_materials");
    const storedTools = localStorage.getItem("josm_tools");
    const storedJobs = localStorage.getItem("josm_jobs");
    const storedBoards = localStorage.getItem("josm_boards");
    const storedRequests = localStorage.getItem("josm_material_requests");

    if (storedMaterials) setMaterials(JSON.parse(storedMaterials));
    if (storedTools) setTools(JSON.parse(storedTools));
    if (storedJobs) setJobs(JSON.parse(storedJobs));
    if (storedBoards) setFinishedBoards(JSON.parse(storedBoards));
    if (storedRequests) setPendingRequests(JSON.parse(storedRequests));
  }, [isAuthenticated, router]);

  // Calculate statistics
  const lowStockMaterials = materials.filter(m => m.quantity <= m.minThreshold);
  const checkedOutTools = tools.filter(t => t.status === "checked_out");
  const damagedTools = tools.filter(t => t.status === "damaged");
  const activeJobs = jobs.filter(j => j.status !== "completed");
  const lowStockBoards = boards.filter(b => b.quantity <= b.minThreshold);
  const pendingRequestsCount = pendingRequests.filter(r => r.status === "pending").length;

  const stats = [
    {
      title: "Total Materials",
      value: materials.length,
      icon: Package,
      color: "from-blue-500 to-cyan-500",
      description: `${lowStockMaterials.length} below threshold`,
      alert: lowStockMaterials.length > 0
    },
    {
      title: "Tools in Use",
      value: checkedOutTools.length,
      icon: Wrench,
      color: "from-purple-500 to-pink-500",
      description: `${damagedTools.length} damaged`,
      alert: damagedTools.length > 0
    },
    {
      title: "Active Jobs",
      value: activeJobs.length,
      icon: ClipboardList,
      color: "from-orange-500 to-red-500",
      description: `${jobs.filter(j => j.status === "completed").length} completed`,
      alert: false
    },
    {
      title: "Finished Boards",
      value: boards.reduce((sum, b) => sum + b.quantity, 0),
      icon: Box,
      color: "from-green-500 to-emerald-500",
      description: `${lowStockBoards.length} below threshold`,
      alert: lowStockBoards.length > 0
    }
  ];

  if (user?.role === "store_keeper" || user?.role === "admin") {
    stats.push({
      title: "Pending Requests",
      value: pendingRequestsCount,
      icon: AlertTriangle,
      color: "from-yellow-500 to-amber-500",
      description: "Awaiting approval",
      alert: pendingRequestsCount > 0
    });
  }

  return (
    <>
      <SEO
        title="Dashboard - Josm Electrical Inventory System"
        description="Overview of inventory, tools, jobs, and finished boards"
      />
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome back, {user?.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Here's what's happening with your inventory today
            </p>
          </div>

          {/* Alerts */}
          {(lowStockMaterials.length > 0 || lowStockBoards.length > 0 || damagedTools.length > 0 || pendingRequestsCount > 0) && (
            <div className="space-y-3">
              {lowStockMaterials.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-orange-800 dark:text-orange-300">
                    <strong>{lowStockMaterials.length} materials</strong> are below minimum threshold and need restocking
                  </AlertDescription>
                </Alert>
              )}
              
              {lowStockBoards.length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-300">
                    <strong>{lowStockBoards.length} finished boards</strong> are below minimum threshold
                  </AlertDescription>
                </Alert>
              )}

              {damagedTools.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                    <strong>{damagedTools.length} tools</strong> are marked as damaged and need attention
                  </AlertDescription>
                </Alert>
              )}

              {pendingRequestsCount > 0 && (user?.role === "store_keeper" || user?.role === "admin") && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <strong>{pendingRequestsCount} material requests</strong> are pending your approval
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <p className={`text-xs flex items-center gap-1 ${stat.alert ? "text-orange-600 dark:text-orange-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}>
                    {stat.alert && <AlertTriangle className="h-3 w-3" />}
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Jobs */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Recent Jobs
                </CardTitle>
                <CardDescription>Latest job cards in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {activeJobs.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                    No active jobs at the moment
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeJobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {job.jobCardNumber}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {job.boardName} - {job.boardColor}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === "fabrication" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : job.status === "assembling"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        }`}>
                          {job.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Items */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>Materials below minimum threshold</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockMaterials.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                    All materials are well stocked
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lowStockMaterials.slice(0, 5).map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {material.name}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {material.category} {material.variant && `- ${material.variant}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {material.quantity} {material.unit}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Min: {material.minThreshold}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}