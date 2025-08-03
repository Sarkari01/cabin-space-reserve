import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building, MapPin, Users, DollarSign, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { usePrivateHalls } from '@/hooks/usePrivateHalls';
import { PrivateHallCreationModal } from '@/components/PrivateHallCreationModal';
import { PrivateHallDetailModal } from '@/components/PrivateHallDetailModal';
import { toast } from 'sonner';
import type { PrivateHall } from '@/types/PrivateHall';

export const AdminPrivateHallsTab: React.FC = () => {
  const { privateHalls, loading, deletePrivateHall } = usePrivateHalls();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHall, setSelectedHall] = useState<PrivateHall | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filteredHalls = privateHalls.filter(hall =>
    hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hall.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (hall: PrivateHall) => {
    if (window.confirm(`Are you sure you want to delete "${hall.name}"?`)) {
      await deletePrivateHall(hall.id);
    }
  };

  const handleView = (hall: PrivateHall) => {
    setSelectedHall(hall);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Private Halls Management</h2>
          <p className="text-muted-foreground">Manage all private halls in the system</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Private Hall
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search private halls..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Halls</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{privateHalls.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Halls</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {privateHalls.filter(h => h.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cabins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {privateHalls.reduce((sum, hall) => sum + hall.cabin_count, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{privateHalls.reduce((sum, hall) => sum + hall.total_revenue, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Private Halls List */}
      {filteredHalls.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Private Halls Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No halls match your search criteria.' : 'Get started by creating your first private hall.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create Private Hall
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHalls.map((hall) => (
            <Card key={hall.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{hall.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {hall.location}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(hall.status)}>
                    {hall.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{hall.cabin_count} cabins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>₹{hall.monthly_price}/month</span>
                  </div>
                </div>

                {hall.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {hall.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(hall)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(hall)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <PrivateHallCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <PrivateHallDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        privateHall={selectedHall}
      />
    </div>
  );
};