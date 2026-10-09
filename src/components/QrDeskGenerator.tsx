import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Printer, Download, Copy, Check, Building2, Smartphone, ShieldCheck } from 'lucide-react';
import { DEFAULT_DESKS, CS_OFFICERS } from '../data/questions';
import { SagiLogo } from './SagiLogo';

interface QrDeskGeneratorProps {
  onSimulateScan: (desk: string, officer: string) => void;
}

export const QrDeskGenerator: React.FC<QrDeskGeneratorProps> = ({ onSimulateScan }) => {
  const [selectedDesk, setSelectedDesk] = useState<string>(DEFAULT_DESKS[0]);
  const [customDesk, setCustomDesk] = useState<string>('');
  const [selectedOfficer, setSelectedOfficer] = useState<string>(CS_OFFICERS[0]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [targetUrl, setTargetUrl] = useState<string>('');

  const activeDesk = customDesk.trim() || selectedDesk;

  // The QR Code points directly to customer-only CSAT Form
  useEffect(() => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const params = new URLSearchParams();
    params.set('mode', 'pelanggan'); // forces pure customer view without staff nav
    params.set('desk', activeDesk);
    if (selectedOfficer) {
      params.set('officer', selectedOfficer);
    }
    const fullUrl = `${origin}${pathname}?${params.toString()}`;
    setTargetUrl(fullUrl);

    QRCode.toDataURL(
      fullUrl,
      {
        width: 450,
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
  }, [activeDesk, selectedOfficer]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR-CSAT-SAGI127-${activeDesk.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Control panel for CS Officers / Admin */}
      <div className="no-print bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <SagiLogo size="lg" />
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Layanan SAGI 127
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800">
                Cetak QR Barcode Meja Layanan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Barcode ini mengarahkan pelapor langsung ke pengisian kuesioner survei kepuasan pelanggan secara real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak QR Barcode Meja Layanan
            </button>
            <button
              onClick={handleDownloadQr}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              Unduh PNG Barcode
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Nomor Meja / Loket
            </label>
            <select
              value={selectedDesk}
              onChange={(e) => {
                setSelectedDesk(e.target.value);
                setCustomDesk('');
              }}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {DEFAULT_DESKS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Atau Tulis Nama Meja Kustom
            </label>
            <input
              type="text"
              value={customDesk}
              onChange={(e) => setCustomDesk(e.target.value)}
              placeholder="Contoh: Meja Konsultasi Gizi 1"
              className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Petugas CS Bertugas
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {CS_OFFICERS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* URL preview */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="text-slate-500 truncate max-w-xl">
            Tautan Barcode: <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">{targetUrl}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-600 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Tautan'}
            </button>
            <button
              onClick={() => onSimulateScan(activeDesk, selectedOfficer)}
              className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline bg-emerald-50 px-2.5 py-1 rounded-lg"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Simulasi Buka Tampilan Pelapor
            </button>
          </div>
        </div>
      </div>

      {/* Standee Preview Card (Print-Ready) with SAGI 127 Mascot */}
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-emerald-500/20 text-center relative overflow-hidden print:shadow-none print:border-none print:m-0 print:p-6 print:w-full print:max-w-none">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 p-6 text-white mb-5 flex items-center justify-between gap-3 text-left">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-emerald-100 mb-1 border border-white/20 uppercase">
                <Building2 className="w-3 h-3" />
                Layanan SAGI 127 Offline
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-tight">
                Survei Kepuasan Pelanggan (CSAT)
              </h1>
              <p className="text-emerald-100 text-xs mt-0.5">
                Bantu kami terus melayani Anda dengan lebih baik
              </p>
            </div>

            {/* SAGI 127 logo badge */}
            <div className="shrink-0">
              <SagiLogo size="xl" />
            </div>
          </div>

          {/* Desk Highlight Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Lokasi: {activeDesk}</span>
          </div>

          <div className="text-xs text-slate-500 mb-3">
            Petugas: <strong className="text-slate-800">{selectedOfficer}</strong>
          </div>

          {/* High-res QR Barcode Container */}
          <div className="p-3 bg-white inline-block rounded-2xl shadow-md border-2 border-slate-200 mb-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Barcode CSAT SAGI 127 untuk ${activeDesk}`}
                className="w-56 h-56 mx-auto rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400">
                Membuat Barcode...
              </div>
            )}
          </div>

          {/* Scan Instructions */}
          <div className="space-y-1 mb-5">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Pindai Barcode Menggunakan Kamera HP
            </h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              Arahkan kamera smartphone ke barcode di atas untuk langsung membuka formulir penilaian kepuasan pelayanan SAGI 127.
            </p>
          </div>

          {/* 5 Aspek Penilaian */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 text-center">
              5 Aspek Penilaian Layanan CSAT
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 font-medium">
              <div>1. Keramahan & Sopan Santun</div>
              <div>2. Kejelasan & Pemahaman Solusi</div>
              <div>3. Kecepatan & Efisiensi</div>
              <div>4. Profesionalisme Petugas</div>
              <div className="col-span-2 text-center text-emerald-700 font-bold">5. Kepuasan Pelayanan Keseluruhan</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 border-t border-slate-100 pt-2">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Pelayanan Bebas Pungli • Layanan Terpadu SAGI 127</span>
          </div>
        </div>
      </div>
    </div>
  );
};
