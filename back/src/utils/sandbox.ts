import { spawn } from 'child_process';
import path from 'path';

export interface SandboxOptions {
  image: string;
  command: string[];
  workDir: string;
  stdin?: string;
  timeoutMs?: number;
}

export async function runProcessInDocker(options: SandboxOptions): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}> {
  return new Promise((resolve, reject) => {
    const dockerArgs = [
      'run', '--rm',
      '-v', `${options.workDir}:/sandbox`,
      '-w', '/sandbox',
      '--network', 'none',
      '--memory', '256m',
      '--cpus', '1',
      options.image,
      ...options.command
    ];
    const child = spawn('docker', dockerArgs, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let resolved = false;
    let timedOut = false;
    const timer = options.timeoutMs && options.timeoutMs > 0
      ? setTimeout(() => {
        if (resolved) return;
        timedOut = true;
        child.kill();
      }, options.timeoutMs)
      : null;
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      if (timer) clearTimeout(timer);
      if (resolved) return;
      resolved = true;
      reject(error);
    });
    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (resolved) return;
      resolved = true;
      resolve({ exitCode: code, stdout, stderr, timedOut });
    });
    if (typeof options.stdin === 'string') {
      child.stdin?.write(options.stdin);
    }
    child.stdin?.end();
  });
}
