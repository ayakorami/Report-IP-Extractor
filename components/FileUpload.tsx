
import React, { useRef } from 'react';

interface FileUploadProps {
  onFileLoaded: (content: string) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      onFileLoaded(text);
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="border-2 border-dashed border-slate-300 rounded-xl p-8 transition-all hover:border-indigo-400 bg-white shadow-sm flex flex-col items-center justify-center cursor-pointer group"
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".txt"
      />
      <div className="bg-indigo-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-700">Import Log File</h3>
      <p className="text-slate-500 text-sm mt-1">Select a .txt file containing DROP data</p>
      {isLoading && <div className="mt-4 text-indigo-600 font-medium animate-pulse">Processing...</div>}
    </div>
  );
};
