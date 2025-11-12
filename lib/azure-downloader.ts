import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const AZURE_BASE_URL = process.env.AZURE_API_URL || 'https://test-capstone-backend-azure.vercel.app';

export interface AzureSessionStatus {
  session_id: string;
  image_count: number;
  metadata_count: number;
  is_consistent: boolean;
  missing_metadata: string[];
  missing_images: string[];
}

/**
 * Fetch session status from Azure API
 */
export async function fetchSessionStatus(
  sessionId: string
): Promise<AzureSessionStatus> {
  const response = await fetch(
    `${AZURE_BASE_URL}/session/status/${sessionId}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch session status: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Download session ZIP from Azure
 */
export async function downloadSessionZip(
  sessionId: string
): Promise<Buffer> {
  const url = `${AZURE_BASE_URL}/session/download/${sessionId}`;
  console.log(`📥 Fetching ZIP from: ${url}`);

  const response = await fetch(url);

  console.log(`📊 Response status: ${response.status}`);
  console.log(`📊 Response headers:`, {
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
    contentDisposition: response.headers.get('content-disposition'),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Download failed:`, errorText);
    throw new Error(
      `Failed to download session: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`📦 Downloaded buffer size: ${buffer.length} bytes`);
  console.log(`📦 First 10 bytes (hex):`, buffer.slice(0, 10).toString('hex'));

  // Check if it's actually a ZIP file (should start with PK)
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
  console.log(`📦 Is ZIP file: ${isZip}`);

  if (!isZip) {
    console.error(`❌ Response is not a ZIP file!`);
    console.error(`Response preview:`, buffer.slice(0, 200).toString('utf-8'));
    throw new Error('Downloaded file is not a valid ZIP archive');
  }

  return buffer;
}

/**
 * Extract ZIP buffer to destination folder
 */
export function extractZipToFolder(
  zipBuffer: Buffer,
  destinationPath: string
): void {
  try {
    console.log(`📂 Extracting to: ${destinationPath}`);
    const zip = new AdmZip(zipBuffer);

    // List ZIP contents
    const zipEntries = zip.getEntries();
    console.log(`📋 ZIP contains ${zipEntries.length} entries:`);
    zipEntries.slice(0, 10).forEach((entry) => {
      console.log(`  - ${entry.entryName} (${entry.header.size} bytes)`);
    });

    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
      console.log(`✅ Created destination directory`);
    }

    // Extract all files
    zip.extractAllTo(destinationPath, true);
    console.log(`✅ Extraction complete`);
  } catch (error) {
    console.error(`❌ Extraction failed:`, error);
    throw error;
  }
}

/**
 * Validate extracted session folder structure
 */
export function validateSessionStructure(sessionPath: string): {
  valid: boolean;
  errors: string[];
} {
  console.log(`🔍 Validating session structure at: ${sessionPath}`);
  const errors: string[] = [];

  // Check if main folder exists
  if (!fs.existsSync(sessionPath)) {
    errors.push('Session folder does not exist');
    console.error(`❌ ${errors[0]}`);
    return { valid: false, errors };
  }

  // List what's actually in the session folder
  const sessionContents = fs.readdirSync(sessionPath);
  console.log(`📁 Session folder contents:`, sessionContents);

  // Check for required subfolders
  const imagesPath = path.join(sessionPath, 'images');
  const metadatasPath = path.join(sessionPath, 'metadatas');

  if (!fs.existsSync(imagesPath)) {
    errors.push('Missing "images" folder');
    console.error(`❌ Missing "images" folder`);
  } else {
    const imageFiles = fs.readdirSync(imagesPath);
    console.log(`📷 Found ${imageFiles.length} files in images/`);
    if (imageFiles.length === 0) {
      errors.push('Images folder is empty');
    }
  }

  if (!fs.existsSync(metadatasPath)) {
    errors.push('Missing "metadatas" folder');
    console.error(`❌ Missing "metadatas" folder`);
  } else {
    const metadataFiles = fs.readdirSync(metadatasPath);
    console.log(`📝 Found ${metadataFiles.length} files in metadatas/`);
    if (metadataFiles.length === 0) {
      errors.push('Metadatas folder is empty');
    }
  }

  const isValid = errors.length === 0;
  console.log(`${isValid ? '✅' : '❌'} Validation result: ${isValid ? 'PASS' : 'FAIL'}`);
  if (!isValid) {
    console.error(`Validation errors:`, errors);
  }

  return {
    valid: isValid,
    errors,
  };
}

/**
 * Check if session already exists locally
 */
export function checkSessionExists(sessionId: string): boolean {
  const sessionPath = path.join(
    process.cwd(),
    'public',
    'source',
    sessionId
  );
  return fs.existsSync(sessionPath);
}

/**
 * Delete existing session folder
 */
export function deleteSession(sessionId: string): void {
  const sessionPath = path.join(
    process.cwd(),
    'public',
    'source',
    sessionId
  );

  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }
}

/**
 * Complete download workflow: download + extract + validate
 */
export async function downloadAndExtractSession(
  sessionId: string,
  overwrite: boolean = false
): Promise<{
  success: boolean;
  message: string;
  sessionPath?: string;
}> {
  try {
    const sessionPath = path.join(
      process.cwd(),
      'public',
      'source',
      sessionId
    );

    // Check if session already exists
    const exists = checkSessionExists(sessionId);
    if (exists && !overwrite) {
      return {
        success: false,
        message: 'Session already exists locally. Set overwrite=true to replace.',
      };
    }

    // Delete existing session if overwrite is true
    if (exists && overwrite) {
      deleteSession(sessionId);
    }

    // Download ZIP from Azure
    console.log(`Downloading session ${sessionId} from Azure...`);
    const zipBuffer = await downloadSessionZip(sessionId);

    // Extract ZIP to parent directory (ZIP already contains session_id folder)
    console.log(`Extracting session ${sessionId}...`);
    const parentPath = path.join(process.cwd(), 'public', 'source');
    extractZipToFolder(zipBuffer, parentPath);

    // Rename 'metadata' folder to 'metadatas' for compatibility
    const metadataPath = path.join(sessionPath, 'metadata');
    const metadatasPath = path.join(sessionPath, 'metadatas');
    if (fs.existsSync(metadataPath)) {
      fs.renameSync(metadataPath, metadatasPath);
      console.log(`✅ Renamed 'metadata' to 'metadatas'`);
    }

    // Validate structure
    const validation = validateSessionStructure(sessionPath);
    if (!validation.valid) {
      // Clean up invalid extraction
      deleteSession(sessionId);
      return {
        success: false,
        message: `Invalid session structure: ${validation.errors.join(', ')}`,
      };
    }

    console.log(`✅ Session ${sessionId} downloaded successfully`);
    return {
      success: true,
      message: 'Session downloaded and extracted successfully',
      sessionPath,
    };
  } catch (error) {
    console.error(`Error downloading session ${sessionId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
