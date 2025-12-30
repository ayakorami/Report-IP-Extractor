
import React, { useState, useCallback, useMemo } from 'react';
import { Drop, GlobalStats, ViewMode } from './types.ts';
import { FileUpload } from './components/FileUpload.tsx';
import { DropCard } from './components/DropCard.tsx';
import { StatsTable } from './components/StatsTable.tsx';

const App: React.FC = () => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DROPS);
  const [ipSearchQuery, setIpSearchQuery] = useState('');

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

  const searchTerms = useMemo(() => {
    return ipSearchQuery
      .split(/[\s\n,]+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t !== '');
  }, [ipSearchQuery]);

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

    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const firstWord = baseName.split(/[\s_-]/)[0] || 'Report';
    const now = new Date();
    const formattedTimestamp = now.toLocaleString();
    const fileSafeDate = now.toLocaleDateString().replace(/\//g, '.');

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
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; padding: 2rem 1rem; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .hidden { display: none !important; }
        .drop-card-item { transition: transform 0.2s, box-shadow 0.2s; border-top: 4px solid #6366f1; }
        @media print {
            .no-print { display: none !important; }
            #drops-view, #stats-view { display: block !important; }
        }
    </style>
</head>
<body>
    <div class="max-w-7xl mx-auto">
        <header class="mb-10 text-center">
            <h1 class="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                Report IP <span class="text-indigo-600">Extractor</span>
            </h1>
            <p class="text-slate-500 font-medium">Log: ${firstWord} • ${formattedTimestamp}</p>
        </header>

        <div class="flex items-center justify-center gap-4 mb-8 no-print">
            <div class="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-1.5">
                <button onclick="showTab('drops')" id="btn-drops" class="px-8 py-2.5 rounded-xl text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-100">Drops List</button>
                <button onclick="showTab('stats')" id="btn-stats" class="px-8 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-600 hover:bg-slate-50">Global Statistics</button>
            </div>
        </div>

        <div id="drops-view">
            <div class="mb-10 max-w-2xl mx-auto no-print">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Multi-IP Intelligence Search</label>
                <div class="relative">
                    <textarea id="ip-search-box" placeholder="Paste multiple IPs to filter internal card contents..." oninput="onSearchChange(this.value)"
                        class="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none h-20 text-sm font-mono"></textarea>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-300 absolute left-4 top-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div id="search-info" class="text-center mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Showing matching IPs in relevant drops</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="drops-grid">
                ${drops.map(drop => `
                <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col h-full drop-card-item" data-drop-id="${drop.id}">
                    <div class="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <div class="flex items-center space-x-2">
                            <span class="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">DROP ${drop.id}</span>
                            <span class="text-slate-700 font-bold text-base">${drop.time}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-slate-400 text-[9px] font-bold uppercase indicator bg-white border border-slate-100 px-2 py-1 rounded">${drop.uniqueValues.length} Items</span>
                            <button onclick="copyCardIps(this)" class="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 no-print" title="Copy visible IPs">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="p-4 flex-grow bg-white">
                        <div class="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                            <ul class="space-y-1.5 list-items">
                                ${drop.uniqueValues.map(val => `
                                <li class="flex items-center text-slate-600 font-mono text-[11px] bg-slate-50/50 p-1.5 rounded border border-transparent hover:bg-indigo-50/30 transition-colors card-ip-li">
                                    <span class="w-1.5 h-1.5 bg-indigo-300 rounded-full mr-2.5 shrink-0"></span>
                                    <span class="truncate ip-text">${val}</span>
                                </li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
            <div id="no-drops-message" class="hidden text-center py-24 text-slate-400 italic">No matches found across any drops.</div>
        </div>

        <div id="stats-view" class="hidden">
            <!-- Simplified stats table here -->
            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 bg-slate-50 border-b border-slate-100">
                    <h2 class="text-2xl font-bold text-slate-800">Global Statistical Overview</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th class="px-6 py-4">IP Address</th>
                                <th class="px-6 py-4 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${globalStats.sort((a,b) => b.count - a.count).map(item => `
                            <tr>
                                <td class="px-6 py-4 font-mono text-sm font-medium text-slate-700">${item.value}</td>
                                <td class="px-6 py-4 text-right">
                                    <span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-black text-xs border border-indigo-100">${item.count}</span>
                                </td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <footer class="mt-20 py-10 border-t border-slate-100 text-center">
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">&copy; 2025 By CMHW Team</p>
        </footer>
    </div>

    <script>
        function showTab(view) {
            document.getElementById('drops-view').classList.toggle('hidden', view === 'stats');
            document.getElementById('stats-view').classList.toggle('hidden', view === 'drops');
            const btnDrops = document.getElementById('btn-drops');
            const btnStats = document.getElementById('btn-stats');
            
            if (view === 'drops') {
                btnDrops.className = 'px-8 py-2.5 rounded-xl text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-100';
                btnStats.className = 'px-8 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-600 hover:bg-slate-50';
            } else {
                btnStats.className = 'px-8 py-2.5 rounded-xl text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-100';
                btnDrops.className = 'px-8 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-600 hover:bg-slate-50';
            }
        }

        function onSearchChange(query) {
            const terms = query.split(/[\\s\\n,]+/).map(t => t.trim().toLowerCase()).filter(t => t !== '');
            const cards = document.querySelectorAll('.drop-card-item');
            let visibleCards = 0;

            cards.forEach(card => {
                const lis = card.querySelectorAll('.card-ip-li');
                let matchCount = 0;
                
                lis.forEach(li => {
                    const text = li.querySelector('.ip-text').textContent.toLowerCase();
                    const matches = terms.length === 0 || terms.some(term => text.includes(term));
                    li.classList.toggle('hidden', !matches);
                    if (matches) matchCount++;
                });

                const shouldShowCard = matchCount > 0 || terms.length === 0;
                card.classList.toggle('hidden', !shouldShowCard);
                if (shouldShowCard) {
                    visibleCards++;
                    card.querySelector('.indicator').innerText = terms.length > 0 ? matchCount + ' Matches' : lis.length + ' Items';
                }
            });

            document.getElementById('no-drops-message').classList.toggle('hidden', visibleCards > 0);
        }

        function copyCardIps(btn) {
            const card = btn.closest('.drop-card-item');
            const visibleIps = Array.from(card.querySelectorAll('.card-ip-li:not(.hidden) .ip-text'))
                .map(el => el.textContent.trim());
            if (visibleIps.length === 0) return;
            navigator.clipboard.writeText(visibleIps.join('\\n')).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';
                setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
            });
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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Report IP <span className="text-indigo-600">Extractor</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">Streamlined traffic analysis and intelligence extraction.</p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        <FileUpload onFileLoaded={parseFile} isLoading={false} />

        {drops.length > 0 && (
          <>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center justify-start bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveView(ViewMode.DROPS)}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeView === ViewMode.DROPS 
                      ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-xl' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Drops View (${drops.length})
                </button>
                <button
                  onClick={() => setActiveView(ViewMode.STATS)}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeView === ViewMode.STATS 
                      ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-xl' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Statistics (${globalStats.length})
                </button>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <button
                  onClick={downloadAsHtml}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-white border border-slate-200 text-indigo-600 rounded-2xl text-sm font-bold shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Analysis (.html)
                </button>
              </div>
            </div>

            <main className="min-h-[500px]">
              {activeView === ViewMode.DROPS && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Multi-IP Intelligence Search */}
                  <div className="max-w-2xl mx-auto relative group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">Multi-IP Intelligence Search</label>
                    <div className="relative">
                      <textarea 
                        placeholder="Paste multiple IP addresses to extract matching rows across all relevant drops..." 
                        value={ipSearchQuery}
                        onChange={(e) => setIpSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all group-hover:border-indigo-300 text-sm font-mono resize-none h-24"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300 absolute left-4 top-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {ipSearchQuery && (
                        <button onClick={() => setIpSearchQuery('')} className="absolute right-4 top-4 text-slate-300 hover:text-indigo-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {drops.map((drop, idx) => (
                      <DropCard key={idx} drop={drop} searchTerms={searchTerms} />
                    ))}
                    {drops.length > 0 && searchTerms.length > 0 && drops.every(d => !d.uniqueValues.some(v => searchTerms.some(t => v.toLowerCase().includes(t)))) && (
                      <div className="col-span-full py-24 text-center">
                        <p className="text-slate-400 text-lg font-medium italic">No drops contain any of the IP addresses searched.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeView === ViewMode.STATS && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <StatsTable stats={globalStats} />
                </div>
              )}
            </main>
          </>
        )}
        
        {drops.length === 0 && (
          <div className="py-32 text-center animate-in zoom-in duration-700">
            <div className="inline-flex items-center justify-center p-8 bg-white shadow-xl shadow-indigo-100 rounded-3xl mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">System Ready</h3>
            <p className="text-slate-400 text-base mt-2 max-w-sm mx-auto">Upload your DROP log files to extract traffic intelligence and perform analysis.</p>
          </div>
        )}
      </div>

      <footer className="mt-32 pt-10 border-t border-slate-100 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">&copy; 2025 By CMHW Team</p>
      </footer>
    </div>
  );
};

export default App;
