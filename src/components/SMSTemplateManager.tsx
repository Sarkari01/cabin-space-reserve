import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Edit, Save, X } from 'lucide-react';

interface SMSTemplate {
  id: string;
  purpose: string;
  template_name: string;
  message_template: string;
  template_id: string | null;
  variables: any; // JSON array from database
  is_active: boolean;
}

export const SMSTemplateManager = () => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    template_name: '',
    message_template: '',
    template_id: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('purpose');

      if (error) throw error;
      
      // Transform the data to ensure variables is an array
      const transformedData = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) 
          ? template.variables 
          : typeof template.variables === 'string' 
            ? JSON.parse(template.variables || '[]')
            : []
      }));
      
      setTemplates(transformedData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingId(template.id);
    setEditForm({
      template_name: template.template_name,
      message_template: template.message_template,
      template_id: template.template_id || '',
      is_active: template.is_active
    });
  };

  const handleSave = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .update({
          template_name: editForm.template_name,
          message_template: editForm.message_template,
          template_id: editForm.template_id || null,
          is_active: editForm.is_active
        })
        .eq('id', templateId);

      if (error) throw error;

      await fetchTemplates();
      setEditingId(null);
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({
      template_name: '',
      message_template: '',
      template_id: '',
      is_active: true
    });
  };

  const formatPurpose = (purpose: string) => {
    return purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Template Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Template Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{formatPurpose(template.purpose)}</h3>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {template.template_id && (
                    <Badge variant="outline" className="text-xs">
                      ID: {template.template_id}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingId === template.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSave(template.id)}
                        className="h-8"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(template)}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {editingId === template.id ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`name-${template.id}`}>Template Name</Label>
                    <Input
                      id={`name-${template.id}`}
                      value={editForm.template_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, template_name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`template-id-${template.id}`}>Template ID (Optional)</Label>
                    <Input
                      id={`template-id-${template.id}`}
                      value={editForm.template_id}
                      onChange={(e) => setEditForm(prev => ({ ...prev, template_id: e.target.value }))}
                      placeholder="Leave empty to use default message"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`message-${template.id}`}>Message Template</Label>
                    <Textarea
                      id={`message-${template.id}`}
                      value={editForm.message_template}
                      onChange={(e) => setEditForm(prev => ({ ...prev, message_template: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`active-${template.id}`}
                      checked={editForm.is_active}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor={`active-${template.id}`}>Active</Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Template Name: </span>
                    <span className="text-sm">{template.template_name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Message: </span>
                    <span className="text-sm text-muted-foreground">{template.message_template}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Variables: </span>
                    <span className="text-sm">
                      {(template.variables || []).map((variable: string, index: number) => (
                        <Badge key={index} variant="outline" className="mr-1 text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};