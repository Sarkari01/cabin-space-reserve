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
  Building 
} from "lucide-react";
import { useBanners, useDeleteBanner } from "@/hooks/useBanners";
import { BannerModal } from "@/components/BannerModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export function BannersTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);

  const { data: banners = [], isLoading } = useBanners();
  const deleteBanner = useDeleteBanner();

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

  const filteredBanners = banners.filter(banner =>
    banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.target_audience.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Banner Management</h3>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Banner Management</h3>
          <Button onClick={handleCreateBanner}>
            <Plus className="h-4 w-4 mr-2" />
            Create Banner
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search banners by title, description, or audience..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

        {/* Banners Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredBanners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted overflow-hidden">
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner"}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold truncate">
                          {banner.title || "Untitled Banner"}
                        </h4>
                        <Badge variant={getStatusColor(banner.status)}>
                          {banner.status}
                        </Badge>
                      </div>
                      {banner.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {banner.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      {getAudienceIcon(banner.target_audience)}
                      <span className="text-muted-foreground">
                        Target: {getAudienceLabel(banner.target_audience)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(new Date(banner.start_date), "MMM dd, yyyy")}
                        {banner.end_date && (
                          <> - {format(new Date(banner.end_date), "MMM dd, yyyy")}</>
                        )}
                      </span>
                    </div>

                    {banner.priority > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-bold">
                            {banner.priority}
                          </span>
                        </div>
                        <span className="text-muted-foreground">Priority</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditBanner(banner)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBanners.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-muted-foreground">
                  {searchTerm ? "No banners found matching your search." : "No banners created yet."}
                </div>
                {!searchTerm && (
                  <Button onClick={handleCreateBanner}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Banner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}