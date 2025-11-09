import { NextResponse } from 'next/server';
import { sessionExists, getSessionStatus, getSessionPath } from '@/lib/session-utils';
import { runStitchingPipeline, checkPythonAvailable, checkUnifiedScriptExists } from '@/lib/python-runner';
import { StitchingOptions } from '@/lib/types';
import fs from 'fs';
import path from 'path';

/**
 * Copy session data from public/source to unified_script directory
 */
function copySessionToUnifiedScript(sessionId: string): void {
  const sourceSessionPath = getSessionPath(sessionId);
  const unifiedScriptPath = path.join(process.cwd(), '..', 'unified_script', sessionId);

  // Create unified_script session directory if it doesn't exist
  if (!fs.existsSync(unifiedScriptPath)) {
    fs.mkdirSync(unifiedScriptPath, { recursive: true });
  }

  // Copy images directory
  const sourceImages = path.join(sourceSessionPath, 'images');
  const destImages = path.join(unifiedScriptPath, 'images');

  if (fs.existsSync(sourceImages)) {
    if (!fs.existsSync(destImages)) {
      fs.mkdirSync(destImages, { recursive: true });
    }

    const imageFiles = fs.readdirSync(sourceImages);
    imageFiles.forEach((file) => {
      const sourcePath = path.join(sourceImages, file);
      const destPath = path.join(destImages, file);

      // Only copy if file doesn't exist or is different
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });
  }

  // Copy metadatas directory
  const sourceMetadatas = path.join(sourceSessionPath, 'metadatas');
  const destMetadatas = path.join(unifiedScriptPath, 'metadatas');

  if (fs.existsSync(sourceMetadatas)) {
    if (!fs.existsSync(destMetadatas)) {
      fs.mkdirSync(destMetadatas, { recursive: true });
    }

    const metadataFiles = fs.readdirSync(sourceMetadatas);
    metadataFiles.forEach((file) => {
      const sourcePath = path.join(sourceMetadatas, file);
      const destPath = path.join(destMetadatas, file);

      // Only copy if file doesn't exist or is different
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });
  }
}

/**
 * Copy output back from unified_script to public/source
 */
function copyOutputToPublicSource(sessionId: string): void {
  const unifiedOutputPath = path.join(
    process.cwd(),
    '..',
    'unified_script',
    sessionId,
    'output'
  );
  const publicOutputPath = path.join(getSessionPath(sessionId), 'output');

  if (fs.existsSync(unifiedOutputPath)) {
    // Copy entire output directory
    if (!fs.existsSync(publicOutputPath)) {
      fs.mkdirSync(publicOutputPath, { recursive: true });
    }

    // Function to copy directory recursively
    function copyDir(src: string, dest: string) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const entries = fs.readdirSync(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    copyDir(unifiedOutputPath, publicOutputPath);
  }
}

/**
 * POST /api/sessions/[sessionId]/stitch
 * Processes stitching for a session
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Validate session exists
    if (!sessionExists(sessionId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
          message: `Session "${sessionId}" does not exist`,
        },
        { status: 404 }
      );
    }

    // Check if already processed
    const status = getSessionStatus(sessionId);
    if (status.hasOutput) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session already processed',
          message: 'Output folder already exists. Delete output folder to reprocess.',
        },
        { status: 400 }
      );
    }

    // Check Python availability
    const pythonAvailable = await checkPythonAvailable();
    if (!pythonAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Python not available',
          message: 'Python is not installed or not in PATH',
        },
        { status: 500 }
      );
    }

    // Check unified script exists
    if (!checkUnifiedScriptExists()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unified script not found',
          message: 'unified_stitch_pipeline.py not found in ../unified_script/',
        },
        { status: 500 }
      );
    }

    // Parse options from request body
    let options: StitchingOptions | undefined;
    try {
      const body = await request.json();
      options = body.options;
    } catch {
      // No body or invalid JSON, use defaults
      options = undefined;
    }

    // Copy session data to unified_script directory
    try {
      copySessionToUnifiedScript(sessionId);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to prepare session data',
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // Run stitching pipeline
    try {
      const result = await runStitchingPipeline(sessionId, options);

      // Copy output back to public/source
      try {
        copyOutputToPublicSource(sessionId);
      } catch (error) {
        console.error('Warning: Failed to copy output back:', error);
        // Continue anyway - output might still be usable
      }

      return NextResponse.json({
        success: true,
        message: 'Stitching completed successfully',
        result,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stitching failed',
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in stitching API:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
