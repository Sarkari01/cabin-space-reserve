import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Users,
  Building,
  ArrowUpDown,
  Filter,
  MoreHorizontal
} from "lucide-react";
import { useBanners, useDeleteBanner, useUpdateBanner } from "@/hooks/useBanners";
import { BannerModal } from "@/components/BannerModal";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeFormatDate } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";

export function BannersTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [previewBanner, setPreviewBanner] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const { data: banners = [], isLoading } = useBanners();
  const deleteBanner = useDeleteBanner();
  const updateBanner = useUpdateBanner();
  const { toast } = useToast();

  const handleCreateBanner = () => {
    setSelectedBanner(null);
    setBannerModalOpen(true);
  };

  const handleEditBanner = (banner: any) => {
    setSelectedBanner(banner);
    setBannerModalOpen(true);
  };

  const handleDeleteBanner = async (bannerId: string) => {
    await deleteBanner.mutateAsync(bannerId);
  };

  const handleToggleStatus = async (bannerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateBanner.mutateAsync({
        id: bannerId,
        updates: { status: newStatus }
      });
      toast({
        title: "Success",
        description: `Banner ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update banner status",
        variant: "destructive",
      });
    }
  };

  const handlePreviewBanner = (banner: any) => {
    setPreviewBanner(banner);
    setPreviewModalOpen(true);
  };

  const filteredBanners = banners.filter(banner => {
    const matchesSearch = 
      banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.target_audience.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || banner.status === statusFilter;
    const matchesAudience = audienceFilter === "all" || banner.target_audience === audienceFilter;
    
    return matchesSearch && matchesStatus && matchesAudience;
  });

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'merchant':
        return <Building className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'user':
        return 'Users';
      case 'merchant':
        return 'Merchants';
      case 'both':
        return 'Both';
      default:
        return audience;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const columns = [
    {
      key: 'image',
      title: 'Image',
      render: (value: any, banner: any) => (
        <div className="w-16 h-12 rounded overflow-hidden bg-muted">
          <img
            src={banner?.image_url}
            alt={banner?.title || "Banner"}
            className="w-full h-full object-cover"
          />
        </div>
      ),
      mobileHidden: false
    },
    {
      key: 'title',
      title: 'Title & Description',
      sortable: true,
      render: (value: any, banner: any) => (
        <div>
          <div className="font-medium">{banner?.title || "Untitled Banner"}</div>
          {banner?.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {banner.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'target_audience',
      title: 'Audience',
      sortable: true,
      render: (value: any, banner: any) => (
        <div className="flex items-center space-x-2">
          {getAudienceIcon(banner?.target_audience)}
          <span className="text-sm">{getAudienceLabel(banner?.target_audience)}</span>
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: any, banner: any) => (
        <Badge variant={getStatusColor(banner?.status)}>
          {banner?.status}
        </Badge>
      )
    },
    {
      key: 'priority',
      title: 'Priority',
      sortable: true,
      render: (value: any, banner: any) => (
        <div className="flex items-center space-x-2">
          {banner?.priority > 0 ? (
            <>
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">
                  {banner.priority}
                </span>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Low</span>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'date_range',
      title: 'Date Range',
      render: (value: any, banner: any) => (
        <div className="text-sm">
          <div>{safeFormatDate(banner?.start_date, "MMM dd")}</div>
          {banner?.end_date && (
            <div className="text-muted-foreground">
              to {safeFormatDate(banner.end_date, "MMM dd")}
            </div>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value: any, banner: any) => (
        <div className="text-sm text-muted-foreground">
          {safeFormatDate(banner?.created_at, "MMM dd, yyyy")}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, banner: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePreviewBanner(banner)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditBanner(banner)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(banner?.id, banner?.status)}>
              {banner?.status === 'active' ? (
                <>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this banner? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDeleteBanner(banner?.id)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];


  return (
    <>
      <BannerModal
        isOpen={bannerModalOpen}
        onClose={() => {
          setBannerModalOpen(false);
          setSelectedBanner(null);
        }}
        banner={selectedBanner}
      />

      {/* Preview Modal */}
      <AlertDialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Banner Preview</AlertDialogTitle>
            <AlertDialogDescription>
              This is how the banner appears to users
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {previewBanner && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={previewBanner.image_url}
                  alt={previewBanner.title || "Banner"}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {previewBanner.title || "Untitled"}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge variant={getStatusColor(previewBanner.status)}>
                    {previewBanner.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Target:</span> {getAudienceLabel(previewBanner.target_audience)}
                </div>
                <div>
                  <span className="font-medium">Priority:</span> {previewBanner.priority || 0}
                </div>
              </div>
              
              {previewBanner.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{previewBanner.description}</p>
                </div>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Banner Management</h3>
          <Button onClick={handleCreateBanner}>
            <Plus className="h-4 w-4 mr-2" />
            Create Banner
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{banners.length}</div>
                <div className="text-sm text-muted-foreground">Total Banners</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {banners.filter(b => b.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Banners</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {banners.filter(b => b.status === 'inactive').length}
                </div>
                <div className="text-sm text-muted-foreground">Inactive Banners</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search banners by title, description, or audience..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audience</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="merchant">Merchants</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Banners Table */}
        <ResponsiveTable
          data={filteredBanners}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Search banners..."
          emptyMessage="No banners found. Create your first banner to get started."
          pageSize={10}
        />
      </div>
    </>
  );
}