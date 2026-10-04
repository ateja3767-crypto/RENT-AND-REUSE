import React from 'react';
import { AuthPage } from './AuthPage';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentTab?: (tab: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, setCurrentTab }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl my-4 sm:my-8 bg-transparent">
        {/* Floating close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 sm:top-3 sm:right-3 z-30 w-8 h-8 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          aria-label="Close authentication modal"
        >
          <X className="w-4 h-4" />
        </button>

        <AuthPage
          onSuccess={onClose}
          setCurrentTab={(tab) => {
            if (setCurrentTab) setCurrentTab(tab);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
