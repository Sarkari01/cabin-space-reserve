import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIncharges } from '@/hooks/useIncharges';
import { useAdminData } from '@/hooks/useAdminData';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { User, Mail, Phone, MapPin, Eye, Ban, CheckCircle, Search, Building } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AdminInchargeDetailModal } from './AdminInchargeDetailModal';

export const InchargesTab = () => {
  const { incharges, loading, suspendIncharge, activateIncharge } = useIncharges();
  const { merchants, studyHalls } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIncharge, setSelectedIncharge] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const filteredIncharges = incharges.filter(incharge =>
    incharge.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incharge.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incharge.mobile.includes(searchTerm)
  );

  const getMerchantName = (merchantId: string) => {
    const merchant = merchants.find(m => m.id === merchantId);
    return merchant?.full_name || 'Unknown Merchant';
  };

  const getAssignedHallNames = (assignedHalls: any) => {
    if (!Array.isArray(assignedHalls) || assignedHalls.length === 0) {
      return 'No study halls assigned';
    }
    
    const names = assignedHalls.map((hallId: string) => {
      const hall = studyHalls.find(h => h.id === hallId);
      return hall?.name || 'Unknown Hall';
    });
    
    return names.join(', ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'suspended':
        return 'bg-destructive text-destructive-foreground';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewDetails = (incharge: any) => {
    setSelectedIncharge(incharge);
    setDetailModalOpen(true);
  };

  const handleStatusToggle = async (inchargeId: string, currentStatus: string) => {
    if (currentStatus === 'active') {
      await suspendIncharge(inchargeId);
    } else {
      await activateIncharge(inchargeId);
    }
  };

  const tableColumns = [
    {
      key: "full_name",
      title: "Name",
      render: (value: any, incharge: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{incharge.full_name}</div>
            <div className="text-sm text-muted-foreground">{incharge.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "merchant",
      title: "Merchant",
      render: (value: any, incharge: any) => (
        <div className="text-sm">
          {getMerchantName(incharge.merchant_id)}
        </div>
      )
    },
    {
      key: "mobile",
      title: "Contact",
      render: (value: any, incharge: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Phone className="h-3 w-3 mr-1" />
            {incharge.mobile}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="h-3 w-3 mr-1" />
            {incharge.email}
          </div>
        </div>
      )
    },
    {
      key: "assigned_study_halls",
      title: "Assigned Study Halls",
      render: (value: any, incharge: any) => (
        <div className="flex items-start text-sm">
          <Building className="h-3 w-3 mr-1 mt-1 flex-shrink-0" />
          <span className="line-clamp-2">
            {getAssignedHallNames(incharge.assigned_study_halls)}
          </span>
        </div>
      )
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, incharge: any) => (
        <div className="space-y-2">
          <Badge className={`${getStatusColor(incharge.status)} text-xs`}>
            {incharge.status}
          </Badge>
          {!incharge.account_activated && (
            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Invitation pending
            </div>
          )}
        </div>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, incharge: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(incharge)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {incharge.status === 'active' ? (
                  <Ban className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {incharge.status === 'active' ? 'Suspend' : 'Activate'} Incharge
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {incharge.status === 'active' ? 'suspend' : 'activate'} {incharge.full_name}? 
                  {incharge.status === 'active' ? ' This will prevent them from accessing their dashboard.' : ' This will restore their access.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusToggle(incharge.id, incharge.status)}
                  className={incharge.status === 'active' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                >
                  {incharge.status === 'active' ? 'Suspend' : 'Activate'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incharge Management"
        description="Manage all incharges across the platform"
        breadcrumbs={[
          { label: "Dashboard", href: "#", onClick: () => {} },
          { label: "Incharge Management", active: true }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incharges</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incharges.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incharges</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {incharges.filter(i => i.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {incharges.filter(i => i.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Mail className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {incharges.filter(i => !i.account_activated).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Incharges</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search incharges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredIncharges}
            columns={tableColumns}
            loading={loading}
            emptyMessage="No incharges found"
          />
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedIncharge && (
        <AdminInchargeDetailModal
          incharge={selectedIncharge}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          merchantName={getMerchantName(selectedIncharge.merchant_id)}
          assignedHallNames={getAssignedHallNames(selectedIncharge.assigned_study_halls)}
        />
      )}
    </div>
  );
};