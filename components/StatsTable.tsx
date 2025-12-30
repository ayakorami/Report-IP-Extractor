
import React, { useState, useMemo } from 'react';
import { GlobalStats } from '../types';

interface StatsTableProps {
  stats: GlobalStats[];
}

export const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [occurrenceSearch, setOccurrenceSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredStats = useMemo(() => {
    // Parse IP/Value search terms (supports multiple IPs separated by space, comma, or newline)
    const ipTerms = searchTerm
      .split(/[\s\n,]+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t !== '');

    // Parse Exact Occurrence terms (e.g. "1, 5" matches items appearing exactly 1 or 5 times)
    const countTerms = occurrenceSearch
      .split(/[\s\n,]+/)
      .map(t => parseInt(t.trim()))
      .filter(t => !isNaN(t));

    return stats
      .filter(s => {
        // Occurrence Filter (Exact match with any provided number)
        if (countTerms.length > 0 && !countTerms.includes(s.count)) {
          return false;
        }

        // Text Search Filter
        if (ipTerms.length === 0) return true;
        const val = s.value.toLowerCase();
        return ipTerms.some(term => val.includes(term));
      })
      .sort((a, b) => b.count - a.count);
  }, [stats, searchTerm, occurrenceSearch]);

  const copyToClipboard = () => {
    const textToCopy = filteredStats.map(s => s.value).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const exportToCsv = () => {
    if (filteredStats.length === 0) return;
    
    // Create CSV content compatible with Excel
    const headers = ['IP Address', 'Count'];
    const rows = filteredStats.map(s => `"${s.value.replace(/"/g, '""')}",${s.count}`);
    
    // Use UTF-8 BOM and sep=, for maximum Excel compatibility across all locales
    const csvContent = "\uFEFFsep=,\n" + headers.join(',') + '\n' + rows.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ip_stats_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Global IP Statistics</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">Aggregated occurrences across all parsed drops</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCsv}
                disabled={filteredStats.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel (CSV)
              </button>
              <button
                onClick={copyToClipboard}
                disabled={filteredStats.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                  copied 
                    ? 'bg-green-50 border-green-200 text-green-600' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
                } disabled:opacity-50`}
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
                {copied ? 'Copied!' : 'Copy List'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search IPs / Values</label>
              <div className="relative">
                <textarea 
                  placeholder="Paste IPs to search (multiple allowed)..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  rows={2}
                  className="pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all resize-none bg-white shadow-inner text-sm font-mono"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Exact Occurrences</label>
              <div className="relative">
                <textarea 
                  placeholder="e.g. 1, 3, 5" 
                  value={occurrenceSearch}
                  onChange={(e) => setOccurrenceSearch(e.target.value)}
                  rows={2}
                  className="pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all resize-none bg-white shadow-inner text-sm font-mono"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <div className="text-xs text-slate-400 font-medium">
              Showing <span className="text-indigo-600 font-bold">{filteredStats.length}</span> items
            </div>
            {searchTerm || occurrenceSearch ? (
              <button 
                onClick={() => { setSearchTerm(''); setOccurrenceSearch(''); }}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <th className="px-6 py-4">IP Address / Value</th>
              <th className="px-6 py-4 text-right">Occurrences</th>
              <th className="px-6 py-4 text-right">Prevalence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStats.map((item, idx) => {
              const maxCount = Math.max(...stats.map(s => s.count), 1);
              const percentage = (item.count / maxCount) * 100;
              
              return (
                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-700 text-sm font-medium">{item.value}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {item.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 w-48">
                    <div className="flex items-center justify-end">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
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
                <td colSpan={3} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-400 text-sm font-medium">No matches found for these filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
