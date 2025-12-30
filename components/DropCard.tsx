
import React, { useState, useMemo } from 'react';
import { Drop } from '../types';

interface DropCardProps {
  drop: Drop;
  searchTerms: string[];
}

export const DropCard: React.FC<DropCardProps> = ({ drop, searchTerms }) => {
  const [copied, setCopied] = useState(false);

  const filteredValues = useMemo(() => {
    if (searchTerms.length === 0) return drop.uniqueValues;
    
    return drop.uniqueValues.filter(val => {
      const lowerVal = val.toLowerCase();
      return searchTerms.some(term => lowerVal.includes(term));
    });
  }, [drop.uniqueValues, searchTerms]);

  // If we are searching and there are no matches, we hide the card via the parent
  // But we still handle the display logic here
  const hasMatches = filteredValues.length > 0;

  const copyToClipboard = () => {
    const text = filteredValues.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (searchTerms.length > 0 && !hasMatches) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full border-t-4 border-t-indigo-500 animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">
              DROP {drop.id}
            </span>
            <span className="text-slate-700 font-bold text-base">{drop.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[9px] font-bold uppercase whitespace-nowrap bg-white px-2 py-1 rounded border border-slate-100">
            {filteredValues.length} {searchTerms.length > 0 ? 'Matches' : 'Items'}
          </span>
          <button 
            onClick={copyToClipboard}
            className={`p-1.5 rounded-lg transition-all ${
              copied 
                ? 'bg-green-100 text-green-600' 
                : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Copy IPs in this drop"
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
          </button>
        </div>
      </div>
      
      <div className="p-4 flex-grow bg-white">
        <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          <ul className="space-y-1.5">
            {filteredValues.map((val, idx) => (
              <li key={idx} className="flex items-center text-slate-600 font-mono text-[11px] bg-slate-50/50 p-1.5 rounded border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group/item">
                <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full mr-2.5 shrink-0 group-hover/item:bg-indigo-500"></span>
                <span className="truncate">{val}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
