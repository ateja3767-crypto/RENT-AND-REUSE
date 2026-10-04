import React, { useState } from 'react';
import { Sparkles, Package, ShoppingBag, Check, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { DemoRole } from '../../types';

interface DemoSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: DemoRole) => void;
}

export const DemoSelectModal: React.FC<DemoSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<DemoRole>('owner');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant Guest Experience</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Explore RentReuse as a demo student
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose a campus persona to test peer lending without creating an account.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close demo modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two Persona Choices */}
        <div className="space-y-3">
          {/* Option 1: Demo Owner */}
          <div
            onClick={() => setSelectedRole('owner')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedRole === 'owner'
                ? 'border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              selectedRole === 'owner'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              <Package className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Demo Owner (Aarav - Senior)
                </span>
                {selectedRole === 'owner' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Has items listed (drafting kit, TI-84 calculator, microscope), manages incoming rental requests, pauses listings, and inspects returned gear.
              </p>
            </div>
          </div>

          {/* Option 2: Demo Borrower */}
          <div
            onClick={() => setSelectedRole('borrower')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedRole === 'borrower'
                ? 'border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              selectedRole === 'borrower'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              <ShoppingBag className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Demo Borrower (Sofia - Junior)
                </span>
                {selectedRole === 'borrower' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Browses campus equipment catalog, places new rental requests, checks out active borrows with return reminders, and posts on the Wanted board.
              </p>
            </div>
          </div>
        </div>

        {/* Safety & Isolation Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Demo data is safe, isolated in local memory, and can be switched or reset anytime.</span>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            onClick={() => onSelectRole(selectedRole)}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue as Demo {selectedRole === 'owner' ? 'Owner' : 'Borrower'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
