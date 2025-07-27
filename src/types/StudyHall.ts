// Simplified interface for Study Hall data
export interface StudyHallData {
  id: string;
  merchant_id?: string;
  name: string;
  description?: string;
  location: string;
  formatted_address?: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  custom_row_names: string[];
  amenities: string[];
  monthly_price: number;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  hall_number?: number;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  total_reviews?: number;
}

// Simple seat interface
export interface Seat {
  id: string;
  study_hall_id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

// Legacy interface - kept for backward compatibility
export interface CreateStudyHallData {
  name: string;
  description?: string;
  location: string;
  formatted_address?: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  custom_row_names?: string[];
  amenities?: string[];
  monthly_price: number;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}