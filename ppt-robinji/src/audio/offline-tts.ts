import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { TTSProvider, TTSRequest, TTSVoice } from './types.js';

const execAsync = promisify(exec);

/**
 * 离线 TTS 提供器
 *
 * 使用系统命令：
 * - macOS: `say` 命令（内置 TTS）
 * - Linux: `espeak` 或 `festival`
 * - Windows: PowerShell SpeechSynthesizer
 *
 * 优势：完全离线、免费
 * 缺点：音质较差
 */
export class OfflineTTSProvider implements TTSProvider {
  name = 'offline' as const;

  async isAvailable(): Promise<boolean> {
    const cmd = await this.getCommand();
    return cmd !== null;
  }

  async listVoices(): Promise<TTSVoice[]> {
    if (process.platform === 'darwin') {
      try {
        const { stdout } = await execAsync('say -v ?');
        return stdout
          .split('\n')
          .filter(Boolean)
          .slice(0, 20) // 限制数量
          .map(line => {
            const match = line.match(/^(\S+)\s+(\S+)\s+#/);
            if (!match) return null;
            return {
              id: match[1],
              name: line.split('#')[1]?.trim() || match[1],
              language: match[2],
            } as TTSVoice;
          })
          .filter((v): v is TTSVoice => v !== null);
      } catch {
        return [];
      }
    }
    return [];
  }

  async synthesize(request: TTSRequest): Promise<string> {
    const cmd = await this.getCommand();
    if (!cmd) {
      throw new Error('No offline TTS available on this system');
    }

    await mkdir(dirname(request.outputPath), { recursive: true });

    if (process.platform === 'darwin') {
      // macOS say -> 输出 AIFF，再用 afconvert 转为 MP3
      const aiffPath = request.outputPath.replace(/\.mp3$/, '.aiff');
      await execAsync(`${cmd} -v "${request.voice}" -o "${aiffPath}" "${this.escapeText(request.text)}"`);
      // 尝试转换为 mp3（可选）
      try {
        await execAsync(`afconvert "${aiffPath}" "${request.outputPath}" -f mp4f -d aac`);
      } catch {
        // 如果 afconvert 失败，保留 AIFF
        return aiffPath;
      }
      return request.outputPath;
    }

    // Linux: espeak
    if (process.platform === 'linux') {
      await execAsync(`${cmd} -v "${request.voice}" -w "${request.outputPath}" "${this.escapeText(request.text)}"`);
      return request.outputPath;
    }

    throw new Error('Offline TTS not supported on this platform');
  }

  private async getCommand(): Promise<string | null> {
    try {
      if (process.platform === 'darwin') {
        await execAsync('which say');
        return 'say';
      }
      if (process.platform === 'linux') {
        await execAsync('which espeak');
        return 'espeak';
      }
      return null;
    } catch {
      return null;
    }
  }

  private escapeText(text: string): string {
    return text.replace(/"/g, '\\"').replace(/`/g, '\\`');
  }
}
