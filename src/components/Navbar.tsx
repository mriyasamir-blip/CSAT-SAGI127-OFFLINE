import React from 'react';
import { ViewMode } from '../types/csat';
import { QrCode, BarChart3, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { SagiLogo } from './SagiLogo';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  responseCount: number;
  onExitToCustomerView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  responseCount,
  onExitToCustomerView,
}) => {
  return (
    <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand identity with SAGI 127 Mascot */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <SagiLogo size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-slate-900">
                  SAGI 127
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  PANEL PETUGAS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Customer Satisfaction (CSAT) Walk-in CS
              </p>
            </div>
          </div>

          <button
            onClick={onExitToCustomerView}
            className="sm:hidden flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl font-bold border border-emerald-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Mode Pelapor
          </button>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 w-full sm:w-auto justify-center">
          <button
            onClick={onExitToCustomerView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-white/60`}
            title="Buka form tampilan pelapor saat scan QR"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Form Pelapor (CSAT)</span>
          </button>

          <button
            onClick={() => onViewChange('qr-generator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'qr-generator'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Standee QR Meja</span>
          </button>

          <button
            onClick={() => onViewChange('admin-dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'admin-dashboard'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard CSAT</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-extrabold">
              {responseCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
