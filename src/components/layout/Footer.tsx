import React from 'react';
import { Leaf, ShieldCheck, HeartHandshake, MapPin } from 'lucide-react';
import { RentReuseLogo } from '../common/RentReuseLogo';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand col */}
          <div className="space-y-3">
            <button 
              onClick={() => setCurrentTab('landing')}
              className="text-left cursor-pointer group hover:opacity-90 transition-opacity"
              aria-label="RentReuse Home"
            >
              <RentReuseLogo size="sm" showSubtitle subtitleText="Campus Network" />
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Campus peer-to-peer equipment sharing. Borrow tools you need for a semester, pass forward items you no longer use.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Platform
            </div>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button onClick={() => setCurrentTab('browse')} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Browse All Items
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('wanted')} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Wanted Board
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('impact')} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Campus Impact Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('dashboard')} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  My Dashboard & Rentals
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Campus Trust & Safety
            </div>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified .edu student logins</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recommended safe pickup hubs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deposit protection & condition log</span>
              </li>
            </ul>
          </div>

          {/* Campus Initiative */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Green Initiative
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Proudly aligned with Student Government Sustainability initiatives to reduce campus e-waste and textbook expenditure.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div>© {new Date().getFullYear()} RentReuse Campus Initiative. Built for collegiate peer sharing.</div>
          <div className="flex items-center gap-4">
            <span>Library Foyer</span>
            <span>·</span>
            <span>Student Center</span>
            <span>·</span>
            <span>Tech Canteen</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
