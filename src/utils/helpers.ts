export const getRatingEmoji = (score: number): { emoji: string; label: string; color: string; bg: string; border: string } => {
  switch (score) {
    case 1:
      return {
        emoji: '😞',
        label: 'Sangat Kurang',
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-300',
      };
    case 2:
      return {
        emoji: '🙁',
        label: 'Kurang',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-300',
      };
    case 3:
      return {
        emoji: '😐',
        label: 'Cukup',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-300',
      };
    case 4:
      return {
        emoji: '🙂',
        label: 'Baik / Puas',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        border: 'border-teal-300',
      };
    case 5:
      return {
        emoji: '🤩',
        label: 'Sangat Baik / Sangat Puas',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
      };
    default:
      return {
        emoji: '✨',
        label: 'Pilih Nilai',
        color: 'text-slate-500',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
      };
  }
};

export const getScoreColorClass = (score: number) => {
  if (score >= 4.5) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 3.8) return 'text-teal-600 bg-teal-50 border-teal-200';
  if (score >= 3.0) return 'text-amber-600 bg-amber-50 border-amber-200';
  if (score >= 2.0) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
};

export const formatDateIndonesian = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return dateStr;
  }
};
