import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  Users,
  Settings,
  BarChart3,
  Building,
  BookOpen,
  Shield,
  LogOut,
  PanelLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  userRole: "student" | "merchant" | "admin";
  userName: string;
  children: React.ReactNode;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

const sidebarItems = {
  student: [
    { title: "Dashboard", url: "/student/dashboard", icon: Home, tab: "overview" },
    { title: "Browse Cabins", url: "/student/dashboard", icon: Building, tab: "browse" },
    { title: "My Bookings", url: "/student/dashboard", icon: Calendar, tab: "bookings" },
    { title: "Favorites", url: "/student/dashboard", icon: BookOpen, tab: "favorites" },
  ],
  merchant: [
    { title: "Dashboard", url: "/merchant/dashboard", icon: Home, tab: "overview" },
    { title: "My Cabins", url: "/merchant/dashboard", icon: Building, tab: "cabins" },
    { title: "Bookings", url: "/merchant/dashboard", icon: Calendar, tab: "bookings" },
    { title: "Analytics", url: "/merchant/dashboard", icon: BarChart3, tab: "analytics" },
  ],
  admin: [
    { title: "Dashboard", url: "/admin/dashboard", icon: Home, tab: "overview" },
    { title: "Users", url: "/admin/dashboard", icon: Users, tab: "users" },
    { title: "Cabins", url: "/admin/dashboard", icon: Building, tab: "cabins" },
    { title: "Analytics", url: "/admin/dashboard", icon: BarChart3, tab: "analytics" },
  ],
};

function AppSidebar({ userRole, userName, onTabChange, activeTab }: { 
  userRole: "student" | "merchant" | "admin"; 
  userName: string;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const items = sidebarItems[userRole];

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex-shrink-0"></div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold">CabinSpace</h2>
                <p className="text-xs text-muted-foreground capitalize">{userRole} Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>{!isCollapsed ? "Navigation" : ""}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = activeTab === item.tab || (location.pathname === item.url && item.tab === "overview");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <button
                        onClick={() => {
                          if (item.tab && onTabChange) {
                            onTabChange(item.tab);
                          } else if (item.url !== location.pathname) {
                            window.location.href = item.url;
                          }
                        }}
                        className={`flex items-center space-x-2 p-2 rounded-md transition-colors w-full text-left ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info & Logout */}
        <div className="mt-auto p-4 border-t">
          {!isCollapsed && (
            <div className="mb-2">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">Welcome back!</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function DashboardSidebar({ userRole, userName, children, onTabChange, activeTab }: DashboardSidebarProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userRole} userName={userName} onTabChange={onTabChange} activeTab={activeTab} />
        <main className="flex-1 flex flex-col">
          {/* Header with trigger */}
          <header className="h-14 border-b bg-background flex items-center px-4">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-lg font-semibold capitalize">{userRole} Dashboard</h1>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}