import React, { useState, useCallback, useMemo } from 'react';
import { Drop, GlobalStats, ViewMode } from './types';
import { FileUpload } from './components/FileUpload';
import { DropCard } from './components/DropCard';
import { StatsTable } from './components/StatsTable';

const App: React.FC = () => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DROPS);

  const parseFile = useCallback((content: string) => {
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
    const maxCount = Math.max(...globalStats.map(s => s.count), 1);
    
    const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report IP Extractor - Analytics</title>
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
            <p class="text-slate-500 text-lg">Analyzed report from ${new Date().toLocaleString()}</p>
        </header>

        <!-- Navigation Buttons -->
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

        <!-- DROPS VIEW -->
        <div id="drops-view" class="animate-in fade-in duration-300">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${drops.map(drop => `
                <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col h-full">
                    <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <div class="flex items-center space-x-3">
                            <span class="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">DROP ${drop.id}</span>
                            <span class="text-slate-700 font-semibold text-lg">${drop.time}</span>
                        </div>
                        <div class="text-slate-400 text-xs">${drop.uniqueValues.length} Items</div>
                    </div>
                    <div class="p-4">
                        <div class="max-h-[210px] overflow-y-auto pr-1 custom-scrollbar">
                            <ul class="space-y-2">
                                ${drop.uniqueValues.map(val => `
                                <li class="flex items-center text-slate-600 font-mono text-sm bg-slate-50 p-2 rounded border border-slate-50">
                                    <span class="w-2 h-2 bg-indigo-400 rounded-full mr-3 shrink-0"></span>
                                    <span class="truncate">${val}</span>
                                </li>`).join('')}
                            </ul>
                        </div>
                        ${drop.uniqueValues.length > 5 ? `
                        <div class="mt-2 text-center">
                            <p class="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Scroll for more</p>
                        </div>` : ''}
                    </div>
                </div>`).join('')}
            </div>
        </div>

        <!-- STATS VIEW -->
        <div id="stats-view" class="hidden animate-in fade-in duration-300">
            <div class="page-break"></div>
            <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 class="text-xl font-bold text-slate-800">Global IP Statistics</h2>
                        <div class="relative no-print">
                            <input 
                                type="text" 
                                id="stats-search"
                                placeholder="Search values..." 
                                oninput="filterStats(this.value)"
                                class="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full md:w-64 transition-all"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left" id="stats-table">
                        <thead>
                            <tr class="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th class="px-6 py-4">IP Address / Value</th>
                                <th class="px-6 py-4 text-right">Occurrences</th>
                                <th class="px-6 py-4 text-right">Prevalence</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100" id="stats-body">
                            ${sortedStats.map(item => {
                                const percentage = (item.count / maxCount) * 100;
                                return `
                                <tr class="stats-row">
                                    <td class="px-6 py-4 font-mono text-slate-700 font-medium value-cell">${item.value}</td>
                                    <td class="px-6 py-4 text-right font-semibold text-indigo-600">${item.count}</td>
                                    <td class="px-6 py-4 w-48">
                                        <div class="flex items-center justify-end">
                                            <div class="w-full bg-slate-100 rounded-full h-2 max-w-[100px]">
                                                <div class="bg-indigo-500 h-2 rounded-full" style="width: ${Math.max(percentage, 5)}%"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>`;
                            }).join('')}
                            <tr id="no-results" class="hidden">
                                <td colspan="3" class="px-6 py-12 text-center text-slate-400">No matches found</td>
                            </tr>
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

            const activeBtn = ['bg-indigo-600', 'text-white', 'shadow-indigo-200', 'shadow-lg'];
            const inactiveBtn = ['text-slate-600', 'hover:bg-slate-50'];

            if (view === 'drops') {
                dropsView.classList.remove('hidden');
                statsView.classList.add('hidden');
                btnDrops.classList.add(...activeBtn);
                btnDrops.classList.remove(...inactiveBtn);
                btnStats.classList.add(...inactiveBtn);
                btnStats.classList.remove(...activeBtn);
            } else {
                dropsView.classList.add('hidden');
                statsView.classList.remove('hidden');
                btnStats.classList.add(...activeBtn);
                btnStats.classList.remove(...inactiveBtn);
                btnDrops.classList.add(...inactiveBtn);
                btnDrops.classList.remove(...activeBtn);
            }
        }

        function filterStats(query) {
            const lowerQuery = query.toLowerCase();
            const rows = document.querySelectorAll('.stats-row');
            const noResults = document.getElementById('no-results');
            let visibleCount = 0;

            rows.forEach(row => {
                const value = row.querySelector('.value-cell').textContent.toLowerCase();
                if (value.includes(lowerQuery)) {
                    row.classList.remove('hidden');
                    visibleCount++;
                } else {
                    row.classList.add('hidden');
                }
            });

            if (visibleCount === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
            }
        }
    </script>
</body>
</html>`;

    const blob = new Blob([htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip_extraction_report.html`;
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
                  Download as HTML
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