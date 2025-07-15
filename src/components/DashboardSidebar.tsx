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
  MessageCircle,
  Heart,
  CreditCard,
  Receipt,
  AlertCircle,
  Gift,
  Ticket,
  ArrowUpDown,
  UserPlus,
  Phone,
  Headphones,
  Banknote,
  UserCog,
  FileText,
  TrendingUp,
  Zap,
  Target,
  Briefcase,
  PieChart,
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
  userRole: "student" | "merchant" | "admin" | "incharge" | "telemarketing_executive" | "pending_payments_caller" | "customer_care_executive" | "settlement_manager" | "general_administrator";
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
  merchant: {
    coreOps: [
      { title: "Dashboard", url: "/merchant/dashboard", icon: Home, tab: "overview" },
      { title: "My Study Halls", url: "/merchant/dashboard", icon: Building, tab: "studyhalls" },
      { title: "Bookings", url: "/merchant/dashboard", icon: Calendar, tab: "bookings" },
      { title: "Incharges", url: "/merchant/dashboard", icon: UserPlus, tab: "incharges" },
    ],
    financial: [
      { title: "Settlements", url: "/merchant/dashboard", icon: ArrowUpDown, tab: "settlements" },
      { title: "Subscriptions", url: "/merchant/dashboard", icon: CreditCard, tab: "subscriptions" },
      { title: "Subscription Transactions", url: "/merchant/dashboard", icon: Receipt, tab: "subscription-transactions" },
      { title: "Transactions", url: "/merchant/dashboard", icon: CreditCard, tab: "transactions" },
    ],
    growth: [
      { title: "Coupons & Promotions", url: "/merchant/dashboard", icon: Ticket, tab: "coupons" },
      { title: "Users", url: "/merchant/dashboard", icon: Users, tab: "users" },
      { title: "Analytics", url: "/merchant/dashboard", icon: BarChart3, tab: "analytics" },
    ],
    communication: [
      { title: "News", url: "/merchant/dashboard", icon: Newspaper, tab: "news" },
      { title: "Community", url: "/merchant/dashboard", icon: Heart, tab: "community" },
      { title: "Chat", url: "/merchant/dashboard", icon: MessageSquare, tab: "chat" },
    ],
    settings: [
      { title: "Profile", url: "/merchant/dashboard", icon: Settings, tab: "profile" },
    ]
  },
  admin: {
    coreOps: [
      { title: "Dashboard", url: "/admin/dashboard", icon: Home, tab: "overview" },
      { title: "Users", url: "/admin/dashboard", icon: Users, tab: "users" },
      { title: "Bookings", url: "/admin/dashboard", icon: Calendar, tab: "bookings" },
      { title: "Call Logs", url: "/admin/dashboard", icon: Phone, tab: "call-logs-management" },
    ],
    businessMgmt: [
      { title: "Study Halls", url: "/admin/dashboard", icon: Building, tab: "studyhalls" },
      { title: "Merchant Verification", url: "/admin/dashboard", icon: ShieldCheck, tab: "merchantverification" },
      { title: "Incharges", url: "/admin/dashboard", icon: UserPlus, tab: "incharges" },
      { title: "Settlements", url: "/admin/dashboard", icon: ArrowUpDown, tab: "settlements" },
    ],
    financial: [
      { title: "Transactions", url: "/admin/dashboard", icon: CreditCard, tab: "transactions" },
      { title: "Subscription Plans", url: "/admin/dashboard", icon: Shield, tab: "subscription-plans" },
      { title: "Merchant Subscriptions", url: "/admin/dashboard", icon: CreditCard, tab: "merchant-subscriptions" },
      { title: "Subscription Transactions", url: "/admin/dashboard", icon: Receipt, tab: "subscription-transactions" },
      { title: "Rewards & Referrals", url: "/admin/dashboard", icon: Gift, tab: "rewards" },
    ],
    platformAdmin: [
      { title: "Operational Users", url: "/admin/dashboard", icon: UserCog, tab: "operational-users" },
      { title: "Support Tickets", url: "/admin/dashboard", icon: Headphones, tab: "support-tickets-management" },
      { title: "Business Settings", url: "/admin/dashboard", icon: Settings, tab: "business" },
      { title: "EKQR Recovery", url: "/admin/dashboard", icon: AlertCircle, tab: "ekqr-recovery" },
    ],
    marketing: [
      { title: "Coupons", url: "/admin/dashboard", icon: Ticket, tab: "coupons" },
      { title: "Banners", url: "/admin/dashboard", icon: BookOpen, tab: "banners" },
      { title: "News", url: "/admin/dashboard", icon: Newspaper, tab: "news" },
      { title: "Rewards Settings", url: "/admin/dashboard", icon: Settings, tab: "rewards-settings" },
    ],
    analytics: [
      { title: "Analytics", url: "/admin/dashboard", icon: BarChart3, tab: "analytics" },
    ],
    communication: [
      { title: "Community", url: "/admin/dashboard", icon: Heart, tab: "community" },
      { title: "Chat", url: "/admin/dashboard", icon: MessageSquare, tab: "chat" },
    ],
    settings: [
      { title: "Profile", url: "/admin/dashboard", icon: Settings, tab: "profile" },
    ]
  },
  incharge: [
    { title: "Dashboard", url: "/incharge/dashboard", icon: Home, tab: "overview" },
    { title: "Assigned Study Halls", url: "/incharge/dashboard", icon: Building, tab: "studyhalls" },
    { title: "Bookings Management", url: "/incharge/dashboard", icon: Calendar, tab: "bookings" },
    { title: "Transactions", url: "/incharge/dashboard", icon: CreditCard, tab: "transactions" },
    { title: "Activity Logs", url: "/incharge/dashboard", icon: BookOpen, tab: "activity" },
    { title: "Profile Settings", url: "/incharge/dashboard", icon: Settings, tab: "profile" },
  ],
  telemarketing_executive: {
    primary: [
      { title: "Dashboard", url: "/telemarketing/dashboard", icon: Home, tab: "overview" },
      { title: "Call Logs", url: "/telemarketing/dashboard", icon: Phone, tab: "call-logs" },
      { title: "Users Management", url: "/telemarketing/dashboard", icon: Target, tab: "users" },
    ],
    customerOps: [
      { title: "Merchant Verification", url: "/telemarketing/dashboard", icon: ShieldCheck, tab: "merchant-verification" },
      { title: "Community", url: "/telemarketing/dashboard", icon: Heart, tab: "community" },
      { title: "Chat Support", url: "/telemarketing/dashboard", icon: MessageCircle, tab: "chat" },
    ],
    businessData: [
      { title: "Study Halls", url: "/telemarketing/dashboard", icon: Building, tab: "studyhalls" },
      { title: "Bookings", url: "/telemarketing/dashboard", icon: Calendar, tab: "bookings" },
      { title: "Transactions", url: "/telemarketing/dashboard", icon: CreditCard, tab: "transactions" },
      { title: "Settlements", url: "/telemarketing/dashboard", icon: Receipt, tab: "settlements" },
    ],
    communication: [
      { title: "News Management", url: "/telemarketing/dashboard", icon: Newspaper, tab: "news" },
    ],
    analytics: [
      { title: "Analytics", url: "/telemarketing/dashboard", icon: TrendingUp, tab: "analytics" },
    ],
    settings: [
      { title: "Profile", url: "/telemarketing/dashboard", icon: Settings, tab: "profile" },
    ]
  },
  pending_payments_caller: [
    { title: "Dashboard", url: "/payments-caller/dashboard", icon: Home, tab: "overview" },
    { title: "Payment Recovery", url: "/payments-caller/dashboard", icon: AlertCircle, tab: "payment-recovery" },
    { title: "Call Logs", url: "/payments-caller/dashboard", icon: Phone, tab: "call-logs" },
    { title: "Pending Transactions", url: "/payments-caller/dashboard", icon: CreditCard, tab: "transactions" },
    { title: "Profile", url: "/payments-caller/dashboard", icon: Settings, tab: "profile" },
  ],
  customer_care_executive: [
    { title: "Dashboard", url: "/customer-care/dashboard", icon: Home, tab: "overview" },
    { title: "Support Tickets", url: "/customer-care/dashboard", icon: Headphones, tab: "support-tickets" },
    { title: "User Assistance", url: "/customer-care/dashboard", icon: Users, tab: "user-assistance" },
    { title: "Call Logs", url: "/customer-care/dashboard", icon: Phone, tab: "call-logs" },
    { title: "Profile", url: "/customer-care/dashboard", icon: Settings, tab: "profile" },
  ],
  settlement_manager: [
    { title: "Dashboard", url: "/settlement-manager/dashboard", icon: Home, tab: "overview" },
    { title: "Settlements", url: "/settlement-manager/dashboard", icon: ArrowUpDown, tab: "settlements" },
    { title: "Merchant Payments", url: "/settlement-manager/dashboard", icon: Banknote, tab: "merchant-payments" },
    { title: "Financial Reports", url: "/settlement-manager/dashboard", icon: BarChart3, tab: "reports" },
    { title: "Profile", url: "/settlement-manager/dashboard", icon: Settings, tab: "profile" },
  ],
  general_administrator: [
    { title: "Dashboard", url: "/general-admin/dashboard", icon: Home, tab: "overview" },
    { title: "Operational Users", url: "/general-admin/dashboard", icon: UserCog, tab: "operational-users" },
    { title: "System Monitoring", url: "/general-admin/dashboard", icon: BarChart3, tab: "monitoring" },
    { title: "Reports", url: "/general-admin/dashboard", icon: BookOpen, tab: "reports" },
    { title: "Profile", url: "/general-admin/dashboard", icon: Settings, tab: "profile" },
  ],
};

