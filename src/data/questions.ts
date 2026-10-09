import { RatingDimension } from '../types/csat';

export const CSAT_DIMENSIONS: RatingDimension[] = [
  {
    id: 'q1_keramahan',
    number: 1,
    category: 'Keramahan dan Sikap Petugas CS',
    question: 'Seberapa ramah dan sopan petugas CS dalam melayani Anda?',
    scaleLabels: {
      1: 'Sangat Tidak Sopan',
      2: 'Tidak Sopan',
      3: 'Cukup Sopan',
      4: 'Sopan',
      5: 'Sangat Sopan',
    },
  },
  {
    id: 'q2_kejelasan',
    number: 2,
    category: 'Kejelasan dan Pemahaman Solusi',
    question: 'Seberapa jelas penjelasan yang diberikan petugas CS terkait masalah/keperluan Anda?',
    scaleLabels: {
      1: 'Sangat Membingungkan',
      2: 'Membingungkan',
      3: 'Cukup Jelas',
      4: 'Jelas',
      5: 'Sangat Jelas & Mudah Dipahami',
    },
  },
  {
    id: 'q3_kecepatan',
    number: 3,
    category: 'Kecepatan dan Efisiensi Pelayanan',
    question: 'Seberapa puas Anda dengan kecepatan petugas CS dalam menangani laporan Anda?',
    scaleLabels: {
      1: 'Sangat Lambat',
      2: 'Lambat',
      3: 'Cukup',
      4: 'Cepat',
      5: 'Sangat Cepat & Efisien',
    },
  },
  {
    id: 'q4_profesionalisme',
    number: 4,
    category: 'Keahlian dan Profesionalisme Petugas',
    question: 'Seberapa sigap dan profesional petugas CS dalam menyelesaikan atau menindaklanjuti keluhan Anda?',
    scaleLabels: {
      1: 'Sangat Tidak Cekatan',
      2: 'Tidak Cekatan',
      3: 'Cukup Cekatan',
      4: 'Cekatan',
      5: 'Sangat Profesional & Cekatan',
    },
  },
  {
    id: 'q5_kepuasan_umum',
    number: 5,
    category: 'Kepuasan Pelayanan Secara Keseluruhan',
    question: 'Secara keseluruhan, seberapa puas Anda dengan pengalaman pelayanan di Customer Service kami hari ini?',
    scaleLabels: {
      1: 'Sangat Tidak Puas',
      2: 'Tidak Puas',
      3: 'Cukup Puas',
      4: 'Puas',
      5: 'Sangat Puas',
    },
  },
];

export const SERVICE_TYPES = [
  'Konsultasi Program SAGI',
  'Pengajuan & Verifikasi Berkas',
  'Pembaruan Data & Profil Pengguna',
  'Penanganan Kendala Teknis / Akun',
  'Informasi Jadwal & Alur Layanan',
  'Penyampaian Aspirasi / Pengaduan',
  'Layanan Lainnya',
];

export const DEFAULT_DESKS = [
  'Meja CS 1 (Walk-in)',
  'Meja CS 2 (Walk-in)',
  'Meja CS 3 (Walk-in)',
  'Loket Layanan 1',
  'Loket Layanan 2',
  'Ruang Konsultasi Khusus',
];

export const CS_OFFICERS = [
  'Seftia Marsita Maharani',
  'Ofa Nur Arafah',
  'Nella Yulianti',
  'Tyas Khairunnisa',
  'Rahmah Sulistiani',
];

