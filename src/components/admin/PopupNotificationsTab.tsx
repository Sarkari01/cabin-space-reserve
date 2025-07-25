import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { useToast } from '@/hooks/use-toast';
import { PopupImageUpload } from '@/components/PopupImageUpload';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MoreHorizontal, Plus, Eye, Edit, Trash2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

const popupNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  target_audience: z.string().min(1, 'Target audience is required'),
  schedule_time: z.string().optional(),
  button_text: z.string().optional(),
  button_url: z.string().url().optional().or(z.literal('')),
  priority: z.number().min(0).max(10),
  expires_at: z.string().optional(),
  duration_seconds: z.number().min(1).max(300),
  trigger_event: z.string().min(1, 'Trigger event is required'),
});

type PopupNotificationForm = z.infer<typeof popupNotificationSchema>;

interface PopupNotification {
  id: string;
  title: string;
  message: string;
  image_url?: string;
  target_audience: string;
  schedule_time?: string;
  button_text?: string;
  button_url?: string;
  popup_enabled: boolean;
  priority: number;
  expires_at?: string;
  shown_count: number;
  click_count: number;
  duration_seconds: number;
  trigger_event: string;
  created_at: string;
  updated_at: string;
  active: boolean;
}

const targetAudienceOptions = [
  { value: 'all_users', label: 'All Users' },
  { value: 'students', label: 'Students Only' },
  { value: 'merchants', label: 'Merchants Only' },
  { value: 'admin', label: 'Admin Only' },
  { value: 'telemarketing_executive', label: 'Telemarketing Only' },
];

const triggerEventOptions = [
  { value: 'general', label: 'General Pop-up' },
  { value: 'login', label: 'Login Event' },
  { value: 'booking_success', label: 'After Booking Success' },
  { value: 'payment_success', label: 'After Payment Success' },
];

