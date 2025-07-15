import React from 'react';
import { StudyHallMap } from './StudyHallMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface StudyHall {
  id: string;
  name: string;
  location: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  daily_price: number;
  weekly_price: number;
  monthly_price: number;
  amenities: string[];
  image_url?: string;
  merchant_id: string;
}

interface StudyHallSearchMapProps {
  onStudyHallSelect?: (studyHall: StudyHall) => void;
  className?: string;
}

export const StudyHallSearchMap: React.FC<StudyHallSearchMapProps> = ({
  onStudyHallSelect,
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Find Study Halls Near You
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StudyHallMap onStudyHallSelect={onStudyHallSelect} />
      </CardContent>
    </Card>
  );
};