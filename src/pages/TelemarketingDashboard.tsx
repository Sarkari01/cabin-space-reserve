import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Phone, Users, Clock, CheckCircle, AlertCircle, Search, Building, Calendar, CreditCard, BarChart3 } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { useCallLogs } from '@/hooks/useCallLogs';
import { CallLogModal } from '@/components/CallLogModal';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { TelemarketingUsersTab } from '@/components/telemarketing/TelemarketingUsersTab';
import { TelemarketingStudyHallsTab } from '@/components/telemarketing/TelemarketingStudyHallsTab';
import { TelemarketingBookingsTab } from '@/components/telemarketing/TelemarketingBookingsTab';
import { TelemarketingTransactionsTab } from '@/components/telemarketing/TelemarketingTransactionsTab';
import { TelemarketingSettlementsTab } from '@/components/telemarketing/TelemarketingSettlementsTab';
import { TelemarketingMerchantVerificationTab } from '@/components/telemarketing/TelemarketingMerchantVerificationTab';
import { TelemarketingCommunityTab } from '@/components/telemarketing/TelemarketingCommunityTab';
import { TelemarketingChatTab } from '@/components/telemarketing/TelemarketingChatTab';
import { TelemarketingNewsTab } from '@/components/telemarketing/TelemarketingNewsTab';
import { TransactionsTab } from '@/components/admin/TransactionsTab';
import { EnhancedAnalytics } from '@/components/EnhancedAnalytics';
import { PageHeader } from '@/components/PageHeader';
import UserProfileSettings from '@/components/UserProfileSettings';

const TelemarketingDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const { merchants, stats, loading: merchantsLoading } = useAdminData();
  const { callLogs, loading: callLogsLoading, createCallLog } = useCallLogs();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'telemarketing_executive') {
    return <Navigate to="/login" replace />;
  }

  // Filter merchants for telemarketing
  const telemarketingMerchants = merchants.filter(merchant => {
    const matchesSearch = !searchTerm || 
      merchant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    
    // You can add more sophisticated filtering based on merchant status
    return matchesSearch;
  });

  // Get today's call stats
  const todayCalls = callLogs.filter(log => {
    const today = new Date().toDateString();
    const logDate = new Date(log.created_at).toDateString();
    return today === logDate;
  });

  const handleMerchantCall = (merchant: any) => {
    setSelectedMerchant(merchant);
    setCallModalOpen(true);
  };

  const handleCallSubmit = async (callData: any) => {
    if (!selectedMerchant) return;

    await createCallLog({
      contact_type: 'merchant',
      contact_id: selectedMerchant.id,
      call_purpose: 'onboarding',
      ...callData
    });

    setCallModalOpen(false);
    setSelectedMerchant(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      incomplete: 'destructive',
      verified: 'default',
      rejected: 'outline'
    };
    return variants[status] || 'secondary';
  };

  const merchantColumns = [
    {
      title: 'Merchant',
      key: 'merchant',
      render: (_: any, merchant: any) => (
        <div>
          <div className="font-medium">{merchant?.full_name || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{merchant?.email || 'No email'}</div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, merchant: any) => (
        <div>
          <div className="text-sm">{merchant?.phone || 'No phone'}</div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, merchant: any) => (
        <Badge variant={getStatusBadge('pending')}>
          Pending Call
        </Badge>
      )
    },
    {
      title: 'Joined',
      key: 'created_at',
      render: (_: any, merchant: any) => (
        <div className="text-sm">
          {merchant?.created_at ? new Date(merchant.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, merchant: any) => (
        <Button
          size="sm"
          onClick={() => handleMerchantCall(merchant)}
          className="flex items-center gap-2"
          disabled={!merchant}
        >
          <Phone className="h-4 w-4" />
          Call
        </Button>
      )
    }
  ] as any;

  return (
    <DashboardSidebar 
      userRole={userRole} 
      userName={user.email || 'Telemarketing Executive'}
      onTabChange={setActiveTab}
      activeTab={activeTab}
    >
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <PageHeader
              title="Telemarketing Dashboard"
              description="Comprehensive sub-admin platform management"
              breadcrumbs={[
                { label: "Dashboard", active: true }
              ]}
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Halls</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeStudyHalls || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Calls</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayCalls.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => setActiveTab('users')}
              >
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Button>
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => setActiveTab('studyhalls')}
              >
                <Building className="h-6 w-6" />
                <span>Study Halls</span>
              </Button>
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => setActiveTab('bookings')}
              >
                <Calendar className="h-6 w-6" />
                <span>Bookings</span>
              </Button>
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => setActiveTab('transactions')}
              >
                <CreditCard className="h-6 w-6" />
                <span>Transactions</span>
              </Button>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Call Activity</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('call-logs')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {callLogs.slice(0, 3).map((call) => (
                      <div key={call.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{call.call_purpose}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(call.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={call.call_status === 'completed' ? 'default' : 'secondary'}>
                          {call.call_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Merchants to Contact</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMerchantCall(merchants[0])}
                      disabled={merchants.length === 0}
                    >
                      Start Call
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {telemarketingMerchants.slice(0, 3).map((merchant) => (
                      <div key={merchant.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{merchant?.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{merchant?.email}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMerchantCall(merchant)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === "users" && <TelemarketingUsersTab />}

        {/* Study Halls Management Tab */}
        {activeTab === "studyhalls" && <TelemarketingStudyHallsTab />}

        {/* Bookings Management Tab */}
        {activeTab === "bookings" && <TelemarketingBookingsTab />}

        {/* Transactions Management Tab */}
        {activeTab === "transactions" && <TelemarketingTransactionsTab />}

        {/* Settlements Tab */}
        {activeTab === "settlements" && <TelemarketingSettlementsTab />}

        {/* Merchant Verification Tab */}
        {activeTab === "merchant-verification" && <TelemarketingMerchantVerificationTab />}

        {/* Community Tab */}
        {activeTab === "community" && <TelemarketingCommunityTab />}

        {/* Chat Tab */}
        {activeTab === "chat" && <TelemarketingChatTab />}

        {/* News Tab */}
        {activeTab === "news" && <TelemarketingNewsTab />}

        {/* Call Logs Tab */}
        {activeTab === "call-logs" && (
          <div className="space-y-6">
            <PageHeader
              title="Call Logs Management"
              description="View and manage all call activities"
              breadcrumbs={[
                { label: "Dashboard", href: "#", onClick: () => setActiveTab('overview') },
                { label: "Call Logs", active: true }
              ]}
            />
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Merchants to Contact</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search merchants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {merchantsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveTable
                    data={telemarketingMerchants}
                    columns={merchantColumns}
                    emptyMessage="No merchants found"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <PageHeader
              title="Analytics & Performance"
              description="Platform performance metrics and insights"
              breadcrumbs={[
                { label: "Dashboard", href: "#", onClick: () => setActiveTab('overview') },
                { label: "Analytics", active: true }
              ]}
            />
            
            <EnhancedAnalytics
              data={[]}
              title="Telemarketing Performance"
              description="Call performance and platform metrics"
              loading={false}
            />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <PageHeader
              title="Profile Settings"
              description="Manage your account and preferences"
              breadcrumbs={[
                { label: "Dashboard", href: "#", onClick: () => setActiveTab('overview') },
                { label: "Profile", active: true }
              ]}
            />
            
            <UserProfileSettings />
          </div>
        )}

        {/* Call Log Modal */}
        <CallLogModal
          open={callModalOpen}
          onOpenChange={setCallModalOpen}
          onSubmit={handleCallSubmit}
          contactInfo={selectedMerchant ? {
            name: selectedMerchant.full_name || 'Unknown',
            phone: selectedMerchant.phone || 'No phone',
            email: selectedMerchant.email
          } : undefined}
          callPurpose="onboarding"
        />
      </div>
    </DashboardSidebar>
  );
};

export default TelemarketingDashboard;