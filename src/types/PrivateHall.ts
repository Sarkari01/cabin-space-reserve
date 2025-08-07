export interface PrivateHall {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  location: string;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  monthly_price: number;
  cabin_layout_json: any;
  cabin_count: number;
  total_revenue: number;
  status: 'active' | 'inactive' | 'draft';
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface Cabin {
  id: string;
  private_hall_id: string;
  cabin_number: number;
  cabin_name: string;
  monthly_price?: number;
  refundable_deposit?: number;
  size_sqft?: number;
  max_occupancy: number;
  amenities: string[];
  position_x: number;
  position_y: number;
  status: 'available' | 'occupied' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface CabinBooking {
  id: string;
  booking_number?: number;
  user_id?: string;
  cabin_id: string;
  private_hall_id: string;
  start_date: string;
  end_date: string;
  months_booked: number;
  monthly_amount: number;
  total_amount: number;
  payment_status: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  created_at: string;
  updated_at: string;
}

export interface PrivateHallImage {
  id: string;
  private_hall_id: string;
  image_url: string;
  file_path: string;
  is_main: boolean;
  display_order: number;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

export interface CabinLayoutData {
  cabins: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    monthly_price?: number;
    refundable_deposit?: number;
    amenities?: string[];
  }>;
  layout: {
    width: number;
    height: number;
    scale: number;
  };
}