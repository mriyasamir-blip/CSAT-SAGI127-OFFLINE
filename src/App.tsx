/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CSATResponse } from './types/csat';
import { CustomerSurvey } from './components/CustomerSurvey';
import { QrDeskGenerator } from './components/QrDeskGenerator';
import { AdminDashboard } from './components/AdminDashboard';
import { SagiLogo } from './components/SagiLogo';
import { ArrowLeft, ShieldCheck, QrCode, BarChart3, Bell, X, CheckCircle, Radio } from 'lucide-react';
import { 
  subscribeToCSATResponses, 
  clearAllResponsesFromFirestore, 
  submitCSATResponse 
} from './services/firebase';
import { INITIAL_RESPONSES } from './data/seedData';

const STORAGE_KEY = 'sagi_csat_responses_clean_v1';

export default function App() {
  // Check URL parameters
  const params = new URLSearchParams(window.location.search);
  const isPelangganParam = params.get('mode') === 'pelanggan' || params.has('desk');
  const viewParam = params.get('view');

  // Mode: 'pelanggan' (Survey Form only) OR 'dashboard' (Dashboard + Barcode) OR 'standee'
  const [activeMode, setActiveMode] = useState<'pelanggan' | 'dashboard' | 'standee'>(() => {
    if (isPelangganParam) return 'pelanggan';
    if (viewParam === 'standee' || viewParam === 'qr-barcode') return 'standee';
    return 'dashboard'; // DEFAULT is Dashboard + Barcode for the officer!
  });

  // Display previous responses and sync in real-time from Firestore!
  const [responses, setResponses] = useState<CSATResponse[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_RESPONSES;
  });

  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const [latestNewResponse, setLatestNewResponse] = useState<CSATResponse | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const isInitialLoad = useRef(true);

  const [deskFromUrl, setDeskFromUrl] = useState<string>('');
  const [officerFromUrl, setOfficerFromUrl] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const desk = urlParams.get('desk');
    const officer = urlParams.get('officer');
    if (desk) setDeskFromUrl(decodeURIComponent(desk));
    if (officer) setOfficerFromUrl(decodeURIComponent(officer));
  }, []);

  // Save responses whenever they change to local storage (offline cache)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
    } catch {
      // ignore
    }
  }, [responses]);

  // Real-time Firestore Subscription (strictly user-driven, live updates)
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToCSATResponses(
      (remoteResponses) => {
        if (!isMounted) return;
        setRealtimeStatus('connected');

        // Check if a new response was just submitted in real-time
        if (!isInitialLoad.current) {
          setResponses((prev) => {
            const currentIds = new Set(prev.map(r => r.id));
            const newItems = remoteResponses.filter(r => !currentIds.has(r.id));
            if (newItems.length > 0) {
              const newest = newItems[0];
              setLatestNewResponse(newest);
              setShowToast(true);

              try {
                if ('vibrate' in navigator) navigator.vibrate(100);
              } catch {
                // ignore
              }

              setTimeout(() => {
                setShowToast(false);
              }, 6000);
            }
            return remoteResponses;
          });
        } else {
          isInitialLoad.current = false;
          setResponses(remoteResponses);
        }
      },
      (err) => {
        console.warn('Real-time connection error, using local data:', err);
        if (isMounted) setRealtimeStatus('offline');
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleNewResponse = (newResp: CSATResponse) => {
    setResponses((prev) => [newResp, ...prev.filter(r => r.id !== newResp.id)]);
    setLatestNewResponse(newResp);
  };

  const handleClearData = async () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh data survei? Semua data tanggapan akan dihapus dari Cloud Firebase dan dimulai dari awal.')) {
      setResponses([]);
      localStorage.removeItem(STORAGE_KEY);
      try {
        await clearAllResponsesFromFirestore();
      } catch (err) {
        console.warn('Error clearing Firestore data:', err);
      }
    }
  };

  const handleResetSeedData = async () => {
    setResponses(INITIAL_RESPONSES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RESPONSES));
    for (const item of INITIAL_RESPONSES) {
      await submitCSATResponse(item).catch(() => {});
    }
  };

  const handleOpenCustomerPreview = (desk: string, officer: string) => {
    setDeskFromUrl(desk);
    setOfficerFromUrl(officer);
    setActiveMode('pelanggan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ================================================================= */}
      {/* KONDISI 1: PELAPOR MEMINDAI BARCODE (MODE PELANGGAN)              */}
      {/* TAMPILAN HANYA FORM PENILAIAN KEPUASAN (DASHBOARD TIDAK TAMPIL)   */}
      {/* ================================================================= */}
      {activeMode === 'pelanggan' ? (
        <div className="flex-1 flex flex-col">
          {/* Back to dashboard button ONLY visible if accessed during preview simulation */}
          {!isPelangganParam && (
            <div className="no-print bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-300">
                Mode Simulasi: Ini adalah tampilan persis yang dilihat oleh pelapor saat memindai barcode
              </span>
              <button
                type="button"
                onClick={() => setActiveMode('dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Dashboard & Barcode
              </button>
            </div>
          )}

          <main className="flex-1">
            <CustomerSurvey
              initialDesk={deskFromUrl}
              initialOfficer={officerFromUrl}
              onSubmitSuccess={handleNewResponse}
              isStandaloneCustomer={true}
            />
          </main>

          {/* Simple Clean Footer for Pelapor - No Dashboard links */}
          <footer className="no-print border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
            <div className="max-w-md mx-auto px-4 flex items-center justify-center gap-2">
              <SagiLogo size="sm" />
              <span className="font-bold text-slate-700 text-[11px]">
                Layanan SAGI 127 Offline
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-400">Survei Kepuasan Pelanggan</span>
            </div>
          </footer>
        </div>
      ) : activeMode === 'standee' ? (
        /* Standee Meja Siap Cetak */
        <div className="flex-1 flex flex-col">
          <header className="no-print bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setActiveMode('dashboard')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </button>
            <span className="text-xs font-bold text-slate-600">
              Cetak QR Barcode Meja Layanan
            </span>
          </header>

          <main className="flex-1">
            <QrDeskGenerator onSimulateScan={handleOpenCustomerPreview} />
          </main>
        </div>
      ) : (
        /* ================================================================= */
        /* KONDISI 2: TAMPILAN PETUGAS / OPERATOR / SUPERVISOR               */
        /* MENAMPILKAN DASHBOARD DAN BARCODE SCAN UNTUK PELAPOR              */
        /* ================================================================= */
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SagiLogo size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-tight text-slate-900">
                      SAGI 127
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      DASHBOARD & BARCODE LAYANAN
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Sistem Pemantauan CSAT & Generator Barcode Pelapor Walk-in CS
                  </p>
                </div>
              </div>

              {/* Quick Navigation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('standee')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Cetak QR Barcode Meja Layanan</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Dashboard & Barcode Content */}
          <main className="flex-1">
            <AdminDashboard
              responses={responses}
              onClearData={handleClearData}
              onResetSeedData={handleResetSeedData}
              onOpenCustomerPreview={handleOpenCustomerPreview}
              onOpenStandeePrint={() => setActiveMode('standee')}
              realtimeStatus={realtimeStatus}
              latestNewResponseId={latestNewResponse?.id}
            />
          </main>

          {/* Real-time Notification Toast when new survey is submitted */}
          {showToast && latestNewResponse && (
            <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border-2 border-emerald-500 transition-all flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Survei Baru Masuk Real-Time
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowToast(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs font-bold text-white mt-1 truncate">
                  {latestNewResponse.desk} — {latestNewResponse.serviceType}
                </p>
                <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
                  <span className="font-semibold text-amber-300">★ {latestNewResponse.averageRating}</span>
                  {latestNewResponse.officerName && (
                    <span className="text-slate-400">Petugas: {latestNewResponse.officerName}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="no-print border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">
                  Layanan Terpadu SAGI 127 Offline (Walk-in Customer Service)
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Barcode mengarahkan pelapor ke form survei terisolasi tanpa akses dashboard.
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
