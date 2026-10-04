import React from 'react';
import { ShieldCheck, Award, Zap, Clock } from 'lucide-react';

interface TrustBadgeProps {
  type: 'verified' | 'super_lender' | 'fast_responder' | 'on_time' | 'trust_score';
  score?: number;
  size?: 'sm' | 'md';
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ type, score, size = 'sm' }) => {
  const isSmall = size === 'sm';
  const iconSize = isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textSize = isSmall ? 'text-xs' : 'text-sm';

  switch (type) {
    case 'verified':
      return (
        <span className={`inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400 ${textSize}`}>
          <ShieldCheck className={`${iconSize} text-emerald-600 dark:text-emerald-400`} />
          <span>Verified Student</span>
        </span>
      );
    case 'super_lender':
      return (
        <span className={`inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400 ${textSize}`}>
          <Award className={`${iconSize} text-amber-600 dark:text-amber-400`} />
          <span>Super Lender</span>
        </span>
      );
    case 'fast_responder':
      return (
        <span className={`inline-flex items-center gap-1 font-medium text-sky-700 dark:text-sky-400 ${textSize}`}>
          <Zap className={`${iconSize} text-sky-600 dark:text-sky-400`} />
          <span>Fast Responder</span>
        </span>
      );
    case 'on_time':
      return (
        <span className={`inline-flex items-center gap-1 font-medium text-teal-700 dark:text-teal-400 ${textSize}`}>
          <Clock className={`${iconSize} text-teal-600 dark:text-teal-400`} />
          <span>100% On-time</span>
        </span>
      );
    case 'trust_score':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100 ${textSize}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="tabular-nums">{score ?? 95}</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal">/ 100 Trust</span>
        </span>
      );
    default:
      return null;
  }
};
