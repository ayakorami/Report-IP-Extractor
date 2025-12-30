
import React, { useState, useCallback, useMemo } from 'react';
import { Drop, GlobalStats, ViewMode } from './types.ts';
import { FileUpload } from './components/FileUpload.tsx';
import { DropCard } from './components/DropCard.tsx';
import { StatsTable } from './components/StatsTable.tsx';

const App: React.FC = () => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DROPS);

  const parseFile = useCallback((content: string, name: string) => {
    setFileName(name);
    const lines = content.split(/\r?\n/);
    const newDrops: Drop[] = [];
    let currentDrop: Drop | null = null;

    const headerRegex = /DROP\s+(\d+)\s*:\s*(\d{1,2}:\d{2})/i;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const headerMatch = trimmed.match(headerRegex);
      if (headerMatch) {
        if (currentDrop) {
          currentDrop.uniqueValues = Array.from(new Set(currentDrop.rawValues));
          newDrops.push(currentDrop);
        }
        currentDrop = {
          id: headerMatch[1],
          time: headerMatch[2],
          rawValues: [],
          uniqueValues: []
        };
      } else if (currentDrop) {
        const cleanLine = trimmed.replace(/['"]/g, '');
        const isSeparator = /^[\.\-\*\s]+$/.test(cleanLine);
        const hasContent = /[a-zA-Z0-9]/.test(cleanLine);

        if (cleanLine && hasContent && !isSeparator && !cleanLine.includes('...')) {
          currentDrop.rawValues.push(cleanLine);
        }
      }
    });

    if (currentDrop) {
      currentDrop.uniqueValues = Array.from(new Set(currentDrop.rawValues));
      newDrops.push(currentDrop);
    }

    setDrops(newDrops);
    setActiveView(ViewMode.DROPS);
  }, []);

  const globalStats = useMemo((): GlobalStats[] => {
    const counts: Record<string, number> = {};
    drops.forEach(drop => {
      drop.rawValues.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
      });
    });

    return Object.entries(counts).map(([value, count]) => ({
      value,
      count
    }));
  }, [drops]);

  const downloadAsHtml = () => {
    if (drops.length === 0) return;

    const sortedStats = [...globalStats].sort((a, b) => b.count - a.count);
    
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const firstWord = baseName.split(/[\s_-]/)[0] || 'Report';
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    const fileSafeDate = `${day}.${month}.${year}`;

    const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report IP Extractor - ${firstWord}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; padding: 3rem 1rem; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .hidden { display: none !important; }
        @media print {
            .no-print { display: none !important; }
            #drops-view, #stats-view { display: block !important; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="max-w-6xl mx-auto">
        <header class="mb-12 text-center">
            <h1 class="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                Report IP <span class="text-indigo-600">Extractor</span>
            </h1>
            <p class="text-slate-500 text-lg">Analyzed report from ${firstWord} - Generated ${formattedTimestamp}</p>
        </header>

        <div class="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 no-print">
            <div class="flex items-center justify-start bg-white p-2 rounded-2xl shadow-sm border border-slate-100 gap-2 w-full md:w-auto">
                <button id="btn-drops" onclick="showTab('drops')" 
                    class="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all bg-indigo-600 text-white shadow-indigo-200 shadow-lg">
                    Drops List (${drops.length})
                </button>
                <button id="btn-stats" onclick="showTab('stats')" 
                    class="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50">
                    Global Stats (${globalStats.length})
                </button>
            </div>
        </div>

        <div id="drops-view" class="animate-in fade-in duration-300">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${drops.map(drop => `
                <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
                    <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <div class="flex items-center space-x-3">
                            <span class="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">DROP ${drop.id}</span>
                            <span class="text-slate-700 font-semibold text-lg">${drop.time}</span>
                        </div>
                        <div class="text-slate-400 text-xs">${drop.uniqueValues.length} Items</div>
                    </div>
                    <div class="p-4 flex-grow">
                        <div class="max-h-[210px] overflow-y-auto pr-1 custom-scrollbar">
                            <ul class="space-y-2">
                                ${drop.uniqueValues.map(val => `
                                <li class="flex items-center text-slate-600 font-mono text-sm bg-slate-50 p-2 rounded border border-slate-50">
                                    <span class="w-2 h-2 bg-indigo-400 rounded-full mr-3 shrink-0"></span>
                                    <span class="truncate">${val}</span>
                                </li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
        </div>

        <div id="stats-view" class="hidden animate-in fade-in duration-300">
            <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50">
                    <div class="flex flex-col gap-6">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 class="text-xl font-bold text-slate-800">Global IP Statistics</h2>
                            <div class="flex items-center gap-2 no-print">
                                <button 
                                    onclick="exportStatsCsv()"
                                    class="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Excel
                                </button>
                                <button 
                                    id="copy-btn"
                                    onclick="copyIps()"
                                    class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                    Copy IPs
                                </button>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                            <div class="md:col-span-2 space-y-1">
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Search IPs / Values</label>
                                <div class="relative">
                                    <textarea 
                                        id="stats-search"
                                        placeholder="Paste IPs to search..." 
                                        oninput="applyAllFilters()"
                                        rows="2"
                                        class="pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all resize-none text-sm font-mono"
                                    ></textarea>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                            
                            <div class="space-y-1">
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Exact Occurrences</label>
                                <div class="relative">
                                    <textarea 
                                        id="occ-search"
                                        placeholder="e.g. 1, 3, 5" 
                                        oninput="applyAllFilters()"
                                        rows="2"
                                        class="pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all resize-none text-sm font-mono"
                                    ></textarea>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div id="results-count" class="text-xs text-slate-400 font-medium px-1 no-print">
                            Showing ${sortedStats.length} items
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left" id="stats-table">
                        <thead>
                            <tr class="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                <th class="px-6 py-4">IP Address / Value</th>
                                <th class="px-6 py-4 text-right">Occurrences</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100" id="stats-body">
                            ${sortedStats.map(item => `
                                <tr class="stats-row hover:bg-indigo-50/30 transition-colors" data-count="${item.count}">
                                    <td class="px-6 py-4 font-mono text-slate-700 text-sm font-medium value-cell">${item.value}</td>
                                    <td class="px-6 py-4 text-right">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 count-cell">
                                            ${item.count}
                                        </span>
                                    </td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <footer class="mt-24 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
            &copy; 2025 By CMHW Team, All rights reserved.
        </footer>
    </div>

    <script>
        function showTab(view) {
            const dropsView = document.getElementById('drops-view');
            const statsView = document.getElementById('stats-view');
            const btnDrops = document.getElementById('btn-drops');
            const btnStats = document.getElementById('btn-stats');
            const active = ['bg-indigo-600', 'text-white', 'shadow-indigo-200', 'shadow-lg'];
            const inactive = ['text-slate-600', 'hover:bg-slate-50'];

            if (view === 'drops') {
                dropsView.classList.remove('hidden');
                statsView.classList.add('hidden');
                btnDrops.classList.add(...active);
                btnDrops.classList.remove(...inactive);
                btnStats.classList.add(...inactive);
                btnStats.classList.remove(...active);
            } else {
                dropsView.classList.add('hidden');
                statsView.classList.remove('hidden');
                btnStats.classList.add(...active);
                btnStats.classList.remove(...inactive);
                btnDrops.classList.add(...inactive);
                btnDrops.classList.remove(...active);
            }
        }

        function applyAllFilters() {
            const ipQuery = document.getElementById('stats-search').value;
            const occQuery = document.getElementById('occ-search').value;

            const ipTerms = ipQuery.split(/[\\s\\n,]+/).map(t => t.trim().toLowerCase()).filter(t => t !== '');
            const occTerms = occQuery.split(/[\\s\\n,]+/).map(t => parseInt(t.trim())).filter(t => !isNaN(t));
            
            const rows = document.querySelectorAll('.stats-row');
            let visibleCount = 0;
            
            rows.forEach(row => {
                const value = row.querySelector('.value-cell').textContent.toLowerCase();
                const count = parseInt(row.getAttribute('data-count'));
                
                const matchesIp = ipTerms.length === 0 || ipTerms.some(term => value.includes(term));
                const matchesOcc = occTerms.length === 0 || occTerms.includes(count);
                
                const isVisible = matchesIp && matchesOcc;
                row.classList.toggle('hidden', !isVisible);
                if (isVisible) visibleCount++;
            });

            document.getElementById('results-count').innerText = 'Showing ' + visibleCount + ' items';
        }

        function copyIps() {
            const rows = Array.from(document.querySelectorAll('.stats-row:not(.hidden)'));
            const ips = rows.map(row => row.querySelector('.value-cell').textContent.trim()).join('\\n');
            navigator.clipboard.writeText(ips).then(() => {
                const btn = document.getElementById('copy-btn');
                const originalHtml = btn.innerHTML;
                btn.innerText = 'Copied!';
                btn.classList.add('bg-green-50', 'text-green-600', 'border-green-200');
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.remove('bg-green-50', 'text-green-600', 'border-green-200');
                }, 2000);
            });
        }

        function exportStatsCsv() {
            const rows = Array.from(document.querySelectorAll('.stats-row:not(.hidden)'));
            if (rows.length === 0) return;
            
            let csv = 'IP Address/Value,Occurrences\\n';
            rows.forEach(row => {
                const val = row.querySelector('.value-cell').textContent.trim();
                const count = row.querySelector('.count-cell').textContent.trim();
                csv += \`"\${val}",\${count}\\n\`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ip_extractor_stats_export.csv';
            a.click();
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;

    const blob = new Blob([htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${firstWord}_report_${fileSafeDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Report IP <span className="text-indigo-600">Extractor</span>
        </h1>
        <p className="text-slate-500 text-lg">Extract, deduplicate, and analyze IP traffic from your log reports with ease.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <FileUpload onFileLoaded={parseFile} isLoading={false} />

        {drops.length > 0 && (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-start bg-white p-2 rounded-2xl shadow-sm border border-slate-100 gap-2 w-full md:w-auto">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveView(ViewMode.DROPS)}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeView === ViewMode.DROPS 
                        ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Drops List ({drops.length})
                  </button>
                  <button
                    onClick={() => setActiveView(ViewMode.STATS)}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeView === ViewMode.STATS 
                        ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Global Stats ({globalStats.length})
                  </button>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={downloadAsHtml}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl text-sm font-semibold shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Analysis (.html)
                </button>
              </div>
            </div>

            <main className="min-h-[400px]">
              {activeView === ViewMode.DROPS && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {drops.map((drop, idx) => (
                    <DropCard key={idx} drop={drop} />
                  ))}
                </div>
              )}

              {activeView === ViewMode.STATS && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <StatsTable stats={globalStats} />
                </div>
              )}
            </main>
          </>
        )}
        
        {drops.length === 0 && (
          <div className="py-24 text-center">
            <div className="inline-flex items-center justify-center p-6 bg-slate-50 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-400">Waiting for data...</h3>
            <p className="text-slate-400 text-sm mt-2">Upload your log file to begin analysis</p>
          </div>
        )}
      </div>

      <footer className="mt-24 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
        &copy; 2025 <b>By CMHW Team</b>, All rights reserved.
      </footer>
    </div>
  );
};

export default App;
