"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Inventory", href: "/admin/inventory", icon: Package },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  useEffect(() => {
    if (!token && !pathname.startsWith("/account/login")) {
      router.push("/account/login");
    }
  }, [token, pathname, router]);

  const handleLogout = () => {
    logout();
    router.push("/account/login");
  };

  const sidebarWidthClass = isCollapsed ? "w-20" : "w-64";
  const mainPaddingClass = isCollapsed ? "lg:pl-20" : "lg:pl-64";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 bg-opacity-75 dark:bg-black dark:bg-opacity-50 transition-opacity" />
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarWidthClass} lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <span className="ml-2 text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:block">
                Sweet Delights
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              className="hidden lg:inline-flex p-2 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" aria-hidden="true" /> : <ChevronLeft className="w-5 h-5" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Close sidebar"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav className="mt-6 px-3" aria-label="Main navigation">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'}`}
                      onClick={() => setIsSidebarOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      title={item.name}
                    >
                      <item.icon
                        className={`flex-shrink-0 h-5 w-5 ${isActive ? 'text-amber-500 dark:text-amber-300' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`}
                        aria-hidden="true"
                      />
                      {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start text-sm" title="Sign Out">
            <LogOut className="mr-2 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {!isCollapsed && <span className="truncate">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${mainPaddingClass}`}>
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label="Open sidebar"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" aria-hidden="true" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                <Input placeholder="Search..." className="pl-10 w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" aria-label="Search" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button type="button" className="relative p-2 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="View notifications">
                <Bell className="h-5 w-5" aria-hidden="true" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</Badge>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="User menu">
                    A
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Admin User</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" aria-hidden="true" />Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
