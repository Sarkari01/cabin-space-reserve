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
  ShieldCheck,
  LogOut,
  PanelLeft,
  Newspaper,
  MessageSquare,
  Heart,
  CreditCard,
  Receipt,
  AlertCircle,
  Gift,
  Ticket,
  ArrowUpDown,
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
    { title: "Rewards & Coupons", url: "/student/dashboard", icon: Gift, tab: "rewards" },
    { title: "Favorites", url: "/student/dashboard", icon: BookOpen, tab: "favorites" },
    { title: "Transactions", url: "/student/dashboard", icon: CreditCard, tab: "transactions" },
    { title: "News", url: "/student/dashboard", icon: Newspaper, tab: "news" },
    { title: "Community", url: "/student/dashboard", icon: Heart, tab: "community" },
    { title: "Chat", url: "/student/dashboard", icon: MessageSquare, tab: "chat" },
    { title: "Profile", url: "/student/dashboard", icon: Settings, tab: "profile" },
  ],
  merchant: [
    { title: "Dashboard", url: "/merchant/dashboard", icon: Home, tab: "overview" },
    { title: "My Study Halls", url: "/merchant/dashboard", icon: Building, tab: "studyhalls" },
    { title: "Bookings", url: "/merchant/dashboard", icon: Calendar, tab: "bookings" },
    { title: "Coupons & Promotions", url: "/merchant/dashboard", icon: Ticket, tab: "coupons" },
    { title: "Settlements", url: "/merchant/dashboard", icon: ArrowUpDown, tab: "settlements" },
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
    { title: "Merchant Verification", url: "/admin/dashboard", icon: ShieldCheck, tab: "merchantverification" },
    { title: "Study Halls", url: "/admin/dashboard", icon: Building, tab: "studyhalls" },
    { title: "Bookings", url: "/admin/dashboard", icon: Calendar, tab: "bookings" },
    { title: "Coupons", url: "/admin/dashboard", icon: Ticket, tab: "coupons" },
    { title: "Rewards & Referrals", url: "/admin/dashboard", icon: Gift, tab: "rewards" },
    { title: "Rewards Settings", url: "/admin/dashboard", icon: Settings, tab: "rewards-settings" },
    { title: "Settlements", url: "/admin/dashboard", icon: ArrowUpDown, tab: "settlements" },
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
  const { state, isMobile } = useSidebar();
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
    <Sidebar 
      className={`${isCollapsed ? "w-14" : "w-60"} ${isMobile ? "fixed inset-y-0 left-0 z-50" : ""}`} 
      collapsible="icon"
    >
      <SidebarContent>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex-shrink-0"></div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold truncate">StudySpace</h2>
                <p className="text-xs text-muted-foreground capitalize truncate">{userRole} Panel</p>
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
        <div className="mt-auto p-3 sm:p-4 border-t">
          {!isCollapsed && (
            <div className="mb-2 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">Welcome back!</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-2 truncate">Logout</span>}
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
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header with trigger */}
          <header className="h-14 border-b bg-background flex items-center px-2 sm:px-4 sticky top-0 z-40">
            <SidebarTrigger className="md:hidden" />
            <div className="ml-2 sm:ml-4 flex-1 min-w-0">
              <h1 className="text-lg font-semibold capitalize truncate">{userRole} Dashboard</h1>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-1 overflow-auto p-2 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}