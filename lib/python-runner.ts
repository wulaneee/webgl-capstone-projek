import { spawn } from 'child_process';
import path from 'path';
import { StitchingOptions, StitchingProgress } from './types';

/**
 * Get the path to the unified script directory
 */
function getUnifiedScriptPath(): string {
  // Assuming unified_script is a sibling directory to webgl-capstone-projek
  return path.join(process.cwd(), '..', 'unified_script');
}

/**
 * Get the path to the Python script
 */
function getPythonScriptPath(): string {
  return path.join(getUnifiedScriptPath(), 'unified_stitch_pipeline.py');
}

/**
 * Get the path to the session in unified_script directory
 * We need to copy/link the session from public/source to unified_script
 */
function getUnifiedSessionPath(sessionId: string): string {
  return path.join(getUnifiedScriptPath(), sessionId);
}

/**
 * Build command arguments for the Python script
 */
function buildPythonArgs(sessionId: string, options?: StitchingOptions): string[] {
  const args = [sessionId];

  if (options?.threshold !== undefined) {
    args.push('--threshold', options.threshold.toString());
  }

  if (options?.blurKernel !== undefined) {
    args.push('--blur-kernel', options.blurKernel.toString());
  }

  if (options?.noBlur) {
    args.push('--no-blur');
  }

  return args;
}

/**
 * Run the unified stitching pipeline
 *
 * @param sessionId - The session ID to process
 * @param options - Optional stitching parameters
 * @param onProgress - Optional callback for progress updates
 * @returns Promise that resolves with the final status
 */
export async function runStitchingPipeline(
  sessionId: string,
  options?: StitchingOptions,
  onProgress?: (progress: StitchingProgress) => void
): Promise<StitchingProgress> {
  const scriptPath = getPythonScriptPath();
  const args = buildPythonArgs(sessionId, options);

  return new Promise((resolve, reject) => {
    try {
      // Spawn the Python process
      // Use 'python' or 'python3' depending on system
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

      const pythonProcess = spawn(pythonCommand, [scriptPath, ...args], {
        cwd: getUnifiedScriptPath(),
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      // Capture stdout
      pythonProcess.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;

        // Send progress updates if callback provided
        if (onProgress) {
          onProgress({
            status: 'running',
            message: text.trim(),
          });
        }

        console.log(`[Python]: ${text.trim()}`);
      });

      // Capture stderr
      pythonProcess.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        console.error(`[Python Error]: ${text.trim()}`);
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Success
          const result: StitchingProgress = {
            status: 'success',
            message: 'Stitching completed successfully',
          };

          if (onProgress) {
            onProgress(result);
          }

          resolve(result);
        } else {
          // Error
          const result: StitchingProgress = {
            status: 'error',
            message: `Stitching failed with exit code ${code}`,
            error: stderr || stdout,
          };

          if (onProgress) {
            onProgress(result);
          }

          reject(new Error(result.message));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (error) => {
        const result: StitchingProgress = {
          status: 'error',
          message: 'Failed to start Python process',
          error: error.message,
        };

        if (onProgress) {
          onProgress(result);
        }

        reject(error);
      });
    } catch (error) {
      const result: StitchingProgress = {
        status: 'error',
        message: 'Failed to run stitching pipeline',
        error: error instanceof Error ? error.message : String(error),
      };

      reject(result);
    }
  });
}

/**
 * Check if Python is available
 */
export async function checkPythonAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

    const pythonProcess = spawn(pythonCommand, ['--version']);

    pythonProcess.on('close', (code) => {
      resolve(code === 0);
    });

    pythonProcess.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Check if the unified script exists
 */
export function checkUnifiedScriptExists(): boolean {
  const scriptPath = getPythonScriptPath();
  const fs = require('fs');
  return fs.existsSync(scriptPath);
}
