// Clean, focused types for study hall creation
export interface StudyHallCreationData {
  name: string;
  description: string;
  location: string;
  formatted_address?: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  monthly_price: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

export interface StudyHallCreationFormData {
  name: string;
  description: string;
  location: string;
  total_seats: string;
  rows: string;
  seats_per_row: string;
  monthly_price: string;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

export const DEFAULT_AMENITIES = [
  'WiFi',
  'Air Conditioning', 
  'Power Outlets',
  'Water Cooler',
  'Parking',
  'CCTV',
  'Security Guard',
  'Washroom',
  'Cafeteria',
  'Library'
];