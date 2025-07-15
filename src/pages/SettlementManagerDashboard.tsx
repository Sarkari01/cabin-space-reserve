import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSettlements } from "@/hooks/useSettlements";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { DollarSign, Building, Clock, CheckCircle, Search, Plus, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SettlementManagerDashboard = () => {
  const { user } = useAuth();
  const { settlements, loading, fetchSettlements } = useSettlements();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const pendingSettlements = settlements.filter(settlement => 
    settlement.status === 'pending' || settlement.status === 'approved'
  );

  const processedSettlements = settlements.filter(settlement => 
    settlement.status === 'completed'
  );

  const todaysSettlements = settlements.filter(settlement => 
    new Date(settlement.created_at).toDateString() === new Date().toDateString()
  );

  const totalPendingAmount = pendingSettlements.reduce((sum, settlement) => 
    sum + (settlement.net_settlement_amount || 0), 0
  );

  const handleUpdateSettlementStatus = async (settlementId: string, status: string) => {
    try {
      const updates: any = { status };
      
      if (status === 'completed') {
        updates.payment_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('settlements')
        .update(updates)
        .eq('id', settlementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Settlement ${status} successfully`
      });

      fetchSettlements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settlement",
        variant: "destructive"
      });
    }
  };

  const stats = [
    {
      title: "Pending Settlements",
      value: pendingSettlements.length,
      icon: Clock,
      trend: { value: 5, label: "awaiting processing" }
    },
    {
      title: "Pending Amount",
      value: `₹${totalPendingAmount.toLocaleString()}`,
      icon: DollarSign,
      trend: { value: 12, label: "total pending" }
    },
    {
      title: "Processed Today",
      value: processedSettlements.filter(s => 
        new Date(s.payment_date || '').toDateString() === new Date().toDateString()
      ).length,
      icon: CheckCircle,
      trend: { value: 3, label: "completed today" }
    },
    {
      title: "Total Merchants",
      value: new Set(settlements.map(s => s.merchant_id)).size,
      icon: Building,
      trend: { value: 2, label: "active merchants" }
    }
  ];

  const getSettlementStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'completed':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <DashboardSidebar
      userRole="settlement_manager"
      userName={user?.email || "Settlement Manager"}
      onTabChange={setActiveTab}
      activeTab={activeTab}
    >
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <PageHeader
            title="Settlement Manager Dashboard"
            description="Manage merchant settlements and payouts"
            breadcrumbs={[
              { label: "Dashboard", active: true }
            ]}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stat.trend.value} {stat.trend.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Settlements */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Settlements</CardTitle>
                <CardDescription>Settlements awaiting processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingSettlements.slice(0, 5).map((settlement) => (
                    <div key={settlement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Settlement #{settlement.settlement_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Merchant: {settlement.merchant_id.slice(-8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(settlement.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ₹{settlement.net_settlement_amount?.toLocaleString()}
                        </div>
                        <Badge variant={getSettlementStatusColor(settlement.status)}>
                          {settlement.status}
                        </Badge>
                        <div className="mt-2 space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateSettlementStatus(settlement.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateSettlementStatus(settlement.id, 'completed')}
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingSettlements.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending settlements
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Processed</CardTitle>
                <CardDescription>Recently completed settlements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processedSettlements.slice(0, 5).map((settlement) => (
                    <div key={settlement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Settlement #{settlement.settlement_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Merchant: {settlement.merchant_id.slice(-8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {settlement.payment_date ? new Date(settlement.payment_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ₹{settlement.net_settlement_amount?.toLocaleString()}
                        </div>
                        <Badge variant={getSettlementStatusColor(settlement.status)}>
                          {settlement.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {settlement.payment_method || 'Bank Transfer'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Settlements Tab */}
      {activeTab === "settlements" && (
        <div className="space-y-6">
          <PageHeader
            title="All Settlements"
            description="View and manage all merchant settlements"
            breadcrumbs={[
              { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
              { label: "Settlements", active: true }
            ]}
          />

          <ResponsiveTable
            data={settlements}
            columns={[
              {
                key: 'settlement_number',
                title: 'Settlement #',
                render: (value) => (
                  <div className="font-mono">#{value}</div>
                )
              },
              {
                key: 'merchant_id',
                title: 'Merchant',
                render: (value) => (
                  <div>
                    <p className="font-medium">Merchant {value.slice(-8)}</p>
                  </div>
                )
              },
              {
                key: 'net_settlement_amount',
                title: 'Amount',
                render: (value) => (
                  <div className="font-bold">₹{value?.toLocaleString()}</div>
                )
              },
              {
                key: 'status',
                title: 'Status',
                render: (value) => (
                  <Badge variant={getSettlementStatusColor(value)}>
                    {value}
                  </Badge>
                )
              },
              {
                key: 'created_at',
                title: 'Created',
                mobileHidden: true,
                render: (value) => new Date(value).toLocaleDateString()
              },
              {
                key: 'payment_date',
                title: 'Paid',
                mobileHidden: true,
                render: (value) => value ? new Date(value).toLocaleDateString() : '-'
              }
            ]}
            searchPlaceholder="Search settlements..."
            loading={loading}
            onRowClick={(settlement) => setSelectedSettlement(settlement)}
            actions={(settlement) => settlement.status === 'pending' && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateSettlementStatus(settlement.id, 'approved');
                  }}
                >
                  Approve
                </Button>
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateSettlementStatus(settlement.id, 'completed');
                  }}
                >
                  Complete
                </Button>
              </div>
            )}
          />
        </div>
      )}
    </DashboardSidebar>
  );
};

export default SettlementManagerDashboard;