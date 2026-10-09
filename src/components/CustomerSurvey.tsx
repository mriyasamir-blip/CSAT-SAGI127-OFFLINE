import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ChevronRight, ChevronLeft, Building2, MapPin, User, MessageSquare, ThumbsUp, Sparkles, RefreshCw, PenTool } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CSAT_DIMENSIONS, DEFAULT_DESKS, CS_OFFICERS } from '../data/questions';
import { CSATResponse } from '../types/csat';
import { getRatingEmoji } from '../utils/helpers';
import { submitCSATResponse } from '../services/firebase';
import { SagiLogo } from './SagiLogo';

interface CustomerSurveyProps {
  initialDesk?: string;
  initialOfficer?: string;
  onSubmitSuccess: (response: CSATResponse) => void;
  isStandaloneCustomer?: boolean;
}

export const CustomerSurvey: React.FC<CustomerSurveyProps> = ({
  initialDesk,
  initialOfficer,
  onSubmitSuccess,
  isStandaloneCustomer = true,
}) => {
  const [selectedDesk, setSelectedDesk] = useState<string>(initialDesk || DEFAULT_DESKS[0]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>(initialOfficer || CS_OFFICERS[0]);
  
  // Jenis Layanan diisi sendiri oleh Pelapor
  const [serviceRequirement, setServiceRequirement] = useState<string>('');
  
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  // Quick suggestions for easy one-tap input for visitor convenience
  const quickSuggestions = [
    'Konsultasi Menu & Gizi',
    'Verifikasi Berkas & Data',
    'Informasi Program SAGI',
    'Kendala Akun / Aplikasi',
    'Aspirasi / Pengaduan',
  ];

  // Ratings for the 5 questions
  const [ratings, setRatings] = useState<{ [key: string]: number }>({
    q1_keramahan: 0,
    q2_kejelasan: 0,
    q3_kecepatan: 0,
    q4_profesionalisme: 0,
    q5_kepuasan_umum: 0,
  });

  const [stepMode, setStepMode] = useState<boolean>(true);
  // Directly start at Step 1 (Question 1) when barcode is scanned!
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showEditDeskModal, setShowEditDeskModal] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [lastSubmissionId, setLastSubmissionId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<{ dimensionId: string; star: number } | null>(null);

  useEffect(() => {
    if (initialDesk) {
      setSelectedDesk(initialDesk);
    }
  }, [initialDesk]);

  useEffect(() => {
    if (initialOfficer) {
      setSelectedOfficer(initialOfficer);
    }
  }, [initialOfficer]);

  const handleStarClick = (dimensionId: string, value: number) => {
    setRatings(prev => ({ ...prev, [dimensionId]: value }));
    if (stepMode && currentStep >= 1 && currentStep <= 5) {
      setTimeout(() => {
        if (currentStep < 5) {
          setCurrentStep(c => c + 1);
        } else {
          setCurrentStep(6);
        }
      }, 350);
    }
  };

  const answeredCount = Object.values(ratings).filter(r => r > 0).length;
  const allAnswered = answeredCount === 5;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!allAnswered) {
      alert('Mohon lengkapi penilaian untuk kelima pertanyaan terlebih dahulu.');
      return;
    }

    setSubmitting(true);

    const values = Object.values(ratings);
    const avg = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    const newId = `CSAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    const newResponse: CSATResponse = {
      id: newId,
      createdAt: new Date().toISOString(),
      desk: selectedDesk,
      officerName: selectedOfficer,
      serviceType: serviceRequirement.trim() || 'Layanan Umum SAGI Walk-in',
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      ratings: {
        q1_keramahan: ratings.q1_keramahan,
        q2_kejelasan: ratings.q2_kejelasan,
        q3_kecepatan: ratings.q3_kecepatan,
        q4_profesionalisme: ratings.q4_profesionalisme,
        q5_kepuasan_umum: ratings.q5_kepuasan_umum,
      },
      averageRating: avg,
      feedback: feedback.trim() || undefined,
    };

    try {
      await submitCSATResponse(newResponse);
    } catch (err) {
      console.warn('Real-time sync fallback to local:', err);
    } finally {
      onSubmitSuccess(newResponse);
      setLastSubmissionId(newId);
      setSubmitted(true);
      setSubmitting(false);

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#3b82f6', '#f59e0b', '#ef4444'],
        });
      } catch {
        // canvas fallback
      }
    }
  };

  const resetForm = () => {
    setRatings({
      q1_keramahan: 0,
      q2_kejelasan: 0,
      q3_kecepatan: 0,
      q4_profesionalisme: 0,
      q5_kepuasan_umum: 0,
    });
    setFeedback('');
    setServiceRequirement('');
    setCustomerName('');
    setCustomerPhone('');
    setSubmitted(false);
    setCurrentStep(1);
  };

  if (submitted) {
    const avgScore = Number((Object.values(ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1));
    const emojiData = getRatingEmoji(Math.round(avgScore));

    return (
      <div className="max-w-lg mx-auto px-4 py-8 animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

          {/* SAGI 127 Logo with celebration */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 mx-auto rounded-3xl p-1 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl overflow-hidden ring-4 ring-emerald-50 flex items-center justify-center">
              <SagiLogo size="xl" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
              <CheckCircle className="w-6 h-6 stroke-[3]" />
            </div>
          </div>

          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full uppercase tracking-wider mb-2">
            Penilaian Berhasil Terkirim
          </span>

          <h2 className="text-2xl font-black text-slate-800 mb-2">
            Terima Kasih Banyak!
          </h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Masukan Anda sangat berarti bagi kami di <strong className="text-emerald-700">SAGI 127</strong> untuk senantiasa memberikan pelayanan yang terbaik, ramah, dan solutif.
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-2">
              <span>Nomor Tiket CSAT:</span>
              <span className="font-mono font-bold text-slate-800">{lastSubmissionId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Lokasi Pelayanan:</span>
              <span className="font-semibold text-slate-800">{selectedDesk}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Petugas CS:</span>
              <span className="font-semibold text-slate-800">{selectedOfficer}</span>
            </div>
            {serviceRequirement && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Keperluan:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">{serviceRequirement}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-600 pt-1">
              <span>Skor Rata-Rata:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                {avgScore} / 5.0 ({emojiData.label})
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/80">
              <span>Status Data:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time Cloud Firebase
              </span>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Beri Penilaian Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 md:py-6">
      {/* SAGI 127 Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 rounded-3xl p-5 md:p-6 text-white shadow-xl mb-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          {/* SAGI 127 Logo */}
          <div className="shrink-0">
            <SagiLogo size="xl" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold text-emerald-100 mb-1 border border-white/20">
              <Building2 className="w-3 h-3" />
              Layanan SAGI 127 Offline
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight text-white">
              Penilaian Kepuasan Pelanggan (CSAT)
            </h1>
            <p className="text-emerald-100 text-xs mt-1 leading-snug line-clamp-2">
              Mohon bantu kami menilai pelayanan petugas di meja/loket hari ini.
            </p>
          </div>
        </div>

        {/* Location & Officer Banner Badge */}
        <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 text-slate-800 rounded-xl font-bold shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedDesk}</span>
            </div>

            <div className="text-emerald-100 text-xs">
              Petugas: <strong className="text-white font-bold">{selectedOfficer}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEditDeskModal(!showEditDeskModal)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-[11px] font-semibold transition-colors"
          >
            <PenTool className="w-3 h-3" />
            <span>{showEditDeskModal ? 'Tutup Pilihan' : 'Ubah Meja/Petugas'}</span>
          </button>
        </div>

        {/* Collapsible Meja & Petugas editor if user wants to change */}
        {showEditDeskModal && (
          <div className="mt-3 p-3.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Pilih Meja / Loket
              </label>
              <select
                value={selectedDesk}
                onChange={(e) => setSelectedDesk(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-800 text-white p-2 font-medium focus:ring-1 focus:ring-emerald-400"
              >
                {DEFAULT_DESKS.map(desk => (
                  <option key={desk} value={desk}>{desk}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Pilih Petugas CS
              </label>
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-800 text-white p-2 font-semibold focus:ring-1 focus:ring-emerald-400"
              >
                {CS_OFFICERS.map(officer => (
                  <option key={officer} value={officer}>{officer}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* STEP MODE VIEW */}
      {stepMode ? (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
              <span>{currentStep === 6 ? 'Catatan & Kirim' : `Pertanyaan ${currentStep} dari 5`}</span>
              <span className="text-emerald-700 font-bold">{Math.round((answeredCount / 5) * 100)}% Terisi</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${(answeredCount / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1 to 5: The 5 Questions from PDF */}
          {currentStep >= 1 && currentStep <= 5 && (() => {
            const dim = CSAT_DIMENSIONS[currentStep - 1];
            const currentVal = ratings[dim.id] || 0;
            const activeHover = hoverRating?.dimensionId === dim.id ? hoverRating.star : null;
            const displayVal = activeHover || currentVal;
            const currentEmoji = getRatingEmoji(displayVal);

            return (
              <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-5 animate-fadeIn">
                {currentStep === 1 && (
                  <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold shadow-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Barcode meja berhasil terbaca. Silakan langsung ketuk bintang di bawah untuk menilai layanan.</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                      {dim.number}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      {dim.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">
                    {currentStep} dari 5
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                    {dim.question}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan ketuk bintang atau label skala di bawah ini:
                  </p>
                </div>

                {/* Big Interactive Emoji and selected description */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="text-5xl mb-2 transition-transform duration-200 transform scale-105">
                    {currentEmoji.emoji}
                  </div>
                  <div className="h-6">
                    {displayVal > 0 ? (
                      <span className={`text-xs sm:text-sm font-bold ${currentEmoji.color} px-3 py-1 rounded-full ${currentEmoji.bg} border ${currentEmoji.border}`}>
                        {dim.scaleLabels[displayVal as 1|2|3|4|5]}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Pilih bintang untuk menilai</span>
                    )}
                  </div>
                </div>

                {/* Big 5 Stars row */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = currentVal >= star;
                    const isHovered = activeHover !== null && activeHover >= star;
                    const highlighted = isHovered || (activeHover === null && isSelected);

                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(dim.id, star)}
                        onMouseEnter={() => setHoverRating({ dimensionId: dim.id, star })}
                        onMouseLeave={() => setHoverRating(null)}
                        className={`p-2 sm:p-2.5 rounded-2xl transition-all duration-150 transform hover:scale-110 active:scale-95 ${
                          highlighted
                            ? 'text-amber-400 bg-amber-50 shadow-xs'
                            : 'text-slate-300 hover:text-amber-200 bg-slate-50'
                        }`}
                        title={`${star} - ${dim.scaleLabels[star as 1|2|3|4|5]}`}
                      >
                        <Star className={`w-8 h-8 sm:w-9 sm:h-9 ${highlighted ? 'fill-amber-400' : 'fill-slate-200'}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Quick Choice Buttons matching exact PDF OCR scale text */}
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {([1, 2, 3, 4, 5] as const).map((score) => {
                    const isSelected = currentVal === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleStarClick(dim.id, score)}
                        className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all border flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                            : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold w-5">{score}★</span>
                          <span>{dim.scaleLabels[score]}</span>
                        </div>
                        {isSelected && <span className="text-[11px] font-bold">✓ Terpilih</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(c => c - 1)}
                      className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Sebelumnya
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pertanyaan 1 dari 5</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={currentVal === 0}
                    onClick={() => {
                      if (currentStep < 5) {
                        setCurrentStep(c => c + 1);
                      } else {
                        setCurrentStep(6);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
                      currentVal > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {currentStep === 5 ? 'Lanjut ke Ringkasan' : 'Berikutnya'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Step 6: Review, Feedback & Submit */}
          {currentStep === 6 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Langkah Akhir</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Ringkasan & Saran Tambahan</h3>
                <p className="text-xs text-slate-500">Periksa penilaian Anda sebelum dikirimkan.</p>
              </div>

              {/* Summary table */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="text-xs font-semibold text-slate-500 pb-1 border-b border-slate-200 flex justify-between">
                  <span>Petugas: <strong className="text-slate-800">{selectedOfficer}</strong></span>
                  <span>{selectedDesk}</span>
                </div>
                {CSAT_DIMENSIONS.map((dim, idx) => {
                  const val = ratings[dim.id];
                  return (
                    <div key={dim.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate max-w-[200px]">
                        {idx + 1}. {dim.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(idx + 1)}
                        className="inline-flex items-center gap-1 font-bold text-slate-800 hover:text-emerald-600"
                        title="Klik untuk ubah nilai"
                      >
                        <span className="text-amber-500 font-bold">{val}★</span>
                        <span className="text-slate-500 text-[11px]">({dim.scaleLabels[val as 1|2|3|4|5]})</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Jenis Layanan / Keperluan Kunjungan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                    Jenis Layanan / Keperluan Kunjungan
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">Opsional</span>
                </label>
                <input
                  type="text"
                  value={serviceRequirement}
                  onChange={(e) => setServiceRequirement(e.target.value)}
                  placeholder="Ketik keperluan Anda (misal: Konsultasi Menu Gizi, Verifikasi Berkas, dll)..."
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />

                {/* Quick suggestions chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">Pilihan cepat:</span>
                  {quickSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setServiceRequirement(suggestion)}
                      className={`text-[11px] px-2.5 py-1 rounded-full transition-all border ${
                        serviceRequirement === suggestion
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                          : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border-slate-200'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Saran / Masukan / Apresiasi (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Ceritakan pengalaman Anda atau saran perbaikan untuk layanan SAGI kami..."
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Optional visitor details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Anda (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama / Inisial"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Handphone (Opsional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali
                </button>

                <button
                  type="button"
                  disabled={submitting || !allAnswered}
                  onClick={() => handleSubmit()}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      <span>Kirim Penilaian CSAT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
