
import React, { useState, useMemo } from 'react';
import { GlobalStats } from '../types';

interface StatsTableProps {
  stats: GlobalStats[];
}

export const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStats = useMemo(() => {
    return stats
      .filter(s => s.value.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.count - a.count);
  }, [stats, searchTerm]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">Global IP Statistics</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search values..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full md:w-64 transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">IP Address / Value</th>
              <th className="px-6 py-4 text-right">Occurrences</th>
              <th className="px-6 py-4 text-right">Prevalence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStats.map((item, idx) => {
              const maxCount = Math.max(...stats.map(s => s.count));
              const percentage = (item.count / maxCount) * 100;
              
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-700 font-medium">{item.value}</td>
                  <td className="px-6 py-4 text-right font-semibold text-indigo-600">{item.count}</td>
                  <td className="px-6 py-4 w-48">
                    <div className="flex items-center justify-end">
                      <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px]">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full" 
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredStats.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                  No matches found for "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
