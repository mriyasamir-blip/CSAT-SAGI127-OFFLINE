import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  Download, 
  Search, 
  Clock, 
  Smile, 
  Award,
  QrCode,
  Copy,
  Check,
  Printer,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Building2,
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { CSATResponse } from '../types/csat';
import { CSAT_DIMENSIONS, DEFAULT_DESKS, CS_OFFICERS } from '../data/questions';
import { formatDateIndonesian, getScoreColorClass, getRatingEmoji } from '../utils/helpers';
import { SagiLogo } from './SagiLogo';

interface AdminDashboardProps {
  responses: CSATResponse[];
  onClearData: () => void;
  onResetSeedData: () => void;
  onOpenCustomerPreview: (desk: string, officer: string) => void;
  onOpenStandeePrint: () => void;
  realtimeStatus?: 'connected' | 'connecting' | 'offline';
  latestNewResponseId?: string | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  responses,
  onClearData,
  onResetSeedData,
  onOpenCustomerPreview,
  onOpenStandeePrint,
  realtimeStatus = 'connected',
  latestNewResponseId = null,
}) => {
  // Barcode station state
  const [barcodeDesk, setBarcodeDesk] = useState<string>(DEFAULT_DESKS[0]);
  const [barcodeOfficer, setBarcodeOfficer] = useState<string>(CS_OFFICERS[0]);
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filter state
  const [selectedDeskFilter, setSelectedDeskFilter] = useState<string>('all');
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all'); // all, today, 7days, 30days
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedResponseDetail, setSelectedResponseDetail] = useState<CSATResponse | null>(null);

  // Generate target barcode URL specifically with mode=pelanggan so pelapor sees ONLY the survey form
  useEffect(() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const params = new URLSearchParams();
    params.set('mode', 'pelanggan');
    params.set('desk', barcodeDesk);
    if (barcodeOfficer) {
      params.set('officer', barcodeOfficer);
    }
    const fullUrl = `${origin}${pathname}?${params.toString()}`;
    setBarcodeUrl(fullUrl);

    QRCode.toDataURL(
      fullUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [barcodeDesk, barcodeOfficer]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(barcodeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtered responses
  const filteredResponses = useMemo(() => {
    return responses.filter(r => {
      // Desk filter
      if (selectedDeskFilter !== 'all' && r.desk !== selectedDeskFilter) return false;
      // Officer filter
      if (selectedOfficerFilter !== 'all' && r.officerName !== selectedOfficerFilter) return false;
      // Date filter
      if (selectedDateFilter !== 'all') {
        const itemDate = new Date(r.createdAt);
        const now = new Date();
        if (selectedDateFilter === 'today') {
          const isToday = itemDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (selectedDateFilter === '7days') {
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (selectedDateFilter === '30days') {
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = r.customerName?.toLowerCase().includes(query) ?? false;
        const matchesFeedback = r.feedback?.toLowerCase().includes(query) ?? false;
        const matchesDesk = r.desk.toLowerCase().includes(query);
        const matchesOfficer = r.officerName?.toLowerCase().includes(query) ?? false;
        const matchesService = r.serviceType.toLowerCase().includes(query);
        const matchesId = r.id.toLowerCase().includes(query);
        if (!matchesName && !matchesFeedback && !matchesDesk && !matchesOfficer && !matchesService && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [responses, selectedDeskFilter, selectedOfficerFilter, selectedDateFilter, searchQuery]);

  // Overall calculations
  const totalCount = filteredResponses.length;

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return responses.filter(r => new Date(r.createdAt).toDateString() === today).length;
  }, [responses]);

  // Standard CSAT %: (Count of ratings with 4 or 5 / Total ratings) * 100
  const csatPercentage = useMemo(() => {
    if (totalCount === 0) return 0;
    const satisfiedCount = filteredResponses.filter(r => r.ratings.q5_kepuasan_umum >= 4).length;
    return Math.round((satisfiedCount / totalCount) * 100);
  }, [filteredResponses, totalCount]);

  const overallAverageStar = useMemo(() => {
    if (totalCount === 0) return 0;
    const sum = filteredResponses.reduce((acc, curr) => acc + curr.averageRating, 0);
    return Number((sum / totalCount).toFixed(2));
  }, [filteredResponses, totalCount]);

  // Dimension breakdown averages
  const dimensionAverages = useMemo(() => {
    if (totalCount === 0) {
      return {
        q1_keramahan: 0,
        q2_kejelasan: 0,
        q3_kecepatan: 0,
        q4_profesionalisme: 0,
        q5_kepuasan_umum: 0,
      };
    }
    const sums = filteredResponses.reduce(
      (acc, r) => ({
        q1_keramahan: acc.q1_keramahan + r.ratings.q1_keramahan,
        q2_kejelasan: acc.q2_kejelasan + r.ratings.q2_kejelasan,
        q3_kecepatan: acc.q3_kecepatan + r.ratings.q3_kecepatan,
        q4_profesionalisme: acc.q4_profesionalisme + r.ratings.q4_profesionalisme,
        q5_kepuasan_umum: acc.q5_kepuasan_umum + r.ratings.q5_kepuasan_umum,
      }),
      { q1_keramahan: 0, q2_kejelasan: 0, q3_kecepatan: 0, q4_profesionalisme: 0, q5_kepuasan_umum: 0 }
    );

    return {
      q1_keramahan: Number((sums.q1_keramahan / totalCount).toFixed(2)),
      q2_kejelasan: Number((sums.q2_kejelasan / totalCount).toFixed(2)),
      q3_kecepatan: Number((sums.q3_kecepatan / totalCount).toFixed(2)),
      q4_profesionalisme: Number((sums.q4_profesionalisme / totalCount).toFixed(2)),
      q5_kepuasan_umum: Number((sums.q5_kepuasan_umum / totalCount).toFixed(2)),
    };
  }, [filteredResponses, totalCount]);

  // Star distribution breakdown for q5 (Kepuasan Keseluruhan)
  const starDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filteredResponses.forEach(r => {
      const score = Math.round(r.ratings.q5_kepuasan_umum) as 1|2|3|4|5;
      if (dist[score] !== undefined) dist[score]++;
    });
    return dist;
  }, [filteredResponses]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredResponses.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'ID Tiket',
      'Waktu Kunjungan',
      'Loket / Meja',
      'Petugas CS',
      'Jenis Layanan',
      'Nama Pengunjung',
      'Kontak',
      '1. Keramahan (1-5)',
      '2. Kejelasan Solusi (1-5)',
      '3. Kecepatan (1-5)',
      '4. Profesionalisme (1-5)',
      '5. Kepuasan Umum (1-5)',
      'Rata-Rata Bintang',
      'Saran & Masukan',
    ];

    const rows = filteredResponses.map(r => [
      `"${r.id}"`,
      `"${r.createdAt}"`,
      `"${r.desk}"`,
      `"${r.officerName || '-'}"`,
      `"${r.serviceType}"`,
      `"${r.customerName || 'Anonim'}"`,
      `"${r.customerPhone || '-'}"`,
      r.ratings.q1_keramahan,
      r.ratings.q2_kejelasan,
      r.ratings.q3_kecepatan,
      r.ratings.q4_profesionalisme,
      r.ratings.q5_kepuasan_umum,
      r.averageRating,
      `"${(r.feedback || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_CSAT_SAGI_Offline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. BARCODE KHUSUS PELAPOR (SCAN DI MEJA / SCREEN MEJA)                     */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text & Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <SagiLogo size="lg" />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-bold border border-emerald-400/30">
                  <QrCode className="w-3.5 h-3.5" />
                  BARCODE SCAN UNTUK PELAPOR DI MEJA
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  Arahkan Pelapor untuk Memindai Barcode Ini
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pelapor cukup mengarahkan kamera HP ke barcode di samping untuk langsung mengisi <strong>Penilaian Kepuasan (CSAT)</strong>. <span className="text-emerald-300 font-semibold">Tampilan pelapor terisolasi khusus dan tidak dapat melihat data dashboard ini.</span>
            </p>

            {/* Quick Desk & Officer Selector for Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nomor Meja / Loket Barcode
                </label>
                <select
                  value={barcodeDesk}
                  onChange={(e) => setBarcodeDesk(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-600 bg-slate-800/90 text-white p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {DEFAULT_DESKS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Petugas CS Bertugas
                </label>
                <select
                  value={barcodeOfficer}
                  onChange={(e) => setBarcodeOfficer(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-600 bg-slate-800/90 text-white p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {CS_OFFICERS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white font-semibold text-xs transition-colors border border-white/15"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tautan Tersalin!' : 'Salin Tautan Pelapor'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenStandeePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak QR Barcode Meja Layanan</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCustomerPreview(barcodeDesk, barcodeOfficer)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                title="Lihat persis seperti apa formulir yang dilihat oleh pelapor saat scan"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulasi Tampilan Pelapor</span>
              </button>
            </div>
          </div>

          {/* Right Live Barcode Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-white rounded-3xl p-5 text-slate-900 shadow-2xl max-w-xs w-full text-center border-4 border-emerald-500/30">
              <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {barcodeDesk}
              </div>

              {/* Barcode Image */}
              <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 inline-block mb-3">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Barcode Penilaian untuk ${barcodeDesk}`}
                    className="w-48 h-48 mx-auto rounded-xl"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Memuat Barcode...
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800">
                  Pindai untuk Isi Penilaian CSAT
                </div>
                <div className="text-[11px] text-slate-500">
                  Petugas: <strong className="text-slate-700">{barcodeOfficer}</strong>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Pelapor hanya melihat formulir penilaian</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DASHBOARD HASIL PENILAIAN CSAT (UNTUK PETUGAS / MANAGEMENT)            */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* Top Header of Dashboard Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                <BarChart3 className="w-3.5 h-3.5" />
                DASHBOARD HASIL PENILAIAN KEPUASAN (INTERNAL PETUGAS)
              </div>

              {/* Realtime Live Indicator */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : realtimeStatus === 'connecting'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                <span className="relative flex h-2 w-2">
                  {realtimeStatus === 'connected' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    realtimeStatus === 'connected'
                      ? 'bg-emerald-500'
                      : realtimeStatus === 'connecting'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}></span>
                </span>
                <span>
                  {realtimeStatus === 'connected'
                    ? 'Firebase Real-Time Aktif'
                    : realtimeStatus === 'connecting'
                    ? 'Menghubungkan ke Cloud...'
                    : 'Mode Offline'}
                </span>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-800">
              Rekapitulasi Hasil Survei CSAT Layanan SAGI 127
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Pantau kepuasan pengunjung secara langsung dan real-time berdasarkan 5 dimensi standar pelayanan publik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={responses.length === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
                responses.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
            >
              <Download className="w-4 h-4" />
              Ekspor ke Excel / CSV
            </button>
            <button
              onClick={onResetSeedData}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border border-slate-200"
              title="Tampilkan kembali riwayat data survei sebelumnya"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              Tampilkan Data Sebelumnya
            </button>
            {responses.length > 0 && (
              <button
                onClick={onClearData}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs transition-colors border border-rose-200"
                title="Hapus semua tanggapan survei"
              >
                Kosongkan Data
              </button>
            )}
          </div>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: CSAT Index Score */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CSAT Index Score</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">
                {totalCount === 0 ? '0%' : `${csatPercentage}%`}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {totalCount === 0 ? 'Menunggu Respon' : csatPercentage >= 85 ? 'Sangat Baik' : csatPercentage >= 70 ? 'Baik' : 'Evaluasi'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Persentase pengunjung yang puas (Bintang 4 & 5)
            </p>
          </div>

          {/* KPI 2: Overall Star Rating */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-Rata Bintang</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-500" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">
                {totalCount === 0 ? '0.00' : overallAverageStar}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 5.00</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-amber-400">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${totalCount > 0 && s <= Math.round(overallAverageStar) ? 'fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                />
              ))}
            </div>
          </div>

          {/* KPI 3: Total Responden */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Responden</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{totalCount}</span>
              <span className="text-xs text-slate-400 font-medium">respon masuk</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hari ini: <strong className="text-slate-700">{todayCount} pengunjung</strong></span>
            </p>
          </div>

          {/* KPI 4: Dimensi Tertinggi */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pelayanan Terbaik</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Smile className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-base font-extrabold text-slate-800 line-clamp-1">
                Keramahan Petugas
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-purple-200">
                Skor: {dimensionAverages.q1_keramahan} / 5.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Dimensi dengan tingkat kepuasan tertinggi
            </p>
          </div>
        </div>

        {/* 5 Dimensi Pelayanan & Distribusi Bintang */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: 5 Dimensions Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Analisis 5 Dimensi Pelayanan Walk-in CS
                </h3>
                <p className="text-xs text-slate-500">
                  Rincian rata-rata penilaian tiap dimensi dari formulir survei
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {CSAT_DIMENSIONS.map((dim) => {
                const score = dimensionAverages[dim.id as keyof typeof dimensionAverages] || 0;
                const percentage = Math.min(100, Math.round((score / 5) * 100));

                return (
                  <div key={dim.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[11px]">
                          {dim.number}
                        </span>
                        <span className="font-bold text-slate-700">{dim.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800">{score.toFixed(2)}</span>
                        <span className="text-slate-400">/ 5.0</span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic pl-7 line-clamp-1">
                      "{dim.question}"
                    </p>

                    <div className="pl-7">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Rating Distribution */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Sebaran Bintang Kepuasan
              </h3>
              <p className="text-xs text-slate-500">
                Distribusi penilaian kepuasan secara keseluruhan
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = starDistribution[star] || 0;
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 w-16">
                      <span className="font-bold text-slate-700">{star}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>

                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="w-14 text-right">
                      <span className="font-bold text-slate-700">{count}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-2xl">
              <span className="text-xs font-semibold text-slate-600 block mb-1">
                Rumus Standar CSAT:
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                CSAT = (Responden Bintang 4 & 5 ÷ Total Responden) × 100%
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Responses List Table */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Daftar Tanggapan & Evaluasi Pengunjung
              </h3>
              <p className="text-xs text-slate-500">
                Menampilkan {filteredResponses.length} dari {responses.length} total rekaman
              </p>
            </div>

            {/* Search bar */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, keperluan, feedback..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Filter controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Desk Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter Loket / Meja
              </label>
              <select
                value={selectedDeskFilter}
                onChange={(e) => setSelectedDeskFilter(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">Semua Meja / Loket</option>
                {DEFAULT_DESKS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Officer Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter Petugas CS
              </label>
              <select
                value={selectedOfficerFilter}
                onChange={(e) => setSelectedOfficerFilter(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">Semua Petugas</option>
                {CS_OFFICERS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter Waktu
              </label>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini Saja</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Waktu & ID</th>
                  <th className="py-3 px-4">Loket & Petugas</th>
                  <th className="py-3 px-4">Keperluan Layanan (Diisi Pelapor)</th>
                  <th className="py-3 px-4">5 Aspek Penilaian</th>
                  <th className="py-3 px-4 text-center">Rata-Rata</th>
                  <th className="py-3 px-4">Masukan / Feedback</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 px-4">
                      <div className="max-w-md mx-auto text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                          <QrCode className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-base">
                          Belum Ada Tanggapan Survei Masuk
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Data survei dimulai dari awal (kosong). Tanggapan akan langsung muncul di sini secara <strong>real-time</strong> segera setelah pelapor memindai barcode di meja dan menyelesaikan survei kepuasan.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={onOpenStandeePrint}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Cetak QR Barcode Meja Layanan</span>
                          </button>
                          <button
                            type="button"
                            onClick={onResetSeedData}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4 text-emerald-600" />
                            <span>Tampilkan Data Sebelumnya</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenCustomerPreview(barcodeDesk, barcodeOfficer)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                          >
                            <Smartphone className="w-4 h-4 text-emerald-600" />
                            <span>Simulasi Isi Pelapor</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredResponses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                      Tidak ada data yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredResponses.map((item) => {
                    const colorClass = getScoreColorClass(item.averageRating);
                    const isNewest = item.id === latestNewResponseId;

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isNewest 
                            ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-400' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800">{item.id}</span>
                            {isNewest && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full animate-pulse">
                                Baru Masuk
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{formatDateIndonesian(item.createdAt)}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{item.desk}</span>
                          <span className="text-[11px] text-slate-500">CS: {item.officerName || '-'}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-700">
                          <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                            {item.serviceType}
                          </span>
                          {item.customerName && (
                            <span className="block text-[11px] text-slate-400 mt-0.5">Oleh: {item.customerName}</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span title="Keramahan" className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-700">
                              K:{item.ratings.q1_keramahan}
                            </span>
                            <span title="Kejelasan Solusi" className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-700">
                              J:{item.ratings.q2_kejelasan}
                            </span>
                            <span title="Kecepatan" className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-700">
                              C:{item.ratings.q3_kecepatan}
                            </span>
                            <span title="Profesionalisme" className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-700">
                              P:{item.ratings.q4_profesionalisme}
                            </span>
                            <span title="Kepuasan Umum" className="px-1.5 py-0.5 rounded bg-emerald-100 text-[11px] font-bold text-emerald-800">
                              U:{item.ratings.q5_kepuasan_umum}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-xs border ${colorClass}`}>
                            <Star className="w-3 h-3 fill-current" />
                            {item.averageRating.toFixed(1)}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          {item.feedback ? (
                            <p className="text-slate-600 line-clamp-2 italic text-[11px]">
                              "{item.feedback}"
                            </p>
                          ) : (
                            <span className="text-slate-300 italic text-[11px]">- Tidak ada catatan -</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedResponseDetail(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Response Detail Modal */}
      {selectedResponseDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  {selectedResponseDetail.id}
                </span>
                <h3 className="text-base font-bold text-slate-800">Detail Hasil Survei Pelanggan</h3>
              </div>
              <button
                onClick={() => setSelectedResponseDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl">
              <div>
                <span className="text-slate-400 block">Waktu:</span>
                <span className="font-semibold text-slate-700">{formatDateIndonesian(selectedResponseDetail.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Loket / Meja:</span>
                <span className="font-semibold text-slate-700">{selectedResponseDetail.desk}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Petugas CS:</span>
                <span className="font-semibold text-slate-700">{selectedResponseDetail.officerName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Keperluan:</span>
                <span className="font-semibold text-slate-700">{selectedResponseDetail.serviceType}</span>
              </div>
              {selectedResponseDetail.customerName && (
                <div>
                  <span className="text-slate-400 block">Pengunjung:</span>
                  <span className="font-semibold text-slate-700">{selectedResponseDetail.customerName}</span>
                </div>
              )}
              {selectedResponseDetail.customerPhone && (
                <div>
                  <span className="text-slate-400 block">Kontak:</span>
                  <span className="font-semibold text-slate-700">{selectedResponseDetail.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-600 block">Skor 5 Dimensi Pelayanan:</span>
              {CSAT_DIMENSIONS.map((dim) => {
                const val = selectedResponseDetail.ratings[dim.id as keyof typeof selectedResponseDetail.ratings];
                const label = dim.scaleLabels[val as 1|2|3|4|5];
                return (
                  <div key={dim.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5">
                    <span className="text-slate-600 truncate max-w-[240px]">{dim.number}. {dim.category}</span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="text-amber-500 flex">
                        {Array.from({ length: val }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                      <span>{val} ({label})</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedResponseDetail.feedback && (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 text-xs">
                <span className="font-bold text-emerald-800 block mb-1">Masukan / Feedback:</span>
                <p className="text-emerald-950 italic leading-relaxed">
                  "{selectedResponseDetail.feedback}"
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedResponseDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
