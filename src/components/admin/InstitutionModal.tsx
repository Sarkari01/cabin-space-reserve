import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Institution {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface InstitutionModalProps {
  institution?: Institution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function InstitutionModal({ 
  institution,
  open, 
  onOpenChange,
  mode,
  onSuccess
}: InstitutionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    password: '',
  });

  useEffect(() => {
    if (mode === 'edit' && institution) {
      setFormData({
        name: institution.name || '',
        email: institution.email || '',
        phone: institution.phone || '',
        address: institution.address || '',
        website: institution.website || '',
        description: institution.description || '',
        password: '',
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        description: '',
        password: '',
      });
    }
  }, [mode, institution, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        // First create the auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            full_name: formData.name,
            role: 'institution'
          }
        });

        if (authError) throw authError;

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.name,
            role: 'institution',
            phone: formData.phone
          });

        if (profileError) throw profileError;

        // Create institution record
        const { error: institutionError } = await supabase
          .from('institutions')
          .insert({
            user_id: authData.user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            website: formData.website,
            description: formData.description
          });

        if (institutionError) throw institutionError;

        toast({
          title: "Success",
          description: "Institution created successfully.",
        });
      } else {
        // Update institution
        const { error } = await supabase
          .from('institutions')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            website: formData.website,
            description: formData.description
          })
          .eq('id', institution!.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Institution updated successfully.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving institution:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save institution.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Institution' : 'Edit Institution'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Institution Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === 'create' ? 'Create Institution' : 'Update Institution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}