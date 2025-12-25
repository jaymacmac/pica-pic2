import React, { useState } from 'react';
import { XMarkIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { uploadImageToGitHub, convertUrlToBase64Simple } from '../services/githubService';
import { ImageItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageItem[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, images }) => {
  const [token, setToken] = useState('');
  const [repoStr, setRepoStr] = useState('jaymacmac/pics'); // Default to dedicated pics repo
  const [folderPath, setFolderPath] = useState('lumina-exports'); // Restored default folder
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLogs([]);
    setSuccess(false);
    
    if (!token.trim()) {
      setError("Personal Access Token is required.");
      return;
    }
    
    const parts = repoStr.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("Repository must be in 'username/repo' format.");
      return;
    }
    const [owner, repo] = parts;

    setIsUploading(true);
    setProgress(0);

    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setLogs(prev => [`Processing ${i + 1}/${images.length}: ${img.title}...`, ...prev.slice(0, 4)]);
        
        try {
          // 1. Get Base64 content
          let content = img.base64Data;
          if (!content) {
            content = await convertUrlToBase64Simple(img.url);
          }

          // 2. Generate filename
          const extension = img.mimeType ? img.mimeType.split('/')[1] : 'png';
          // Sanitize title for filename
          const safeTitle = img.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `${safeTitle}_${img.id.slice(0, 6)}.${extension}`;

          // 3. Upload
          await uploadImageToGitHub(token, owner, repo, folderPath, fileName, content);
          successCount++;
        } catch (err: any) {
          console.error(err);
          failCount++;
          setLogs(prev => [`Failed: ${img.title} - ${err.message}`, ...prev]);
        }
        
        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      setSuccess(true);
      setLogs(prev => [`DONE! Uploaded: ${successCount}, Failed: ${failCount}`, ...prev]);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <CloudArrowUpIcon className="w-5 h-5 text-green-500" />
            Export to GitHub
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!success ? (
            <form onSubmit={handleExport} className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-3 text-sm text-blue-200">
                You are about to export <strong>{images.length}</strong> images to <strong>{repoStr}</strong>.
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  GitHub Personal Access Token (Classic)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required scope: <code>repo</code> (for private) or <code>public_repo</code>.
                </p>
                
                <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-900/10 rounded-lg border border-yellow-700/30">
                     <LockClosedIcon className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                     <p className="text-xs text-yellow-200/70 leading-relaxed">
                       <strong>Security Note:</strong> This token is <u>never stored</u>. It is sent directly to GitHub's API from your browser to perform the upload and is completely forgotten when you refresh or close this tab.
                     </p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Repository (username/repo)
                </label>
                <input
                  type="text"
                  value={repoStr}
                  onChange={(e) => setRepoStr(e.target.value)}
                  placeholder="jaymacmac/pics"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Folder Path (Optional)
                </label>
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="lumina-exports"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to upload directly to the main repository folder.</p>
              </div>

              {error && (
                <div className="text-red-400 text-sm flex items-center gap-2 bg-red-900/10 p-2 rounded">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {error}
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                </div>
              )}

              {!isUploading && (
                  <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-green-900/30 transition-all"
                    >
                        Start Upload
                    </button>
                  </div>
              )}
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <CheckCircleIcon className="w-16 h-16 text-green-500" />
                <h4 className="text-xl font-semibold text-white">Export Complete!</h4>
                <p className="text-gray-400 text-center">
                    Successfully finished processing your images.
                </p>
                <div className="bg-gray-950 rounded-lg p-3 w-full max-h-32 overflow-y-auto text-xs text-gray-500 font-mono">
                     {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;