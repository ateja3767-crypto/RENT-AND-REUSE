import React from 'react';
import { useApp } from '../context/AppContext';
import { Leaf, IndianRupee, Repeat, Award, BarChart3, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { formatINR } from '../utils/currency';

export const ImpactPage: React.FC = () => {
  const { calculateImpactStats, users } = useApp();
  const impact = calculateImpactStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
          <Leaf className="w-3.5 h-3.5" />
          <span>Campus Circular Economy & Sustainability</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          RentReuse Campus Impact
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Every tool, drafting kit, and textbook borrowed instead of purchased represents real savings for student bank accounts and tons of diverted dormitory waste.
        </p>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatINR(impact.totalMoneySaved)}
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Student Savings (INR)</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Rupees saved compared to full retail equipment purchase.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Repeat className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {impact.totalItemsReused}+
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Items Circulated</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Semester gear shared between seniors, juniors, and peers.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {impact.totalKgWasteDiverted} kg
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">E-Waste & Trash Diverted</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Kept out of local university landfill dumpsters during move-out.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {users.length}
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Verified Student Lenders</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Authenticated with campus .edu credentials.
          </p>
        </div>
      </div>

      {/* Dynamic Department Leaderboard */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Campus Department Reuse Leaderboard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live department metrics dynamically computed from shared listings and completed rentals.
            </p>
          </div>
          <Award className="w-6 h-6 text-amber-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-2">Rank & Department</th>
                <th className="py-3 px-2">Total Student Savings</th>
                <th className="py-3 px-2">Items Shared</th>
                <th className="py-3 px-2">Waste Diverted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {impact.departmentStats.map((item, idx) => (
                <tr key={item.dept} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-2 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 text-slate-400 tabular-nums">0{idx + 1}.</span>
                    <span>{item.dept}</span>
                  </td>
                  <td className="py-3.5 px-2 font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatINR(item.saved)}
                  </td>
                  <td className="py-3.5 px-2 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    {item.itemsCount} items
                  </td>
                  <td className="py-3.5 px-2 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    {item.wasteKg} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
