// Session and stitching related types

export interface ImageMetadata {
  photo_id: string;
  session_id: string;
  group_id: number;
}

export interface ImageFile {
  filename: string;
  path: string;
  metadata?: ImageMetadata;
}

export interface SessionGroup {
  group_id: number;
  images: ImageFile[];
}

export interface StitchingOutput {
  version: 'original' | 'segmented';
  groups: {
    group_id: number;
    filename: string;
    path: string;
  }[];
}

export interface SessionStatus {
  hasOutput: boolean;
  outputPath?: string;
  stitchedCount?: number;
  stitchedSegmentationCount?: number;
}

export interface Session {
  id: string;
  name: string;
  path: string;
  imageCount: number;
  metadataCount: number;
  groups: SessionGroup[];
  status: SessionStatus;
  createdAt?: Date;
}

export interface StitchingProgress {
  status: 'idle' | 'running' | 'success' | 'error';
  message?: string;
  progress?: number;
  output?: {
    original: string[];
    segmented: string[];
  };
  error?: string;
}

export interface StitchingOptions {
  threshold?: number;
  blurKernel?: number;
  noBlur?: boolean;
}

export type StitchingVersion = 'original' | 'segmented';
