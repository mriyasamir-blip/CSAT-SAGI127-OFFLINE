export interface RatingDimension {
  id: string;
  number: number;
  category: string;
  question: string;
  scaleLabels: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
}

export interface CSATResponse {
  id: string;
  createdAt: string; // ISO date string
  desk: string; // e.g. "Meja CS 1", "Loket Layanan 2"
  officerName?: string; // e.g. "Siti Rahmawati"
  serviceType: string; // e.g. "Konsultasi Program SAGI"
  customerName?: string; // Optional
  customerPhone?: string; // Optional
  ratings: {
    q1_keramahan: number; // 1-5
    q2_kejelasan: number; // 1-5
    q3_kecepatan: number; // 1-5
    q4_profesionalisme: number; // 1-5
    q5_kepuasan_umum: number; // 1-5
  };
  averageRating: number;
  feedback?: string;
}

export type ViewMode = 'survey' | 'qr-generator' | 'admin-dashboard';
