export interface ImageItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  createdAt: number;
  source: 'upload' | 'generated' | 'sample' | 'url';
  aspectRatio?: number; // width / height
  base64Data?: string; // Optional: store base64 if available (for uploads/generated) to save re-fetching
  mimeType?: string; // Optional: e.g. "image/png"
}

export interface GenerationConfig {
  prompt: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
}

export type ViewMode = 'grid' | 'masonry';