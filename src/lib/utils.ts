import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import * as cheerio from 'cheerio';

/**
 * Extract text from a file buffer based on its mime type.
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      const pdfData = await pdf(fileBuffer);
      return pdfData.text;

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      return docxResult.value;

    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      let excelText = '';
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        excelText += xlsx.utils.sheet_to_txt(sheet) + '\n';
      });
      return excelText;

    case 'text/plain':
    case 'text/csv':
      return fileBuffer.toString('utf-8');

    default:
      // Fallback for unknown types - try as text
      return fileBuffer.toString('utf-8');
  }
}

/**
 * Extract text from a URL by fetching it and parsing with Cheerio.
 */
export async function extractTextFromUrl(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style').remove();
    
    const title = $('title').text() || url;
    const content = $('body').text().replace(/\s+/g, ' ').trim();
    
    return { title, content };
  } catch (error) {
    console.error('Error extracting text from URL:', error);
    throw new Error('Failed to extract content from URL.');
  }
}

/**
 * Get file extension from filename.
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}
