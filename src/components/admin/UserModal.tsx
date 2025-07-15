import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/hooks/useAdminData";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userData: {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'merchant' | 'student' | 'telemarketing_executive' | 'pending_payments_caller' | 'customer_care_executive' | 'settlement_manager' | 'general_administrator';
    phone?: string;
    department?: string;
    employee_id?: string;
  }) => void;
  user?: UserProfile | null;
  isEdit?: boolean;
  loading?: boolean;
}

export const UserModal = ({ open, onOpenChange, onSubmit, user, loading, isEdit = false }: UserModalProps) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    full_name: user?.full_name || '',
    role: (user?.role as any) || 'student',
    phone: user?.phone || '',
    department: '',
    employee_id: '',
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '',
        full_name: user.full_name || '',
        role: user.role as any || 'student',
        phone: user.phone || '',
        department: '',
        employee_id: '',
      });
    } else {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        phone: '',
        department: '',
        employee_id: '',
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'student',
      phone: '',
      department: '',
      employee_id: '',
    });
    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="telemarketing_executive">Telemarketing Executive</SelectItem>
                <SelectItem value="pending_payments_caller">Payments Caller</SelectItem>
                <SelectItem value="customer_care_executive">Customer Care Executive</SelectItem>
                <SelectItem value="settlement_manager">Settlement Manager</SelectItem>
                <SelectItem value="general_administrator">General Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          {/* Show additional fields for operational roles */}
          {['telemarketing_executive', 'pending_payments_caller', 'customer_care_executive', 'settlement_manager', 'general_administrator'].includes(formData.role) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="department">Department (Optional)</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="e.g., Sales, Operations, Finance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID (Optional)</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleChange('employee_id', e.target.value)}
                  placeholder="e.g., EMP001"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};