import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { useCallLogs } from "@/hooks/useCallLogs";
import { useToast } from "@/hooks/use-toast";
import { CallLogModal } from "@/components/CallLogModal";
import { PageHeader } from "@/components/PageHeader";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { MessageSquare, Users, Clock, AlertCircle, Search, Plus, TrendingUp, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CustomerCareDashboard = () => {
  const { user } = useAuth();
  const { tickets: supportTickets, loading: ticketsLoading, createTicket, updateTicket } = useSupportTickets();
  const { callLogs, loading: callsLoading, refetch: refetchCalls } = useCallLogs();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [callLogModalOpen, setCallLogModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filter for customer care related calls
  const customerCareCalls = callLogs.filter(call => 
    call.call_purpose.toLowerCase().includes('support') || 
    call.call_purpose.toLowerCase().includes('customer') ||
    call.call_purpose.toLowerCase().includes('inquiry')
  );

  const todaysTickets = supportTickets.filter(ticket => 
    new Date(ticket.created_at).toDateString() === new Date().toDateString()
  );

  const pendingTickets = supportTickets.filter(ticket => 
    ticket.status === 'open' || ticket.status === 'in_progress'
  );

  const resolvedTickets = supportTickets.filter(ticket => 
    ticket.status === 'resolved'
  );

  const handleCreateCallLog = async (callData) => {
    try {
      const { error } = await supabase
        .from('call_logs')
        .insert({
          ...callData,
          caller_id: user.id,
          call_purpose: 'customer_support'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Call log created successfully"
      });

      refetchCalls();
      setCallLogModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create call log",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket updated successfully"
      });

      // Refresh tickets handled by hook
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive"
      });
    }
  };

  const stats = [
    {
      title: "Today's Tickets",
      value: todaysTickets.length,
      icon: MessageSquare,
      trend: { value: 5, label: "from yesterday" }
    },
    {
      title: "Pending Tickets",
      value: pendingTickets.length,
      icon: AlertCircle,
      trend: { value: 12, label: "total pending" }
    },
    {
      title: "Resolved Today",
      value: resolvedTickets.filter(t => 
        new Date(t.resolved_at || '').toDateString() === new Date().toDateString()
      ).length,
      icon: CheckCircle,
      trend: { value: 8, label: "resolved today" }
    },
    {
      title: "Customer Calls",
      value: customerCareCalls.length,
      icon: Users,
      trend: { value: 15, label: "this week" }
    }
  ];

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <CallLogModal
        open={callLogModalOpen}
        onOpenChange={setCallLogModalOpen}
        onSubmit={handleCreateCallLog}
        callPurpose="support"
      />

      <DashboardSidebar
        userRole="customer_care_executive"
        userName={user?.email || "Customer Care"}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <PageHeader
              title="Customer Care Dashboard"
              description="Manage customer support tickets and inquiries"
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

            {/* Recent Tickets */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Support Tickets</CardTitle>
                  <CardDescription>Latest customer support requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supportTickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{ticket.title}</p>
                          <p className="text-sm text-muted-foreground">
                            #{ticket.ticket_number} • {ticket.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getTicketStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          {ticket.priority && (
                            <div className="mt-1">
                              <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                                {ticket.priority}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Customer Calls</CardTitle>
                  <CardDescription>Latest customer support calls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerCareCalls.slice(0, 5).map((call) => (
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
                            call.call_outcome === 'issue_resolved' ? 'default' :
                            call.call_outcome === 'escalated' ? 'secondary' :
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
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <PageHeader
              title="Support Tickets"
              description="Manage customer support tickets"
              breadcrumbs={[
                { label: "Dashboard", href: "#", onClick: () => setActiveTab("overview") },
                { label: "Tickets", active: true }
              ]}
            />

            <ResponsiveTable
              data={supportTickets}
              columns={[
                {
                  key: 'ticket_number',
                  title: 'Ticket #',
                  render: (value) => (
                    <div className="font-mono">#{value}</div>
                  )
                },
                {
                  key: 'title',
                  title: 'Title',
                  render: (value, ticket) => (
                    <div>
                      <p className="font-medium">{value}</p>
                      <p className="text-sm text-muted-foreground">{ticket.category}</p>
                    </div>
                  )
                },
                {
                  key: 'status',
                  title: 'Status',
                  render: (value) => (
                    <Badge variant={getTicketStatusColor(value)}>
                      {value}
                    </Badge>
                  )
                },
                {
                  key: 'priority',
                  title: 'Priority',
                  render: (value) => (
                    <Badge variant={getPriorityColor(value || 'low')}>
                      {value || 'low'}
                    </Badge>
                  )
                },
                {
                  key: 'created_at',
                  title: 'Created',
                  mobileHidden: true,
                  render: (value) => new Date(value).toLocaleDateString()
                }
              ]}
              searchPlaceholder="Search tickets..."
              loading={ticketsLoading}
              onRowClick={(ticket) => setSelectedTicket(ticket)}
            />
          </div>
        )}

        {/* Calls Tab */}
        {activeTab === "calls" && (
          <div className="space-y-6">
            <PageHeader
              title="Customer Calls"
              description="View and manage customer support calls"
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
              data={customerCareCalls}
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
                      value === 'issue_resolved' ? 'default' :
                      value === 'escalated' ? 'secondary' :
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
              loading={callsLoading}
            />
          </div>
        )}
      </DashboardSidebar>
    </>
  );
};

export default CustomerCareDashboard;