export function PopupNotificationsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<PopupNotification | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  const form = useForm<PopupNotificationForm>({
    resolver: zodResolver(popupNotificationSchema),
    defaultValues: {
      title: '',
      message: '',
      target_audience: 'all_users',
      priority: 5,
      button_text: '',
      button_url: '',
      duration_seconds: 10,
      trigger_event: 'general',
    },
  });

  // Fetch popup notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['popup-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('popup_enabled', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PopupNotification[];
    },
  });

  // Create popup notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (data: PopupNotificationForm & { image_url?: string }) => {
      const { error } = await supabase.from('notifications').insert({
        title: data.title,
        message: data.message,
        image_url: data.image_url,
        target_audience: data.target_audience,
        schedule_time: data.schedule_time || null,
        button_text: data.button_text || null,
        button_url: data.button_url || null,
        popup_enabled: true,
        priority: data.priority,
        expires_at: data.expires_at || null,
        duration_seconds: data.duration_seconds,
        trigger_event: data.trigger_event,
        user_id: null, // System notifications for all users
        type: 'popup',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup-notifications'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 queryKey.length >= 1 && 
                 queryKey[0] === 'popup-notifications';
        }
      });
      
      toast({ title: 'Popup notification created successfully' });
      setIsCreateModalOpen(false);
      form.reset();
      setSelectedImageUrl('');
      setEditingNotification(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Error creating popup notification', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Update popup notification mutation
  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PopupNotificationForm & { image_url?: string } }) => {
      const { error } = await supabase.from('notifications').update({
        title: data.title,
        message: data.message,
        image_url: data.image_url,
        target_audience: data.target_audience,
        schedule_time: data.schedule_time || null,
        button_text: data.button_text || null,
        button_url: data.button_url || null,
        priority: data.priority,
        expires_at: data.expires_at || null,
        duration_seconds: data.duration_seconds,
        trigger_event: data.trigger_event,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup-notifications'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 queryKey.length >= 1 && 
                 queryKey[0] === 'popup-notifications';
        }
      });
      
      toast({ title: 'Popup notification updated successfully' });
      setIsCreateModalOpen(false);
      form.reset();
      setSelectedImageUrl('');
      setEditingNotification(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating popup notification', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      // Invalidate all popup notification related queries
      queryClient.invalidateQueries({ queryKey: ['popup-notifications'] });
      
      // Invalidate user-specific popup notification queries 
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 queryKey.length >= 1 && 
                 queryKey[0] === 'popup-notifications';
        }
      });
      
      // Clear session storage for the deleted notification
      const storageKeys = Object.keys(sessionStorage).filter(key => 
        key.includes(`dismissed-login-${deletedId}`) || 
        key.includes(`login-notifications`)
      );
      storageKeys.forEach(key => sessionStorage.removeItem(key));
      
      console.log('[PopupNotificationsTab] Deleted notification and cleared caches:', deletedId);
      toast({ title: 'Popup notification deleted successfully' });
    },
    onError: (error) => {
      console.error('[PopupNotificationsTab] Delete error:', error);
      toast({ 
        title: 'Error deleting popup notification', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup-notifications'] });
      toast({ title: 'Notification status updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating notification status', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Form population when editing
  useEffect(() => {
    if (editingNotification && isCreateModalOpen) {
      form.reset({
        title: editingNotification.title,
        message: editingNotification.message,
        target_audience: editingNotification.target_audience,
        priority: editingNotification.priority,
        button_text: editingNotification.button_text || '',
        button_url: editingNotification.button_url || '',
        duration_seconds: editingNotification.duration_seconds,
        trigger_event: editingNotification.trigger_event,
        schedule_time: editingNotification.schedule_time ? 
          new Date(editingNotification.schedule_time).toISOString().slice(0, 16) : '',
        expires_at: editingNotification.expires_at ? 
          new Date(editingNotification.expires_at).toISOString().slice(0, 16) : '',
      });
      setSelectedImageUrl(editingNotification.image_url || '');
    } else if (!editingNotification && isCreateModalOpen) {
      form.reset({
        title: '',
        message: '',
        target_audience: 'all_users',
        priority: 5,
        button_text: '',
        button_url: '',
        duration_seconds: 10,
        trigger_event: 'general',
      });
      setSelectedImageUrl('');
    }
  }, [editingNotification, isCreateModalOpen, form]);

  // Reset form and states when modal closes
  useEffect(() => {
    if (!isCreateModalOpen) {
      setEditingNotification(null);
      form.reset();
      setSelectedImageUrl('');
    }
  }, [isCreateModalOpen, form]);

  const onSubmit = (data: PopupNotificationForm) => {
    const submissionData = {
      ...data,
      image_url: selectedImageUrl || undefined,
    };

    if (editingNotification) {
      updateNotificationMutation.mutate({
        id: editingNotification.id,
        data: submissionData
      });
    } else {
      createNotificationMutation.mutate(submissionData);
    }
  };

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    toggleActiveMutation.mutate({ id, active: !currentActive });
  };

  const getStatusBadge = (notification: PopupNotification) => {
    const now = new Date();
    const scheduleTime = notification.schedule_time ? new Date(notification.schedule_time) : null;
    const expiresAt = notification.expires_at ? new Date(notification.expires_at) : null;

    if (!notification.active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (expiresAt && expiresAt < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (scheduleTime && scheduleTime > now) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const columns = [
    {
      key: 'image',
      title: 'Image',
      render: (value: any, notification: PopupNotification) => (
        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
          {notification.image_url ? (
            <img 
              src={notification.image_url} 
              alt="Notification" 
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="text-muted-foreground text-xs">No image</div>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      title: 'Title & Message',
      render: (value: any, notification: PopupNotification) => (
        <div>
          <div className="font-medium">{notification.title}</div>
          <div className="text-sm text-muted-foreground truncate max-w-48">
            {notification.message}
          </div>
        </div>
      ),
    },
    {
      key: 'audience',
      title: 'Audience',
      render: (value: any, notification: PopupNotification) => (
        <Badge variant="outline">
          {targetAudienceOptions.find(opt => opt.value === notification.target_audience)?.label || notification.target_audience}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, notification: PopupNotification) => getStatusBadge(notification),
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (value: any, notification: PopupNotification) => (
        <Badge variant={notification.priority >= 7 ? 'destructive' : notification.priority >= 4 ? 'default' : 'secondary'}>
          {notification.priority}
        </Badge>
      ),
    },
    {
      key: 'stats',
      title: 'Stats',
      render: (value: any, notification: PopupNotification) => (
        <div className="text-sm">
          <div>Shown: {notification.shown_count}</div>
          <div>Clicks: {notification.click_count}</div>
        </div>
      ),
    },
    {
      key: 'schedule',
      title: 'Schedule',
      render: (value: any, notification: PopupNotification) => (
        <div className="text-sm">
          {notification.schedule_time ? (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(notification.schedule_time), 'MMM dd, HH:mm')}
            </div>
          ) : (
            <span className="text-muted-foreground">Immediate</span>
          )}
          {notification.expires_at && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              Expires: {format(new Date(notification.expires_at), 'MMM dd')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, notification: PopupNotification) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingNotification(notification)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setEditingNotification(notification);
              setIsCreateModalOpen(true);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleToggleActive(notification.id, notification.active)}
              disabled={toggleActiveMutation.isPending}
            >
              {notification.active ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Popup Notification</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this popup notification? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDelete(notification.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pop-up Notifications</h2>
          <p className="text-muted-foreground">
            Create and manage pop-up notifications with images and actions
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Pop-up
        </Button>
      </div>

      <ResponsiveTable
        data={notifications}
        columns={columns}
        loading={isLoading}
        emptyMessage="No popup notifications found. Create your first popup notification to get started."
      />

      {/* Create/Edit Modal */}
      <AlertDialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingNotification ? 'Edit' : 'Create'} Pop-up Notification
            </AlertDialogTitle>
            <AlertDialogDescription>
              Create a pop-up notification with optional image and action button
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter notification title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter notification message" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Image (Optional)</label>
                <PopupImageUpload
                  onImageUploaded={setSelectedImageUrl}
                  currentImageUrl={selectedImageUrl}
                  onImageRemoved={() => setSelectedImageUrl('')}
                  disabled={createNotificationMutation.isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="target_audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {targetAudienceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority (0-10)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={10} 
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="schedule_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Time (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires At (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trigger_event"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Event *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger event" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {triggerEventOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_seconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={300} 
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Learn More" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="button_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <Button 
                  type="submit" 
                  disabled={createNotificationMutation.isPending || updateNotificationMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {editingNotification 
                    ? (updateNotificationMutation.isPending ? 'Updating...' : 'Update Pop-up')
                    : (createNotificationMutation.isPending ? 'Creating...' : 'Create Pop-up')
                  }
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}