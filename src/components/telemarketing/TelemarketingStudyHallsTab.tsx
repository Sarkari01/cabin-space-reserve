import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminData } from '@/hooks/useAdminData';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { Building, MapPin, User, Search, Eye, Calendar, DollarSign } from 'lucide-react';
import { StudyHallDetailModal } from '@/components/StudyHallDetailModal';

export const TelemarketingStudyHallsTab = () => {
  const { studyHalls, merchants, loading } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudyHall, setSelectedStudyHall] = useState<any>(null);
  const [studyHallDetailOpen, setStudyHallDetailOpen] = useState(false);

  const filteredStudyHalls = studyHalls.filter(hall => {
    const matchesSearch = 
      hall.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hall.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hall.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || hall.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getMerchantName = (merchantId: string) => {
    const merchant = merchants.find(m => m.id === merchantId);
    return merchant?.full_name || 'Unknown Merchant';
  };

  const handleViewStudyHall = (studyHall: any) => {
    setSelectedStudyHall(studyHall);
    setStudyHallDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      pending: 'outline',
      suspended: 'destructive'
    };
    return variants[status] || 'outline';
  };

  const studyHallColumns = [
    {
      title: 'Study Hall',
      key: 'study_hall',
      render: (_: any, hall: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Building className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{hall?.name || 'N/A'}</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {hall?.location || 'No location'}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Merchant',
      key: 'merchant',
      render: (_: any, hall: any) => (
        <div className="flex items-center text-sm">
          <User className="h-3 w-3 mr-1" />
          {getMerchantName(hall?.merchant_id)}
        </div>
      )
    },
    {
      title: 'Pricing',
      key: 'pricing',
      render: (_: any, hall: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <DollarSign className="h-3 w-3 mr-1" />
            ₹{hall?.daily_price || 0}/day
          </div>
          <div className="text-xs text-muted-foreground">
            ₹{hall?.weekly_price || 0}/week | ₹{hall?.monthly_price || 0}/month
          </div>
        </div>
      )
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_: any, hall: any) => (
        <div className="text-sm text-center">
          <div className="font-medium">{hall?.total_seats || 0} seats</div>
          <div className="text-xs text-muted-foreground">
            {hall?.rows || 0} rows × {hall?.seats_per_row || 0}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, hall: any) => (
        <Badge variant={getStatusBadge(hall?.status || '')}>
          {hall?.status || 'Unknown'}
        </Badge>
      )
    },
    {
      title: 'Created',
      key: 'created_at',
      render: (_: any, hall: any) => (
        <div className="flex items-center text-sm">
          <Calendar className="h-3 w-3 mr-1" />
          {hall?.created_at ? new Date(hall.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, hall: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewStudyHall(hall)}
          disabled={!hall}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Halls Management"
        description="View and monitor all study halls"
        breadcrumbs={[
          { label: "Dashboard", href: "#", onClick: () => {} },
          { label: "Study Halls", active: true }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Study Halls</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyHalls.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Halls</CardTitle>
            <Building className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {studyHalls.filter(h => h.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {studyHalls.reduce((sum, hall) => sum + (hall.total_seats || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{studyHalls.length > 0 ? Math.round(studyHalls.reduce((sum, hall) => sum + (hall.daily_price || 0), 0) / studyHalls.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Study Halls</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search study halls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredStudyHalls}
            columns={studyHallColumns}
            loading={loading}
            emptyMessage="No study halls found"
          />
        </CardContent>
      </Card>

      {/* Study Hall Detail Modal */}
      {selectedStudyHall && (
        <StudyHallDetailModal
          studyHall={selectedStudyHall}
          open={studyHallDetailOpen}
          onOpenChange={setStudyHallDetailOpen}
          seats={[]}
        />
      )}
    </div>
  );
};