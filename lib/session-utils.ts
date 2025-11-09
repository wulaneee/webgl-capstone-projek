import fs from 'fs';
import path from 'path';
import {
  Session,
  SessionGroup,
  SessionStatus,
  ImageFile,
  ImageMetadata,
} from './types';

/**
 * Get the absolute path to the public/source directory
 */
export function getSourcePath(): string {
  return path.join(process.cwd(), 'public', 'source');
}

/**
 * Get the absolute path to a specific session
 */
export function getSessionPath(sessionId: string): string {
  return path.join(getSourcePath(), sessionId);
}

/**
 * Scan public/source directory for all session folders
 */
export function scanSessions(): string[] {
  const sourcePath = getSourcePath();

  // Create source directory if it doesn't exist
  if (!fs.existsSync(sourcePath)) {
    fs.mkdirSync(sourcePath, { recursive: true });
    return [];
  }

  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      // Validate session structure
      const sessionPath = path.join(sourcePath, entry.name);
      const imagesPath = path.join(sessionPath, 'images');
      const metadatasPath = path.join(sessionPath, 'metadatas');

      return fs.existsSync(imagesPath) && fs.existsSync(metadatasPath);
    })
    .map((entry) => entry.name)
    .sort();
}

/**
 * Check if a session exists and is valid
 */
export function sessionExists(sessionId: string): boolean {
  const sessionPath = getSessionPath(sessionId);

  if (!fs.existsSync(sessionPath)) {
    return false;
  }

  const imagesPath = path.join(sessionPath, 'images');
  const metadatasPath = path.join(sessionPath, 'metadatas');

  return fs.existsSync(imagesPath) && fs.existsSync(metadatasPath);
}

/**
 * Get list of image files in a session
 */
export function getSessionImages(sessionId: string): ImageFile[] {
  const imagesPath = path.join(getSessionPath(sessionId), 'images');

  if (!fs.existsSync(imagesPath)) {
    return [];
  }

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'];
  const files = fs.readdirSync(imagesPath);

  return files
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    })
    .map((file) => ({
      filename: file,
      path: `/source/${sessionId}/images/${file}`,
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Parse a metadata JSON file
 */
export function parseMetadata(sessionId: string, filename: string): ImageMetadata | null {
  const metadataPath = path.join(getSessionPath(sessionId), 'metadatas', filename);

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(content) as ImageMetadata;
  } catch (error) {
    console.error(`Error parsing metadata ${filename}:`, error);
    return null;
  }
}

/**
 * Get images grouped by group_id from metadata
 */
export function getSessionGroups(sessionId: string): SessionGroup[] {
  const images = getSessionImages(sessionId);
  const groupsMap = new Map<number, ImageFile[]>();

  // Parse metadata for each image
  images.forEach((image) => {
    const basename = path.basename(image.filename, path.extname(image.filename));
    const metadataFilename = `${basename}.json`;
    const metadata = parseMetadata(sessionId, metadataFilename);

    if (metadata) {
      const imageWithMetadata: ImageFile = {
        ...image,
        metadata,
      };

      if (!groupsMap.has(metadata.group_id)) {
        groupsMap.set(metadata.group_id, []);
      }

      groupsMap.get(metadata.group_id)!.push(imageWithMetadata);
    }
  });

  // Convert map to array and sort
  return Array.from(groupsMap.entries())
    .map(([group_id, images]) => ({
      group_id,
      images: images.sort((a, b) => a.filename.localeCompare(b.filename)),
    }))
    .sort((a, b) => a.group_id - b.group_id);
}

/**
 * Check session output status
 */
export function getSessionStatus(sessionId: string): SessionStatus {
  const outputPath = path.join(getSessionPath(sessionId), 'output');

  if (!fs.existsSync(outputPath)) {
    return {
      hasOutput: false,
    };
  }

  const stitchedPath = path.join(outputPath, 'stitched');
  const stitchedSegmentationPath = path.join(outputPath, 'stitched_segmentation');

  let stitchedCount = 0;
  let stitchedSegmentationCount = 0;

  if (fs.existsSync(stitchedPath)) {
    const files = fs.readdirSync(stitchedPath);
    stitchedCount = files.filter((f) => f.startsWith('stitched_group_')).length;
  }

  if (fs.existsSync(stitchedSegmentationPath)) {
    const files = fs.readdirSync(stitchedSegmentationPath);
    stitchedSegmentationCount = files.filter((f) => f.startsWith('stitched_group_')).length;
  }

  return {
    hasOutput: stitchedCount > 0 || stitchedSegmentationCount > 0,
    outputPath: `/source/${sessionId}/output`,
    stitchedCount,
    stitchedSegmentationCount,
  };
}

/**
 * Get full session details
 */
export function getSessionDetails(sessionId: string): Session | null {
  if (!sessionExists(sessionId)) {
    return null;
  }

  const images = getSessionImages(sessionId);
  const groups = getSessionGroups(sessionId);
  const status = getSessionStatus(sessionId);

  const metadatasPath = path.join(getSessionPath(sessionId), 'metadatas');
  const metadataFiles = fs.existsSync(metadatasPath)
    ? fs.readdirSync(metadatasPath).filter((f) => f.endsWith('.json'))
    : [];

  // Get creation time (use folder creation time)
  const sessionPath = getSessionPath(sessionId);
  const stats = fs.statSync(sessionPath);

  return {
    id: sessionId,
    name: sessionId,
    path: `/source/${sessionId}`,
    imageCount: images.length,
    metadataCount: metadataFiles.length,
    groups,
    status,
    createdAt: stats.birthtime,
  };
}

/**
 * Get all sessions with details
 */
export function getAllSessions(): Session[] {
  const sessionIds = scanSessions();

  return sessionIds
    .map((id) => getSessionDetails(id))
    .filter((session): session is Session => session !== null);
}

/**
 * Get stitched output files for a session
 */
export function getStitchedOutputs(sessionId: string) {
  const outputPath = path.join(getSessionPath(sessionId), 'output');

  const original: string[] = [];
  const segmented: string[] = [];

  const stitchedPath = path.join(outputPath, 'stitched');
  if (fs.existsSync(stitchedPath)) {
    const files = fs.readdirSync(stitchedPath);
    files
      .filter((f) => f.startsWith('stitched_group_') && f.endsWith('.jpg'))
      .forEach((f) => {
        original.push(`/source/${sessionId}/output/stitched/${f}`);
      });
  }

  const stitchedSegmentationPath = path.join(outputPath, 'stitched_segmentation');
  if (fs.existsSync(stitchedSegmentationPath)) {
    const files = fs.readdirSync(stitchedSegmentationPath);
    files
      .filter((f) => f.startsWith('stitched_group_') && f.endsWith('.jpg'))
      .forEach((f) => {
        segmented.push(`/source/${sessionId}/output/stitched_segmentation/${f}`);
      });
  }

  return { original, segmented };
}
