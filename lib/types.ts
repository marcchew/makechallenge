export interface Report {
  id: number;
  title: string;
  description: string;
  location: string;
  name: string;
  tags: string;
  urgency: string;
  severity: string;
  status: string;
  timestamp: string;
  image_filename: File | null;
  user: number;
}
