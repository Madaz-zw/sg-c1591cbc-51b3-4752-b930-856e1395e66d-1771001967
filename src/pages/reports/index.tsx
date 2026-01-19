import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import {
  FileText,
  Download,
  Calendar,
  Package,
  Wrench,
  ClipboardList,
  Box,
  Users
} from "lucide-react";
import { 
  Material, 
  Tool, 
  JobCard, 
  Board, 
  CustomerGoods,
  MaterialTransaction,
  ToolTransaction,
  BoardTransaction
} from "@/types";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { hasPermission } from "@/lib/mockAuth";
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

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [customerGoods, setCustomerGoods] = useState<CustomerGoods[]>([]);
  const [materialTransactions, setMaterialTransactions] = useState<MaterialTransaction[]>([]);
  const [toolTransactions, setToolTransactions] = useState<ToolTransaction[]>([]);
  const [boardTransactions, setBoardTransactions] = useState<BoardTransaction[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!hasPermission(user, "view_reports")) {
      router.push("/dashboard");
      return;
    }

    // Load all data
    setMaterials(getFromStorage<Material>(STORAGE_KEYS.MATERIALS));
    setTools(getFromStorage<Tool>(STORAGE_KEYS.TOOLS));
    setJobs(getFromStorage<JobCard>(STORAGE_KEYS.JOBS));
    setBoards(getFromStorage<Board>(STORAGE_KEYS.BOARDS));
    setCustomerGoods(getFromStorage<CustomerGoods>(STORAGE_KEYS.CUSTOMER_GOODS));
    setMaterialTransactions(getFromStorage<MaterialTransaction>(STORAGE_KEYS.MATERIAL_TRANSACTIONS));
    setToolTransactions(getFromStorage<ToolTransaction>(STORAGE_KEYS.TOOL_TRANSACTIONS));
    setBoardTransactions(getFromStorage<BoardTransaction>(STORAGE_KEYS.BOARD_TRANSACTIONS));
  }, [isAuthenticated, user, router]);

  const filterByDate = <T extends { date?: string; createdAt?: string; receivedDate?: string }>(items: T[]) => {
    if (!startDate && !endDate) return items;
    
    return items.filter(item => {
      const itemDate = item.date || item.createdAt || item.receivedDate;
      if (!itemDate) return true;
      
      const date = new Date(itemDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === "string" && val.includes(",") ? `"${val}"` : val
      ).join(",")
    );
    
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const lowStockMaterials = materials.filter(m => m.quantity <= m.minThreshold);
  const damagedTools = tools.filter(t => t.status === "damaged");
  const activeJobs = jobs.filter(j => j.status !== "completed");
  const lowStockBoards = boards.filter(b => b.quantity <= b.minThreshold);

  const filteredMaterialTransactions = filterByDate(materialTransactions);
  const filteredToolTransactions = filterByDate(toolTransactions);
  const filteredBoardTransactions = filterByDate(boardTransactions);
  const filteredJobs = filterByDate(jobs);
  const filteredCustomerGoods = filterByDate(customerGoods);

  return (
    <>
      <SEO
        title="Reports - Josm Electrical"
        description="View and export comprehensive reports"
      />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Comprehensive reports with export capabilities
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Range Filter
              </CardTitle>
              <CardDescription>Filter reports by custom date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="jobs">Job Cards</TabsTrigger>
              <TabsTrigger value="boards">Boards</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Material Reports</CardTitle>
                      <CardDescription>Inventory and transaction history</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV(materials, "materials_inventory")}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Inventory
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Low Stock Alert ({lowStockMaterials.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Current</TableHead>
                            <TableHead>Min Threshold</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lowStockMaterials.map(m => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">
                                {m.name} {m.variant && `(${m.variant})`}
                              </TableCell>
                              <TableCell>{m.category}</TableCell>
                              <TableCell className="font-bold text-orange-600">
                                {m.quantity} {m.unit}
                              </TableCell>
                              <TableCell>{m.minThreshold} {m.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        Material Transactions ({filteredMaterialTransactions.length})
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportToCSV(filteredMaterialTransactions, "material_transactions")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Job Card</TableHead>
                            <TableHead>Performed By</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMaterialTransactions.slice(0, 10).map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">
                                {new Date(t.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{t.materialName}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  t.type === "issue" ? "bg-red-100 text-red-700" :
                                  t.type === "receive" ? "bg-green-100 text-green-700" :
                                  "bg-blue-100 text-blue-700"
                                }`}>
                                  {t.type}
                                </span>
                              </TableCell>
                              <TableCell>{t.quantity}</TableCell>
                              <TableCell>{t.jobCardNumber || "-"}</TableCell>
                              <TableCell className="text-sm">{t.userName}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Tool Reports</CardTitle>
                      <CardDescription>Tool usage and maintenance</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV(tools, "tools_inventory")}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Tools
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Damaged Tools ({damagedTools.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tool Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {damagedTools.map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium">{t.name}</TableCell>
                              <TableCell>{t.code}</TableCell>
                              <TableCell>{t.category}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Tool Transactions ({filteredToolTransactions.length})</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportToCSV(filteredToolTransactions, "tool_transactions")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Tool</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Worker</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredToolTransactions.slice(0, 10).map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">
                                {new Date(t.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{t.toolName}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  t.type === "checkout" ? "bg-blue-100 text-blue-700" :
                                  t.type === "return" ? "bg-green-100 text-green-700" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                  {t.type}
                                </span>
                              </TableCell>
                              <TableCell>{t.userName}</TableCell>
                              <TableCell className="text-sm">{t.notes || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Job Card Reports</CardTitle>
                      <CardDescription>Manufacturing jobs and progress</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV(filteredJobs, "job_cards")}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Jobs
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job Card #</TableHead>
                          <TableHead>Board Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Supervisor</TableHead>
                          <TableHead>Materials Used</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJobs.map(j => (
                          <TableRow key={j.id}>
                            <TableCell className="font-mono">{j.jobCardNumber}</TableCell>
                            <TableCell className="font-medium">{j.boardName}</TableCell>
                            <TableCell className="capitalize">{j.boardType}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                j.status === "fabrication" ? "bg-orange-100 text-orange-700" :
                                j.status === "assembling" ? "bg-blue-100 text-blue-700" :
                                "bg-green-100 text-green-700"
                              }`}>
                                {j.status}
                              </span>
                            </TableCell>
                            <TableCell>{j.supervisorName}</TableCell>
                            <TableCell>{j.materialsUsed.length} items</TableCell>
                            <TableCell className="text-sm">
                              {new Date(j.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boards" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Finished Boards Reports</CardTitle>
                      <CardDescription>Production and sales</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV(boards, "finished_boards")}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Boards
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Current Stock</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {boards.map(b => (
                            <TableRow key={b.id}>
                              <TableCell className="font-medium">{b.type}</TableCell>
                              <TableCell>{b.color}</TableCell>
                              <TableCell className="font-bold">{b.quantity}</TableCell>
                              <TableCell>
                                {b.quantity <= b.minThreshold ? (
                                  <span className="text-orange-600 font-semibold">Low Stock</span>
                                ) : (
                                  <span className="text-green-600">In Stock</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Board Transactions ({filteredBoardTransactions.length})</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportToCSV(filteredBoardTransactions, "board_transactions")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Board</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Performed By</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBoardTransactions.slice(0, 10).map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">
                                {new Date(t.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{t.boardName}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  t.type === "manufactured" ? "bg-green-100 text-green-700" :
                                  "bg-blue-100 text-blue-700"
                                }`}>
                                  {t.type}
                                </span>
                              </TableCell>
                              <TableCell>{t.quantity}</TableCell>
                              <TableCell>{t.customerName || "-"}</TableCell>
                              <TableCell className="text-sm">{t.userName}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customer" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Customer Goods Reports</CardTitle>
                      <CardDescription>Goods received from customers</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV(filteredCustomerGoods, "customer_goods")}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Received Date</TableHead>
                          <TableHead>Received By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomerGoods.map(g => (
                          <TableRow key={g.id}>
                            <TableCell className="font-medium">{g.customerName}</TableCell>
                            <TableCell className="max-w-xs truncate">{g.description}</TableCell>
                            <TableCell>{g.quantity}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                g.status === "received" ? "bg-blue-100 text-blue-700" :
                                g.status === "processed" ? "bg-green-100 text-green-700" :
                                "bg-purple-100 text-purple-700"
                              }`}>
                                {g.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(g.receivedDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm">{g.receivedByName}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Materials Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-bold">{materials.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock:</span>
                      <span className="font-bold text-orange-600">{lowStockMaterials.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transactions:</span>
                      <span className="font-bold">{filteredMaterialTransactions.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-purple-600" />
                      Tools Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Tools:</span>
                      <span className="font-bold">{tools.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Checked Out:</span>
                      <span className="font-bold text-blue-600">
                        {tools.filter(t => t.status === "checked_out").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Damaged:</span>
                      <span className="font-bold text-red-600">{damagedTools.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-orange-600" />
                      Jobs Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Jobs:</span>
                      <span className="font-bold">{jobs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active:</span>
                      <span className="font-bold text-blue-600">{activeJobs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-bold text-green-600">
                        {jobs.filter(j => j.status === "completed").length}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Box className="h-4 w-4 text-green-600" />
                      Boards Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total in Stock:</span>
                      <span className="font-bold">
                        {boards.reduce((sum, b) => sum + b.quantity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock Types:</span>
                      <span className="font-bold text-orange-600">{lowStockBoards.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transactions:</span>
                      <span className="font-bold">{filteredBoardTransactions.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>Complete inventory and operations summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <h4 className="font-semibold mb-2">Current Period ({startDate || "All"} - {endDate || "All"})</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Material Issues</p>
                          <p className="text-xl font-bold">
                            {filteredMaterialTransactions.filter(t => t.type === "issue").length}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Tool Checkouts</p>
                          <p className="text-xl font-bold">
                            {filteredToolTransactions.filter(t => t.type === "checkout").length}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Jobs Created</p>
                          <p className="text-xl font-bold">{filteredJobs.length}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Boards Sold</p>
                          <p className="text-xl font-bold">
                            {filteredBoardTransactions.filter(t => t.type === "sold").reduce((sum, t) => sum + t.quantity, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
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