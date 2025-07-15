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
  Newspaper,
  MessageSquare,
  Heart,
  CreditCard,
  Receipt,
  AlertCircle,
  Activity,
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
    { title: "Browse Study Halls", url: "/student/dashboard", icon: Building, tab: "browse" },
    { title: "My Bookings", url: "/student/dashboard", icon: Calendar, tab: "bookings" },
    { title: "Favorites", url: "/student/dashboard", icon: BookOpen, tab: "favorites" },
    { title: "News", url: "/student/dashboard", icon: Newspaper, tab: "news" },
    { title: "Community", url: "/student/dashboard", icon: Heart, tab: "community" },
    { title: "Chat", url: "/student/dashboard", icon: MessageSquare, tab: "chat" },
    { title: "Profile", url: "/student/dashboard", icon: Settings, tab: "profile" },
  ],
  merchant: [
    { title: "Dashboard", url: "/merchant/dashboard", icon: Home, tab: "overview" },
    { title: "My Study Halls", url: "/merchant/dashboard", icon: Building, tab: "studyhalls" },
    { title: "Bookings", url: "/merchant/dashboard", icon: Calendar, tab: "bookings" },
    { title: "Subscriptions", url: "/merchant/dashboard", icon: CreditCard, tab: "subscriptions" },
    { title: "Subscription Transactions", url: "/merchant/dashboard", icon: Receipt, tab: "subscription-transactions" },
    { title: "Transactions", url: "/merchant/dashboard", icon: CreditCard, tab: "transactions" },
    { title: "Users", url: "/merchant/dashboard", icon: Users, tab: "users" },
    { title: "Analytics", url: "/merchant/dashboard", icon: BarChart3, tab: "analytics" },
    { title: "News", url: "/merchant/dashboard", icon: Newspaper, tab: "news" },
    { title: "Community", url: "/merchant/dashboard", icon: Heart, tab: "community" },
    { title: "Chat", url: "/merchant/dashboard", icon: MessageSquare, tab: "chat" },
    { title: "Profile", url: "/merchant/dashboard", icon: Settings, tab: "profile" },
  ],
  admin: [
    { title: "Dashboard", url: "/admin/dashboard", icon: Home, tab: "overview" },
    { title: "Users", url: "/admin/dashboard", icon: Users, tab: "users" },
    { title: "Merchants", url: "/admin/dashboard", icon: Users, tab: "merchants" },
    { title: "Study Halls", url: "/admin/dashboard", icon: Building, tab: "studyhalls" },
    { title: "Bookings", url: "/admin/dashboard", icon: Calendar, tab: "bookings" },
    { title: "Booking Health", url: "/admin/dashboard", icon: Activity, tab: "booking-health" },
    { title: "Transactions", url: "/admin/dashboard", icon: CreditCard, tab: "transactions" },
    { title: "Subscription Transactions", url: "/admin/dashboard", icon: Receipt, tab: "subscription-transactions" },
    { title: "Subscription Plans", url: "/admin/dashboard", icon: Shield, tab: "subscription-plans" },
    { title: "Merchant Subscriptions", url: "/admin/dashboard", icon: CreditCard, tab: "merchant-subscriptions" },
    { title: "Banners", url: "/admin/dashboard", icon: BookOpen, tab: "banners" },
    { title: "Business Settings", url: "/admin/dashboard", icon: Settings, tab: "business" },
    { title: "News", url: "/admin/dashboard", icon: Newspaper, tab: "news" },
    { title: "Community", url: "/admin/dashboard", icon: Heart, tab: "community" },
    { title: "Chat", url: "/admin/dashboard", icon: MessageSquare, tab: "chat" },
    { title: "Analytics", url: "/admin/dashboard", icon: BarChart3, tab: "analytics" },
    { title: "Profile", url: "/admin/dashboard", icon: Settings, tab: "profile" },
    { title: "EKQR Recovery", url: "/admin/dashboard", icon: AlertCircle, tab: "ekqr-recovery" },
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

  const handleLogout = async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
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
                <h2 className="text-lg font-bold">StudySpace</h2>
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