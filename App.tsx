import React, { useState, useCallback, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import GalleryGrid from './components/GalleryGrid';
import ImageViewer from './components/ImageViewer';
import GenerationModal from './components/GenerationModal';
import AddUrlModal from './components/AddUrlModal';
import ExportModal from './components/ExportModal';
import { ImageItem } from './types';
import { v4 as uuidv4 } from 'uuid';
import { getImagesFromGitHub } from './services/githubService';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isGenerationOpen, setIsGenerationOpen] = useState(false);
  const [isAddUrlOpen, setIsAddUrlOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load from GitHub repo
  useEffect(() => {
    const loadDefaultImages = async () => {
      setIsLoading(true);
      try {
        // Load from the SOURCE repository (pica-pic) first
        const repoUrl = 'https://github.com/jaymacmac/pica-pic';
        const urls = await getImagesFromGitHub(repoUrl);
        
        if (urls.length > 0) {
          const newImages: ImageItem[] = urls.map(url => ({
            id: uuidv4(),
            url: url,
            thumbnailUrl: url,
            title: url.split('/').pop()?.split('.')[0] || 'Image',
            createdAt: Date.now(),
            source: 'url'
          }));
          setImages(newImages);
        }
      } catch (error) {
        console.error("Failed to load initial images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaultImages();
  }, []);

  // File Upload Handler
  const handleUpload = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        
        const newImage: ImageItem = {
          id: uuidv4(),
          url: base64,
          thumbnailUrl: base64,
          title: file.name.split('.')[0],
          createdAt: Date.now(),
          source: 'upload',
          base64Data: base64Data,
          mimeType: file.type // Store mimeType for export
        };
        setImages(prev => [newImage, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Add URL Handler (Single or Bulk)
  const handleAddUrl = useCallback((urls: string[]) => {
    const newImages: ImageItem[] = urls.map(url => ({
      id: uuidv4(),
      url: url,
      thumbnailUrl: url,
      title: url.split('/').pop()?.split('.')[0] || 'Image from URL',
      description: 'Added via URL import',
      createdAt: Date.now(),
      source: 'url'
    }));
    
    setImages(prev => [...newImages, ...prev]);
  }, []);

  // AI Generation Handler
  const handleImageGenerated = useCallback((data: { base64: string, prompt: string, mimeType: string }) => {
    const fullDataUrl = `data:${data.mimeType};base64,${data.base64}`;
    const newImage: ImageItem = {
      id: uuidv4(),
      url: fullDataUrl,
      thumbnailUrl: fullDataUrl,
      title: data.prompt.slice(0, 30) + (data.prompt.length > 30 ? '...' : ''),
      description: `Generated from prompt: "${data.prompt}"`,
      createdAt: Date.now(),
      source: 'generated',
      base64Data: data.base64,
      mimeType: data.mimeType
    };
    setImages(prev => [newImage, ...prev]);
  }, []);

  // Navigation Logic
  const getSelectedIndex = () => images.findIndex(img => img.id === selectedImageId);
  const selectedIndex = getSelectedIndex();
  const selectedImage = selectedIndex !== -1 ? images[selectedIndex] : null;

  const handleNext = () => {
    if (selectedIndex < images.length - 1) {
      setSelectedImageId(images[selectedIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedImageId(images[selectedIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <Toolbar 
        onUpload={handleUpload}
        onOpenGenerate={() => setIsGenerationOpen(true)}
        onOpenAddUrl={() => setIsAddUrlOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      <main className="flex-1 container mx-auto max-w-7xl relative">
        {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center pt-20">
                <LoadingSpinner />
                <span className="ml-2 text-gray-400">Loading library...</span>
            </div>
        ) : (
            <GalleryGrid 
            images={images} 
            onImageClick={(img) => setSelectedImageId(img.id)}
            />
        )}
      </main>

      {/* Lightbox / Viewer */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImageId(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={selectedIndex < images.length - 1}
          hasPrev={selectedIndex > 0}
        />
      )}

      {/* Generation Modal */}
      <GenerationModal 
        isOpen={isGenerationOpen}
        onClose={() => setIsGenerationOpen(false)}
        onImageGenerated={handleImageGenerated}
      />

      {/* Add URL Modal */}
      <AddUrlModal
        isOpen={isAddUrlOpen}
        onClose={() => setIsAddUrlOpen(false)}
        onAdd={handleAddUrl}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        images={images}
      />
    </div>
  );
};

export default App;