import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIncharges } from '@/hooks/useIncharges';
import { useStudyHalls } from '@/hooks/useStudyHalls';
import { usePrivateHalls } from '@/hooks/usePrivateHalls';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

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
  // NEW: private halls
  assigned_private_halls: string[];
  permissions: {
    view_bookings: boolean;
    manage_bookings: boolean;
    view_transactions: boolean;
  };
  status: string;
  auth_method: 'invitation' | 'password';
  password: string;
  confirm_password: string;
}

export const InchargeModal: React.FC<InchargeModalProps> = ({
  isOpen,
  onClose,
  incharge
}) => {
  const { createIncharge, createInchargeWithPassword, updateIncharge, updateInchargePassword } = useIncharges();
  const { studyHalls } = useStudyHalls();
  const { privateHalls } = usePrivateHalls();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [formData, setFormData] = useState<FormData>({
    email: '',
    full_name: '',
    mobile: '',
    assigned_study_halls: [],
    assigned_private_halls: [],
    permissions: {
      view_bookings: true,
      manage_bookings: true,
      view_transactions: true
    },
    status: 'active',
    auth_method: 'invitation',
    password: '',
    confirm_password: ''
  });

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long`;
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  useEffect(() => {
    if (incharge) {
      setFormData({
        email: incharge.email,
        full_name: incharge.full_name,
        mobile: incharge.mobile,
        assigned_study_halls: Array.isArray(incharge.assigned_study_halls) 
          ? (incharge.assigned_study_halls as string[])
          : [],
        assigned_private_halls: Array.isArray((incharge as any).assigned_private_halls)
          ? ((incharge as any).assigned_private_halls as string[])
          : [],
        permissions: {
          view_bookings: (incharge.permissions as any)?.view_bookings ?? true,
          manage_bookings: (incharge.permissions as any)?.manage_bookings ?? true,
          view_transactions: (incharge.permissions as any)?.view_transactions ?? true
        },
        status: incharge.status,
        auth_method: (incharge as any).auth_method || 'invitation',
        password: '',
        confirm_password: ''
      });
    } else {
      setFormData({
        email: '',
        full_name: '',
        mobile: '',
        assigned_study_halls: [],
        assigned_private_halls: [],
        permissions: {
          view_bookings: true,
          manage_bookings: true,
          view_transactions: true
        },
        status: 'active',
        auth_method: 'invitation',
        password: '',
        confirm_password: ''
      });
    }
  }, [incharge, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.email || !formData.full_name || !formData.mobile) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Validate password if using password method
      if (!incharge && formData.auth_method === 'password') {
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          toast({
            title: "Error",
            description: passwordError,
            variant: "destructive",
          });
          return;
        }

        if (formData.password !== formData.confirm_password) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          return;
        }
      }

      let success = false;

      if (incharge) {
        // Update existing incharge
        success = await updateIncharge(incharge.id, {
          email: formData.email,
          full_name: formData.full_name,
          mobile: formData.mobile,
          assigned_study_halls: formData.assigned_study_halls,
          assigned_private_halls: formData.assigned_private_halls,
          permissions: formData.permissions,
          status: formData.status
        } as any);
      } else {
        // Create new incharge
        if (formData.auth_method === 'password') {
          success = await createInchargeWithPassword({
            email: formData.email,
            full_name: formData.full_name,
            mobile: formData.mobile,
            assigned_study_halls: formData.assigned_study_halls,
            assigned_private_halls: formData.assigned_private_halls,
            permissions: formData.permissions,
            password: formData.password,
            auth_method: 'password'
          });
        } else {
          success = await createIncharge({
            email: formData.email,
            full_name: formData.full_name,
            mobile: formData.mobile,
            assigned_study_halls: formData.assigned_study_halls,
            assigned_private_halls: formData.assigned_private_halls,
            permissions: formData.permissions
          });
        }
      }

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!incharge) return;

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: "Error",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    const success = await updateInchargePassword(incharge.id, newPassword);
    if (success) {
      setShowPasswordChangeDialog(false);
      setNewPassword('');
      setConfirmNewPassword('');
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

  const handlePrivateHallToggle = (privateHallId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assigned_private_halls: checked
        ? [...prev.assigned_private_halls, privateHallId]
        : prev.assigned_private_halls.filter(id => id !== privateHallId)
    }));
  };

  const handlePermissionToggle = (
    permission: keyof FormData['permissions'],
    checked: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked,
      },
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

          {/* Private Hall Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Private Hall Assignment</h3>
            <div className="space-y-2">
              {privateHalls.map((ph) => (
                <div key={ph.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ph-${ph.id}`}
                    checked={formData.assigned_private_halls.includes(ph.id)}
                    onCheckedChange={(checked) => handlePrivateHallToggle(ph.id, checked as boolean)}
                  />
                  <Label htmlFor={`ph-${ph.id}`} className="flex-1">
                    {ph.name} - {ph.location}
                  </Label>
                </div>
              ))}
              {privateHalls.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No private halls available. Create a private hall first to assign to incharges.
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
              
            </div>
          </div>

          {/* Authentication Method (only for new incharge) */}
          {!incharge && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Authentication Method</h3>
              <RadioGroup
                value={formData.auth_method}
                onValueChange={(value: 'invitation' | 'password') => 
                  setFormData(prev => ({ ...prev, auth_method: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="invitation" id="invitation" />
                  <Label htmlFor="invitation" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Send Email Invitation
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="password" id="password" />
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Set Password Directly
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Password Fields (only for new incharge with password method) */}
          {!incharge && formData.auth_method === 'password' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Password Change Button (only for existing incharge) */}
          {incharge && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordChangeDialog(true)}
                className="flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </Button>
              {(incharge as any).password_last_changed && (
                <span className="text-sm text-muted-foreground">
                  Last changed: {new Date((incharge as any).password_last_changed).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

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

      {/* Password Change Dialog */}
      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm_new_password">Confirm New Password</Label>
              <Input
                id="confirm_new_password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordChangeDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordChange}>
                Update Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
