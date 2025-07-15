import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncharges } from '@/hooks/useIncharges';
import { useStudyHalls } from '@/hooks/useStudyHalls';
import { Tables } from '@/integrations/supabase/types';

type Incharge = Tables<'incharges'>;

interface InchargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  incharge?: Incharge | null;
}

interface FormData {
  email: string;
  full_name: string;
  mobile: string;
  assigned_study_halls: string[];
  permissions: {
    view_bookings: boolean;
    manage_bookings: boolean;
    view_transactions: boolean;
    export_data: boolean;
  };
  status: string;
}

export const InchargeModal = ({ isOpen, onClose, incharge }: InchargeModalProps) => {
  const { createIncharge, updateIncharge } = useIncharges();
  const { studyHalls } = useStudyHalls();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    full_name: '',
    mobile: '',
    assigned_study_halls: [],
    permissions: {
      view_bookings: true,
      manage_bookings: true,
      view_transactions: true,
      export_data: false,
    },
    status: 'active'
  });

  useEffect(() => {
    if (incharge) {
      setFormData({
        email: incharge.email || '',
        full_name: incharge.full_name || '',
        mobile: incharge.mobile || '',
        assigned_study_halls: Array.isArray(incharge.assigned_study_halls) ? incharge.assigned_study_halls as string[] : [],
        permissions: {
          view_bookings: (incharge.permissions as any)?.view_bookings ?? true,
          manage_bookings: (incharge.permissions as any)?.manage_bookings ?? true,
          view_transactions: (incharge.permissions as any)?.view_transactions ?? true,
          export_data: (incharge.permissions as any)?.export_data ?? false,
        },
        status: incharge.status || 'active'
      });
    } else {
      setFormData({
        email: '',
        full_name: '',
        mobile: '',
        assigned_study_halls: [],
        permissions: {
          view_bookings: true,
          manage_bookings: true,
          view_transactions: true,
          export_data: false,
        },
        status: 'active'
      });
    }
  }, [incharge, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (incharge) {
        await updateIncharge(incharge.id, {
          full_name: formData.full_name,
          mobile: formData.mobile,
          assigned_study_halls: formData.assigned_study_halls,
          permissions: formData.permissions,
          status: formData.status
        });
      } else {
        await createIncharge({
          email: formData.email,
          full_name: formData.full_name,
          mobile: formData.mobile,
          assigned_study_halls: formData.assigned_study_halls,
          permissions: formData.permissions
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving incharge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudyHallToggle = (studyHallId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assigned_study_halls: checked
        ? [...prev.assigned_study_halls, studyHallId]
        : prev.assigned_study_halls.filter(id => id !== studyHallId)
    }));
  };

  const handlePermissionToggle = (permission: keyof FormData['permissions'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {incharge ? 'Edit Incharge' : 'Create New Incharge'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                  disabled={!!incharge} // Can't change email after creation
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              {incharge && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Study Hall Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Study Hall Assignment</h3>
            <div className="space-y-2">
              {studyHalls.map((hall) => (
                <div key={hall.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={hall.id}
                    checked={formData.assigned_study_halls.includes(hall.id)}
                    onCheckedChange={(checked) => handleStudyHallToggle(hall.id, checked as boolean)}
                  />
                  <Label htmlFor={hall.id} className="flex-1">
                    {hall.name} - {hall.location}
                  </Label>
                </div>
              ))}
              {studyHalls.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No study halls available. Create a study hall first to assign to incharges.
                </p>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Permissions</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="view_bookings"
                  checked={formData.permissions.view_bookings}
                  onCheckedChange={(checked) => handlePermissionToggle('view_bookings', checked as boolean)}
                />
                <Label htmlFor="view_bookings">View Bookings</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manage_bookings"
                  checked={formData.permissions.manage_bookings}
                  onCheckedChange={(checked) => handlePermissionToggle('manage_bookings', checked as boolean)}
                />
                <Label htmlFor="manage_bookings">Manage Bookings (confirm, cancel, check-in/out)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="view_transactions"
                  checked={formData.permissions.view_transactions}
                  onCheckedChange={(checked) => handlePermissionToggle('view_transactions', checked as boolean)}
                />
                <Label htmlFor="view_transactions">View Transactions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export_data"
                  checked={formData.permissions.export_data}
                  onCheckedChange={(checked) => handlePermissionToggle('export_data', checked as boolean)}
                />
                <Label htmlFor="export_data">Export Data</Label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (incharge ? 'Update Incharge' : 'Create Incharge')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};