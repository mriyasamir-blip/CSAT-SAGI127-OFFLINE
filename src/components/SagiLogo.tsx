import React, { useState } from 'react';
import sagiMascotHD from '../assets/images/sagi_127_hd_1791074628003.jpg';

interface SagiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'badge' | 'full';
  showSubtitle?: boolean;
}

export const SagiLogo: React.FC<SagiLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'badge',
  showSubtitle = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: { box: 'w-8 h-8', text: 'text-sm', badge: 'text-[9px] px-1 py-0.2' },
    md: { box: 'w-11 h-11', text: 'text-base', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { box: 'w-14 h-14', text: 'text-xl', badge: 'text-xs px-2 py-0.5' },
    xl: { box: 'w-20 h-20', text: 'text-2xl', badge: 'text-sm px-2.5 py-1' },
    '2xl': { box: 'w-28 h-28', text: 'text-3xl', badge: 'text-base px-3 py-1' },
  };

  const { box, text, badge } = sizeMap[size];

  // Official HD 3D Mascot Character with ESM bundled asset and multi-tier fallback
  const hdEmblem = (
    <div
      className={`${box} rounded-2xl bg-white p-0.5 shadow-md flex items-center justify-center shrink-0 border-2 border-emerald-400/40 select-none overflow-hidden relative ring-2 ring-emerald-50`}
    >
      {!imgError ? (
        <img
          src={sagiMascotHD || '/sagi_127_hd.jpg'}
          alt="Maskot SAGI 127 HD"
          className="w-full h-full object-contain transform scale-105"
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('/sagi_127_hd.jpg')) {
              target.src = '/sagi_127_hd.jpg';
            } else if (!target.src.includes('/sagi_127.jpg')) {
              target.src = '/sagi_127.jpg';
            } else {
              setImgError(true);
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex flex-col items-center justify-center text-white font-black text-center p-0.5">
          <span className="text-[10px] leading-tight">SAGI</span>
          <span className="text-[9px] bg-amber-400 text-slate-900 px-1 rounded-sm leading-tight">127</span>
        </div>
      )}
    </div>
  );

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {hdEmblem}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {hdEmblem}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-slate-900 ${text}`}>
            SAGI
          </span>
          <span className={`font-black bg-emerald-600 text-white rounded-md tracking-wider shadow-xs ${badge}`}>
            127
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-slate-500 font-semibold tracking-normal mt-0.5">
            Layanan Terpadu & CS Offline
          </span>
        )}
      </div>
    </div>
  );
};

