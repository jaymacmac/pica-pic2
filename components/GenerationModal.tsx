import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, KeyIcon, BoltIcon, StarIcon } from '@heroicons/react/24/outline';
import { generateImage } from '../services/geminiService';

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (data: { base64: string, prompt: string, mimeType: string }) => void;
}

const GenerationModal: React.FC<GenerationModalProps> = ({ isOpen, onClose, onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Model selection state
  const [usePro, setUsePro] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key availability when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      checkApiKey();
    }
  }, [isOpen]);

  const checkApiKey = async () => {
    // Cast window to any to access custom aistudio property
    const aiStudio = (window as any).aistudio;
    if (aiStudio && aiStudio.hasSelectedApiKey) {
      const hasKey = await aiStudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    } else {
      // Fallback if not in the expected environment, assume env key works for flash
      setHasApiKey(true);
    }
  };

  const handleSelectKey = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio && aiStudio.openSelectKey) {
      try {
        await aiStudio.openSelectKey();
        // Assume success if no error, check status again
        setHasApiKey(true);
        setError(null);
      } catch (e) {
        console.error("Key selection failed", e);
        setError("Failed to select API key.");
      }
    }
  };

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { base64, mimeType } = await generateImage(prompt, { 
        usePro: usePro,
        aspectRatio: '1:1' 
      });
      onImageGenerated({ base64, prompt, mimeType });
      setPrompt('');
      onClose();
    } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes("Requested entity was not found") && usePro) {
            setError("Session expired. Please select your API key again.");
            setHasApiKey(false);
        } else {
            setError("Failed to generate image. Please check your connection and try again.");
        }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-500" />
            Generate with Gemini
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Model Selection Tabs */}
          <div className="bg-gray-950 p-1 rounded-xl flex">
            <button
              type="button"
              onClick={() => setUsePro(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${!usePro ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <BoltIcon className="w-4 h-4" />
              Standard (Fast)
            </button>
            <button
              type="button"
              onClick={() => setUsePro(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${usePro ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 text-white shadow-sm border border-purple-500/30' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <StarIcon className="w-4 h-4 text-yellow-400" />
              High Quality (Pro)
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={usePro ? "Detailed portrait of a cyberpunk street warrior, 2K resolution, cinematic lighting..." : "A cute robot holding a flower..."}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px] resize-none"
                disabled={isGenerating}
              />
            </div>
            
            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* Pro Mode API Key Requirement */}
            {usePro && !hasApiKey ? (
               <div className="bg-gray-800/50 border border-purple-500/30 rounded-xl p-4 space-y-3">
                 <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <KeyIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-white">Authorization Required</h4>
                        <p className="text-xs text-gray-400 mt-1">
                            High-quality generation requires a paid Google Cloud Project API key.
                        </p>
                    </div>
                 </div>
                 <button
                    type="button"
                    onClick={handleSelectKey}
                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                 >
                    Select API Key
                 </button>
                 <div className="text-center">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-gray-400 underline">
                        Learn more about billing
                    </a>
                 </div>
               </div>
            ) : (
                <div className="flex justify-end pt-2">
                    <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className={`
                        w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-white shadow-lg 
                        flex items-center justify-center gap-2 transition-all
                        ${isGenerating || !prompt.trim() 
                        ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                        : usePro 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-900/30'
                            : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                        }
                    `}
                    >
                    {isGenerating ? (
                        <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {usePro ? 'Generating HQ...' : 'Generating...'}
                        </>
                    ) : (
                        <>
                        <SparklesIcon className="w-5 h-5" />
                        {usePro ? 'Generate (2K)' : 'Generate'}
                        </>
                    )}
                    </button>
                </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default GenerationModal;