import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import {
  Package,
  Wrench,
  ClipboardList,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Box,
  Users,
  PackagePlus,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Material, Tool, Job, Board, MaterialRequest } from "@/types";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { hasPermission } from "@/lib/mockAuth";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMaterials: 0,
    lowStockMaterials: 0,
    totalTools: 0,
    toolsInUse: 0,
    activeJobs: 0,
    totalBoards: 0,
    lowStockBoards: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const materials = getFromStorage<Material>(STORAGE_KEYS.MATERIALS);
    const tools = getFromStorage<Tool>(STORAGE_KEYS.TOOLS);
    const jobs = getFromStorage<Job>(STORAGE_KEYS.JOBS);
    const boards = getFromStorage<Board>(STORAGE_KEYS.BOARDS);
    const requests = getFromStorage<MaterialRequest>(STORAGE_KEYS.MATERIAL_REQUESTS);

    const lowStockMaterials = materials.filter(m => m.quantity <= m.minThreshold);
    const toolsInUse = tools.filter(t => t.status === "checked_out" && !t.isDamaged);
    const activeJobs = jobs.filter(j => j.status !== "completed");
    const lowStockBoards = boards.filter(b => b.quantity <= b.minThreshold);
    const pendingRequests = requests.filter(r => r.status === "pending");

    setStats({
      totalMaterials: materials.length,
      lowStockMaterials: lowStockMaterials.length,
      totalTools: tools.length,
      toolsInUse: toolsInUse.length,
      activeJobs: activeJobs.length,
      totalBoards: boards.reduce((acc, b) => acc + b.quantity, 0),
      lowStockBoards: lowStockBoards.length,
      pendingRequests: pendingRequests.length
    });
  }, [isAuthenticated, router]);

  const canViewMaterials = hasPermission(user, "view_materials");
  const canViewTools = hasPermission(user, "view_tools");
  const canViewJobs = hasPermission(user, "view_jobs");
  const canViewBoards = hasPermission(user, "view_boards");
  const canApproveRequests = hasPermission(user, "approve_requests");

  return (
    <>
      <SEO
        title="Dashboard - Josm Electrical"
        description="Inventory and job management dashboard"
      />
      <DashboardLayout>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 text-lg">
              {user?.role === "admin" && "Full system access - Manage everything"}
              {user?.role === "store_keeper" && "Manage inventory and process requests"}
              {user?.role === "supervisor" && "Oversee jobs and track progress"}
              {user?.role === "worker" && "View jobs and request materials"}
              {user?.role === "sales_warehouse" && "Manage finished goods and customer items"}
            </p>
          </div>

          {/* Alerts Section */}
          {(stats.lowStockMaterials > 0 || stats.lowStockBoards > 0 || stats.pendingRequests > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.lowStockMaterials > 0 && canViewMaterials && (
                <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Low Stock Materials</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.lowStockMaterials}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.lowStockBoards > 0 && canViewBoards && (
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Low Stock Boards</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.lowStockBoards}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.pendingRequests > 0 && canApproveRequests && (
                <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <PackagePlus className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending Requests</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendingRequests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {canViewMaterials && (
              <Link href="/materials">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Materials
                    </CardTitle>
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalMaterials}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Track raw materials
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}

            {canViewTools && (
              <Link href="/tools">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Tools
                    </CardTitle>
                    <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalTools}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {stats.toolsInUse} currently in use
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}

            {canViewJobs && (
              <Link href="/jobs">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Active Jobs
                    </CardTitle>
                    <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeJobs}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      In progress
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}

            {canViewBoards && (
              <Link href="/boards">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Finished Boards
                    </CardTitle>
                    <Box className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalBoards}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ready for delivery
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {hasPermission(user, "add_materials") && (
                  <Link href="/materials">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Package className="h-6 w-6" />
                      <span>Add Materials</span>
                    </Button>
                  </Link>
                )}
                
                {hasPermission(user, "request_materials") && (
                  <Link href="/material-requests">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <PackagePlus className="h-6 w-6" />
                      <span>Request Materials</span>
                    </Button>
                  </Link>
                )}

                {hasPermission(user, "create_jobs") && (
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <ClipboardList className="h-6 w-6" />
                      <span>Create Job Card</span>
                    </Button>
                  </Link>
                )}

                {hasPermission(user, "view_reports") && (
                  <Link href="/reports">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <TrendingUp className="h-6 w-6" />
                      <span>View Reports</span>
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}