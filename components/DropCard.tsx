
import React from 'react';
import { Drop } from '../types';

interface DropCardProps {
  drop: Drop;
}

export const DropCard: React.FC<DropCardProps> = ({ drop }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">
            DROP {drop.id}
          </span>
          <span className="text-slate-700 font-semibold text-lg">{drop.time}</span>
        </div>
        <div className="text-slate-400 text-xs">
          {drop.uniqueValues.length} Items
        </div>
      </div>
      <div className="p-4">
        {/* Max height roughly matches 5 items (5 * ~42px) */}
        <div className="max-h-[210px] overflow-y-auto pr-1 custom-scrollbar">
          <ul className="space-y-2">
            {drop.uniqueValues.map((val, idx) => (
              <li key={idx} className="flex items-center text-slate-600 font-mono text-sm bg-slate-50 p-2 rounded border border-slate-50 hover:border-indigo-100 hover:bg-white transition-colors">
                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3 shrink-0"></span>
                <span className="truncate">{val}</span>
              </li>
            ))}
          </ul>
        </div>
        {drop.uniqueValues.length > 5 && (
          <div className="mt-2 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Scroll for more</p>
          </div>
        )}
      </div>
    </div>
  );
};
