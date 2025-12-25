import React from 'react';
import { ImageItem } from '../types';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface GalleryGridProps {
  images: ImageItem[];
  onImageClick: (image: ImageItem) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, onImageClick }) => {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-500">
        <PhotoIcon className="w-24 h-24 mb-4 opacity-20" />
        <p className="text-xl font-light">No images found.</p>
        <p className="text-sm opacity-60 mt-2">Upload, generate, or add from URL to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {images.map((img) => (
        <a 
          key={img.id}
          href={img.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            onImageClick(img);
          }}
          className="group relative block aspect-square overflow-hidden rounded-xl bg-gray-800 cursor-pointer border border-transparent hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/10"
        >
          <img
            src={img.thumbnailUrl || img.url}
            alt={img.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* pointer-events-none ensures the right-click hits the link/image instead of this overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
            <h3 className="text-white text-sm font-medium truncate">{img.title}</h3>
            <span className="text-xs text-gray-400 capitalize">{img.source}</span>
          </div>
        </a>
      ))}
    </div>
  );
};

export default GalleryGrid;