import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, Search, FileText, MoreHorizontal } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { LoadingSpinner } from "@/components/ui/loading";
import { usePolicyPages, useCreatePolicyPage, useUpdatePolicyPage, useDeletePolicyPage, useTogglePublishPolicyPage } from "@/hooks/usePolicyPages";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type PolicyPage = Tables<"policy_pages">;

interface PolicyPageFormData {
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  is_published: boolean;
}

const policyTemplates = {
  "privacy-policy": {
    title: "Privacy Policy",
    content: `<h1>Privacy Policy</h1>
<p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>

<h2>3. Information Sharing</h2>
<p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>

<h2>4. Data Security</h2>
<p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>5. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at [CONTACT_EMAIL].</p>`
  },
  "terms-conditions": {
    title: "Terms and Conditions",
    content: `<h1>Terms and Conditions</h1>
<p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing and using our service, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h2>2. Service Description</h2>
<p>Our platform provides study hall booking and management services for students and merchants.</p>

<h2>3. User Accounts</h2>
<p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account.</p>

<h2>4. Booking Terms</h2>
<p>All bookings are subject to availability and confirmation. Payment is required to confirm your booking.</p>

<h2>5. Cancellation Policy</h2>
<p>Cancellations must be made according to our cancellation policy. Refunds may be subject to processing fees.</p>`
  },
  "cookie-policy": {
    title: "Cookie Policy",
    content: `<h1>Cookie Policy</h1>
<p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>

<h2>1. What Are Cookies</h2>
<p>Cookies are small text files that are stored on your device when you visit our website.</p>

<h2>2. How We Use Cookies</h2>
<p>We use cookies to enhance your experience, remember your preferences, and analyze website traffic.</p>

<h2>3. Types of Cookies We Use</h2>
<ul>
<li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
<li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
<li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
</ul>

<h2>4. Managing Cookies</h2>
<p>You can control and delete cookies through your browser settings.</p>`
  },
  "refund-policy": {
    title: "Refund Policy",
    content: `<h1>Refund Policy</h1>
<p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>

<h2>1. Refund Eligibility</h2>
<p>Refunds may be available under certain circumstances as outlined in this policy.</p>

<h2>2. Cancellation Timeframes</h2>
<p>Different cancellation timeframes apply depending on when you cancel your booking.</p>

<h2>3. Processing Time</h2>
<p>Approved refunds will be processed within 5-7 business days.</p>

<h2>4. Contact Us</h2>
<p>For refund requests, please contact our support team.</p>`
  }
};

export function PolicyPagesTab() {
  const { user } = useAuth();
  const { data: policyPages, isLoading } = usePolicyPages();
  const createPolicyPage = useCreatePolicyPage();
  const updatePolicyPage = useUpdatePolicyPage();
  const deletePolicyPage = useDeletePolicyPage();
  const togglePublish = useTogglePublishPolicyPage();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PolicyPage | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formData, setFormData] = useState<PolicyPageFormData>({
    title: "",
    slug: "",
    content: "",
    meta_description: "",
    is_published: false
  });

  const filteredPages = policyPages?.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      meta_description: "",
      is_published: false
    });
    setSelectedTemplate("");
    setEditingPage(null);
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = policyTemplates[templateKey as keyof typeof policyTemplates];
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        slug: templateKey,
        content: template.content
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Title and content are required");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      if (editingPage) {
        await updatePolicyPage.mutateAsync({
          id: editingPage.id,
          data: {
            title: formData.title,
            slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            content: formData.content,
            meta_description: formData.meta_description,
            is_published: formData.is_published
          }
        });
      } else {
        await createPolicyPage.mutateAsync({
          title: formData.title,
          slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          content: formData.content,
          meta_description: formData.meta_description,
          is_published: formData.is_published,
          created_by: user.id
        });
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving policy page:", error);
    }
  };

  const handleEdit = (page: PolicyPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      meta_description: page.meta_description || "",
      is_published: page.is_published
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePolicyPage.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting policy page:", error);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await togglePublish.mutateAsync({
        id,
        isPublished: !currentStatus
      });
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  const columns = [
    {
      key: "title",
      title: "Title",
      render: (value: any, page: PolicyPage) => (
        <div>
          <div className="font-medium">{page.title}</div>
          <div className="text-sm text-muted-foreground">/{page.slug}</div>
        </div>
      )
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, page: PolicyPage) => (
        <Badge variant={page.is_published ? "default" : "secondary"}>
          {page.is_published ? "Published" : "Draft"}
        </Badge>
      )
    },
    {
      key: "version",
      title: "Version",
      render: (value: any, page: PolicyPage) => `v${page.version}`
    },
    {
      key: "updated_at",
      title: "Last Updated",
      render: (value: any, page: PolicyPage) => new Date(page.updated_at).toLocaleDateString()
    }
  ];

  const renderActions = (page: PolicyPage) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(`/policies/${page.slug}`, '_blank')}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEdit(page)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleTogglePublish(page.id, page.is_published)}
        disabled={togglePublish.isPending}
      >
        {page.is_published ? "Unpublish" : "Publish"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleEdit(page)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => window.open(`/policies/${page.slug}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the policy page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(page.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Policy Pages</h2>
          <p className="text-muted-foreground">
            Manage privacy policy, terms of service, and other legal pages
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? "Edit Policy Page" : "Create New Policy Page"}
              </DialogTitle>
              <DialogDescription>
                Create or edit legal pages that will be displayed on your website.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {!editingPage && (
                <div className="space-y-2">
                  <Label>Use Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={(value) => {
                    setSelectedTemplate(value);
                    handleTemplateSelect(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="privacy-policy">Privacy Policy</SelectItem>
                      <SelectItem value="terms-conditions">Terms & Conditions</SelectItem>
                      <SelectItem value="cookie-policy">Cookie Policy</SelectItem>
                      <SelectItem value="refund-policy">Refund Policy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Privacy Policy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., privacy-policy"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description (SEO)</Label>
                <Input
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Brief description for search engines"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your policy content here..."
                  className="min-h-[300px]"
                />
                <p className="text-sm text-muted-foreground">
                  You can use HTML tags for formatting.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="is_published">Publish immediately</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createPolicyPage.isPending || updatePolicyPage.isPending}
              >
                {createPolicyPage.isPending || updatePolicyPage.isPending ? (
                  <LoadingSpinner className="mr-2" />
                ) : null}
                {editingPage ? "Update" : "Create"} Policy Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policy pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {policyPages?.length || 0}</span>
          <span>Published: {policyPages?.filter(p => p.is_published).length || 0}</span>
          <span>Drafts: {policyPages?.filter(p => !p.is_published).length || 0}</span>
        </div>
      </div>

      {/* Policy Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPages.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No policy pages found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No pages match your search." : "Get started by creating your first policy page."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Policy Page
                </Button>
              )}
            </div>
          ) : (
            <ResponsiveTable
              data={filteredPages}
              columns={columns}
              actions={renderActions}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}