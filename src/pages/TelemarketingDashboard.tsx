import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Phone, Users, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { useCallLogs } from '@/hooks/useCallLogs';
import { CallLogModal } from '@/components/CallLogModal';
import { ResponsiveTable } from '@/components/ResponsiveTable';

const TelemarketingDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const { merchants, loading: merchantsLoading } = useAdminData();
  const { callLogs, loading: callLogsLoading, createCallLog } = useCallLogs();
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
      render: (merchant: any) => (
        <div>
          <div className="font-medium">{merchant.full_name || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{merchant.email}</div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (merchant: any) => (
        <div>
          <div className="text-sm">{merchant.phone || 'No phone'}</div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (merchant: any) => (
        <Badge variant={getStatusBadge('pending')}>
          Pending Call
        </Badge>
      )
    },
    {
      title: 'Joined',
      key: 'created_at',
      render: (merchant: any) => (
        <div className="text-sm">
          {new Date(merchant.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (merchant: any) => (
        <Button
          size="sm"
          onClick={() => handleMerchantCall(merchant)}
          className="flex items-center gap-2"
        >
          <Phone className="h-4 w-4" />
          Call
        </Button>
      )
    }
  ] as any;

  return (
    <DashboardSidebar userRole={userRole} userName={user.email || 'Telemarketing Executive'}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Telemarketing Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchants.length}</div>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Calls</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayCalls.filter(call => call.call_status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {callLogs.filter(call => call.follow_up_date && new Date(call.follow_up_date) >= new Date()).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Merchant List */}
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