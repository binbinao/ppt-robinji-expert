import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

const execAsync = promisify(exec);

export interface ConvertOptions {
  resolution?: number; // DPI for images
  format?: string; // jpg or png
}

export class Converter {
  private resolution: number;
  private format: string;

  constructor(options: ConvertOptions = {}) {
    this.resolution = options.resolution || 150;
    this.format = options.format || 'jpg';
  }

  /**
   * Convert PPT to PDF
   */
  async toPDF(inputPath: string, outputPath: string): Promise<void> {
    if (!existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // 使用LibreOffice转换
    const command = `soffice --headless --convert-to pdf --outdir "${dir}" "${inputPath}"`;

    try {
      await execAsync(command);
      console.log(`PDF generated: ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to convert to PDF: ${error}`);
    }
  }

  /**
   * Convert PPT to images
   */
  async toImages(inputPath: string, outputDir: string): Promise<string[]> {
    if (!existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // 首先转换为PDF
    const pdfPath = join(outputDir, 'temp_convert.pdf');
    await this.toPDF(inputPath, pdfPath);

    // PDF转图片
    const baseName = basename(inputPath, extname(inputPath));
    const outputPattern = join(outputDir, `${baseName}-slide`);

    const command = `pdftoppm -${this.format} -r ${this.resolution} "${pdfPath}" "${outputPattern}"`;

    try {
      await execAsync(command);
      console.log(`Images generated in: ${outputDir}`);

      // 清理临时PDF
      unlinkSync(pdfPath);

      // 返回生成的图片列表
      return this.getImageFiles(outputDir, baseName);
    } catch (error) {
      throw new Error(`Failed to convert to images: ${error}`);
    }
  }

  /**
   * Convert single slide to image
   */
  async convertSlide(inputPath: string, slideNum: number, outputPath: string): Promise<void> {
    if (!existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // 先转PDF
    const pdfPath = join(outputDir, 'temp_slide.pdf');
    await this.toPDF(inputPath, pdfPath);

    // 单页转换
    const command = `pdftoppm -${this.format} -r ${this.resolution} -f ${slideNum} -l ${slideNum} "${pdfPath}" "${outputPath.replace(extname(outputPath), '')}"`;

    try {
      await execAsync(command);

      // 清理临时PDF
      unlinkSync(pdfPath);
    } catch (error) {
      throw new Error(`Failed to convert slide: ${error}`);
    }
  }

  /**
   * Get list of image files in directory
   */
  private getImageFiles(dir: string, baseName: string): string[] {
    const files = readdirSync(dir);
    return files
      .filter(f => f.startsWith(baseName) && (f.endsWith('.jpg') || f.endsWith('.png')))
      .map(f => join(dir, f))
      .sort();
  }

  /**
   * Check if required tools are available
   */
  async checkDependencies(): Promise<{ libreoffice: boolean; pdftoppm: boolean }> {
    const result = {
      libreoffice: false,
      pdftoppm: false
    };

    try {
      await execAsync('soffice --version');
      result.libreoffice = true;
    } catch {
      console.warn('LibreOffice not found. PDF conversion will not work.');
    }

    try {
      await execAsync('pdftoppm -V');
      result.pdftoppm = true;
    } catch {
      console.warn('pdftoppm not found. Image conversion will not work.');
    }

    return result;
  }
}

export default Converter;