function AppSidebar({ userRole, userName, onTabChange, activeTab }: { 
  userRole: "student" | "merchant" | "admin" | "incharge" | "telemarketing_executive" | "pending_payments_caller" | "customer_care_executive" | "settlement_manager" | "general_administrator"; 
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

  // Function to render menu items
  const renderMenuItem = (item: any) => {
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
            {!isCollapsed && <span className="text-sm">{item.title}</span>}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

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


        {/* Navigation - Check for grouped structure */}
        {(userRole === "telemarketing_executive" || userRole === "admin" || userRole === "merchant") && typeof items === "object" && !Array.isArray(items) ? (
          <>
            {userRole === "telemarketing_executive" && (
              <>
                {/* Primary Actions */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Primary Actions</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'primary' in items && items.primary?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Customer Operations */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Customer Operations</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'customerOps' in items && items.customerOps?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Business Data & Analytics */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Business Data</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'businessData' in items && items.businessData?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Communication & Content */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Communication</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'communication' in items && items.communication?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Analytics & Reports */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Analytics</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'analytics' in items && items.analytics?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Settings */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Settings className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Settings</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'settings' in items && items.settings?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}

            {userRole === "admin" && (
              <>
                {/* Core Operations */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Core Operations</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'coreOps' in items && items.coreOps?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Business */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Building className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Business</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'businessMgmt' in items && items.businessMgmt?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Financial */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Financial</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'financial' in items && items.financial?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Platform Administration */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <UserCog className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Platform Administration</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'platformAdmin' in items && items.platformAdmin?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Marketing & Content */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Ticket className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Marketing & Content</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'marketing' in items && items.marketing?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Analytics & Reports */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Analytics & Reports</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'analytics' in items && items.analytics?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Community */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Community</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'communication' in items && items.communication?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Account & Settings */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Settings className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Account & Settings</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'settings' in items && items.settings?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}

            {userRole === "merchant" && (
              <>
                {/* Core Business Operations */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Core Operations</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'coreOps' in items && items.coreOps?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Financial Management */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Financial Management</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'financial' in items && items.financial?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Business Growth */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Business Growth</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'growth' in items && items.growth?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Platform & Communication */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Platform & Communication</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'communication' in items && items.communication?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Settings & Profile */}
                <SidebarGroup>
                  <SidebarGroupLabel>
                    <div className="flex items-center space-x-2">
                      <Settings className="h-3 w-3" />
                      {!isCollapsed && <span className="text-xs font-semibold">Settings & Profile</span>}
                    </div>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {'settings' in items && items.settings?.map(renderMenuItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}
          </>
        ) : (
          /* Standard flat navigation for other roles */
          <SidebarGroup>
            <SidebarGroupLabel>{!isCollapsed ? "Navigation" : ""}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.isArray(items) && items.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
          <header className="h-12 sm:h-14 border-b bg-background flex items-center px-3 sm:px-4 lg:px-6 sticky top-0 z-40">
            <SidebarTrigger className="lg:hidden mr-2" />
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold capitalize truncate">{userRole} Dashboard</h1>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}