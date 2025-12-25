import React, { useRef, useState, useEffect } from 'react';
import { SparklesIcon, ArrowUpTrayIcon, LinkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface ToolbarProps {
  onUpload: (files: FileList) => void;
  onOpenGenerate: () => void;
  onOpenAddUrl: () => void;
  onOpenExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onUpload, onOpenGenerate, onOpenAddUrl, onOpenExport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <nav className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden sm:block">
          LuminaView
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden" 
          accept="image/*" 
          multiple 
        />
        
        {/* Full Screen Toggle */}
        <button
          onClick={toggleFullScreen}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700"
          title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isFullscreen ? (
            <ArrowsPointingInIcon className="w-5 h-5" />
          ) : (
             <ArrowsPointingOutIcon className="w-5 h-5" />
          )}
        </button>

        <div className="h-6 w-px bg-gray-700 mx-1 hidden sm:block"></div>
        
        {/* Export Button */}
         <button
          onClick={onOpenExport}
          className="p-2 sm:px-4 sm:py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors border border-gray-700 flex items-center gap-2"
          title="Export to GitHub"
        >
          <CloudArrowUpIcon className="w-5 h-5 text-green-500" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={onOpenAddUrl}
          className="p-2 sm:px-4 sm:py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors border border-gray-700 flex items-center gap-2"
        >
          <LinkIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Add URL</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:px-4 sm:py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors border border-gray-700 flex items-center gap-2"
        >
          <ArrowUpTrayIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        <button
          onClick={onOpenGenerate}
          className="p-2 sm:px-4 sm:py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors shadow-lg shadow-purple-900/30 flex items-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Generate</span>
        </button>
      </div>
    </nav>
  );
};

export default Toolbar;