import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import {
  LayoutDashboard,
  Package,
  Wrench,
  ClipboardList,
  Box,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Home,
  PackagePlus,
  CircuitBoard,
  Moon,
  Sun
} from "lucide-react";
import { useState } from "react";
import { hasPermission } from "@/lib/mockAuth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, permission: null },
    { name: "Materials", href: "/materials", icon: Package, permission: "view_materials" },
    { name: "Material Requests", href: "/material-requests", icon: PackagePlus, permission: "request_materials" },
    { name: "Tools", href: "/tools", icon: Wrench, permission: "view_tools" },
    { name: "Job Cards", href: "/jobs", icon: ClipboardList, permission: "view_jobs" },
    { name: "Finished Boards", href: "/boards", icon: CircuitBoard, permission: "view_boards" },
    { name: "Customer Goods", href: "/customer-goods", icon: Users, permission: "view_customer_goods" },
    { name: "Reports", href: "/reports", icon: FileText, permission: "view_reports" },
    { name: "User Management", href: "/users", icon: Users, permission: "manage_users" }
  ];

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", permission: "view_dashboard" },
    { href: "/materials", icon: Package, label: "Materials", permission: "view_materials" },
    { href: "/material-requests", icon: PackagePlus, label: "Material Requests", permission: "request_materials" },
    { href: "/tools", icon: Wrench, label: "Tools & Equipment", permission: "view_tools" }
  ];

  const visibleNavigation = navigation.filter(item => 
    item.permission === "all" || hasPermission(user, item.permission)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Josm Electrical
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Inventory System</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                  {user?.role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + "/");
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
              <ThemeSwitch />
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Josm Electrical
            </h2>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}