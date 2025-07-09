import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Cabin {
  id?: number;
  name: string;
  location: string;
  price: number;
  status: string;
  bookings: number;
  rating: number;
  revenue: string;
  description?: string;
  amenities?: string[];
}

interface CabinModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabin?: Cabin | null;
  mode: "add" | "edit" | "view";
  onSave: (cabin: Cabin) => void;
  onDelete?: (id: number) => void;
}

export function CabinModal({ isOpen, onClose, cabin, mode, onSave, onDelete }: CabinModalProps) {
  const [formData, setFormData] = useState<Cabin>({
    name: cabin?.name || "",
    location: cabin?.location || "",
    price: cabin?.price || 0,
    status: cabin?.status || "pending",
    bookings: cabin?.bookings || 0,
    rating: cabin?.rating || 0,
    revenue: cabin?.revenue || "$0",
    description: cabin?.description || "",
    amenities: cabin?.amenities || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: cabin?.id });
    onClose();
  };

  const handleDelete = () => {
    if (cabin?.id && onDelete) {
      onDelete(cabin.id);
      onClose();
    }
  };

  const isReadonly = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add New Cabin"}
            {mode === "edit" && "Edit Cabin"}
            {mode === "view" && "Cabin Details"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" && "Fill in the details to add a new cabin."}
            {mode === "edit" && "Update the cabin information."}
            {mode === "view" && "View cabin details and statistics."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Cabin Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                readOnly={isReadonly}
                required={mode !== "view"}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                readOnly={isReadonly}
                required={mode !== "view"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price per Day ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                readOnly={isReadonly}
                required={mode !== "view"}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={isReadonly}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              readOnly={isReadonly}
              rows={3}
            />
          </div>

          {mode === "view" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Bookings</Label>
                <div className="p-2 bg-muted rounded-md">
                  <span className="font-semibold">{formData.bookings}</span>
                </div>
              </div>
              <div>
                <Label>Rating</Label>
                <div className="p-2 bg-muted rounded-md">
                  <span className="font-semibold">
                    {formData.rating > 0 ? `★ ${formData.rating}` : "No reviews"}
                  </span>
                </div>
              </div>
              <div>
                <Label>Total Revenue</Label>
                <div className="p-2 bg-muted rounded-md">
                  <span className="font-semibold">{formData.revenue}</span>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="p-2">
                  <Badge variant={formData.status === "active" ? "default" : "secondary"}>
                    {formData.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {mode === "view" ? "Close" : "Cancel"}
            </Button>
            
            {mode === "edit" && onDelete && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
            
            {mode !== "view" && (
              <Button type="submit">
                {mode === "add" ? "Add Cabin" : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}