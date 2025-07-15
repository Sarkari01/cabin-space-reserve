import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useCallLogs } from "@/hooks/useCallLogs";
import { useToast } from "@/hooks/use-toast";
import { CallLogModal } from "@/components/CallLogModal";
import { PageHeader } from "@/components/PageHeader";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { Phone, PhoneCall, Clock, Calendar, Search, Plus, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentsCallerDashboard = () => {
  const { user } = useAuth();
  const { callLogs, loading, refetch } = useCallLogs();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [callLogModalOpen, setCallLogModalOpen] = useState(false);
  const [selectedCallLog, setSelectedCallLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter for pending payment related calls
  const pendingPaymentCalls = callLogs.filter(call => 
    call.call_purpose.toLowerCase().includes('payment') || 
    call.call_purpose.toLowerCase().includes('pending') ||
    call.notes?.toLowerCase().includes('payment')
  );

  const todaysCalls = callLogs.filter(call => 
    new Date(call.created_at).toDateString() === new Date().toDateString()
  );

  const successfulCalls = callLogs.filter(call => 
    call.call_outcome === 'payment_confirmed' || call.call_outcome === 'interested'
  );

  const handleCreateCallLog = async (callData) => {
    try {
      const { error } = await supabase
        .from('call_logs')
        .insert({
          ...callData,
          caller_id: user.id,
          call_purpose: 'pending_payment_follow_up'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Call log created successfully"
      });

      refetch();
      setCallLogModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create call log",
        variant: "destructive"
      });
    }
  };

  const stats = [
    {
      title: "Today's Calls",
      value: todaysCalls.length,
      icon: Phone,
      trend: { value: 12, label: "from yesterday" }
    },
    {
      title: "Successful Collections",
      value: successfulCalls.length,
      icon: TrendingUp,
      trend: { value: 8, label: "this week" }
    },
    {
      title: "Pending Follow-ups",
      value: callLogs.filter(call => call.follow_up_date && new Date(call.follow_up_date) <= new Date()).length,
      icon: AlertCircle,
      trend: { value: 5, label: "due today" }
    },
    {
      title: "Total Contacts",
      value: new Set(callLogs.map(call => call.contact_id)).size,
      icon: PhoneCall,
      trend: { value: 3, label: "new this week" }
    }
  ];

  return (
    <>
      <CallLogModal
        open={callLogModalOpen}
        onOpenChange={setCallLogModalOpen}
        onSubmit={handleCreateCallLog}
        callPurpose="payment_follow_up"
      />

      <DashboardSidebar
        userRole="pending_payments_caller"
        userName={user?.email || "Payments Caller"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <PageHeader
              title="Payments Caller Dashboard"
              description="Manage pending payment collections and follow-ups"
              breadcrumbs={[
                { label: "Dashboard", active: true }
              ]}
              actions={
                <Button onClick={() => setCallLogModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
              }
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

            {/* Recent Calls */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payment Calls</CardTitle>
                <CardDescription>Latest payment collection attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPaymentCalls.slice(0, 5).map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{call.call_purpose}</p>
                        <p className="text-sm text-muted-foreground">
                          Contact ID: {call.contact_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(call.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          call.call_outcome === 'payment_confirmed' ? 'default' :
                          call.call_outcome === 'interested' ? 'secondary' :
                          'outline'
                        }>
                          {call.call_outcome || 'No outcome'}
                        </Badge>
                        {call.call_duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {call.call_duration}min
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calls Tab */}
        {activeTab === "calls" && (
          <div className="space-y-6">
            <PageHeader
              title="Call Management"
              description="View and manage all payment-related calls"
              breadcrumbs={[
                { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
                { label: "Calls", active: true }
              ]}
              actions={
                <Button onClick={() => setCallLogModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
              }
            />

            <ResponsiveTable
              data={pendingPaymentCalls}
              columns={[
                {
                  key: 'contact_id',
                  title: 'Contact',
                  render: (value) => (
                    <div>
                      <p className="font-medium">Contact {value.slice(-8)}</p>
                    </div>
                  )
                },
                {
                  key: 'call_purpose',
                  title: 'Purpose',
                  render: (value) => (
                    <Badge variant="outline">{value}</Badge>
                  )
                },
                {
                  key: 'call_outcome',
                  title: 'Outcome',
                  render: (value) => (
                    <Badge variant={
                      value === 'payment_confirmed' ? 'default' :
                      value === 'interested' ? 'secondary' :
                      'outline'
                    }>
                      {value || 'Pending'}
                    </Badge>
                  )
                },
                {
                  key: 'created_at',
                  title: 'Date',
                  mobileHidden: true,
                  render: (value) => new Date(value).toLocaleDateString()
                }
              ]}
              searchPlaceholder="Search calls..."
              loading={loading}
            />
          </div>
        )}
      </DashboardSidebar>
    </>
  );
};

export default PaymentsCallerDashboard;