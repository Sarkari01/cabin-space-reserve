import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserProfile } from "@/hooks/useAdminData";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userData: {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'merchant' | 'student' | 'telemarketing_executive';
    phone?: string;
    department?: string;
    employee_id?: string;
    permissions?: {
      merchant_onboarding?: boolean;
      payment_recovery?: boolean;
      customer_support?: boolean;
      settlement_management?: boolean;
    };
  }) => void;
  user?: UserProfile | null;
  isEdit?: boolean;
  loading?: boolean;
}

const functionalAreas = [
  { key: 'merchant_onboarding', label: 'Merchant Onboarding', description: 'Call and onboard merchants' },
  { key: 'payment_recovery', label: 'Payment Recovery', description: 'Call users with unpaid bookings' },
  { key: 'customer_support', label: 'Customer Support', description: 'Handle support tickets and queries' },
  { key: 'settlement_management', label: 'Settlement Management', description: 'Process merchant settlements' },
];

export const UserModal = ({ open, onOpenChange, onSubmit, user, loading, isEdit = false }: UserModalProps) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    full_name: user?.full_name || '',
    role: (user?.role as any) || 'student',
    phone: user?.phone || '',
    department: '',
    employee_id: '',
    permissions: {
      merchant_onboarding: true,
      payment_recovery: true,
      customer_support: true,
      settlement_management: true,
    },
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
        permissions: {
          merchant_onboarding: true,
          payment_recovery: true,
          customer_support: true,
          settlement_management: true,
        },
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
        permissions: {
          merchant_onboarding: true,
          payment_recovery: true,
          customer_support: true,
          settlement_management: true,
        },
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
      permissions: {
        merchant_onboarding: true,
        payment_recovery: true,
        customer_support: true,
        settlement_management: true,
      },
    });
    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
      }
    }));
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

          {/* Show additional fields for telemarketing executives */}
          {formData.role === 'telemarketing_executive' && (
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

              {/* Functional Areas Permissions */}
              <div className="space-y-3">
                <Label>Functional Areas (Select capabilities for this telemarketing executive)</Label>
                <div className="space-y-3">
                  {functionalAreas.map((area) => (
                    <div key={area.key} className="flex items-start space-x-3">
                      <Checkbox
                        id={area.key}
                        checked={formData.permissions[area.key as keyof typeof formData.permissions]}
                        onCheckedChange={(checked) => handlePermissionChange(area.key, !!checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={area.key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {area.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {area.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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