import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedDoc {
  text: string;
  wordCount: number;
  characterCount: number;
  snippet: string;
  pageCount?: number;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<ExtractedDoc> {
  let text = '';
  let pageCount: number | undefined;

  const lowerFilename = filename.toLowerCase();

  if (mimetype === 'application/pdf' || lowerFilename.endsWith('.pdf')) {
    let parser: any = null;
    try {
      // PDFParse in v2 expects Uint8Array or Buffer in data property
      const uint8 = new Uint8Array(buffer);
      parser = new PDFParse({ data: uint8 });
      
      const textRes = await parser.getText({
        pageJoiner: '\n\n',
        lineEnforce: true,
      });

      const pages = Array.isArray(textRes.pages) ? textRes.pages : [];
      pageCount = typeof textRes.total === 'number' && textRes.total > 0
        ? textRes.total
        : (pages.length || 1);

      if (pages.length > 0) {
        text = pages
          .map((p: any) => (p && typeof p.text === 'string' ? p.text.trim() : ''))
          .filter(Boolean)
          .join('\n\n');
      }

      if (!text && typeof textRes.text === 'string') {
        text = textRes.text;
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
        throw new Error('This PDF is password-protected. Please upload an unprotected document.');
      }
      throw new Error(`Failed to parse PDF document: ${msg || 'Corrupted or unreadable PDF'}`);
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    lowerFilename.endsWith('.docx')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } catch (err: any) {
      throw new Error(`Failed to parse DOCX document: ${err.message || 'Corrupted Word document'}`);
    }
  } else if (
    mimetype.startsWith('text/') ||
    lowerFilename.endsWith('.txt') ||
    lowerFilename.endsWith('.md')
  ) {
    text = buffer.toString('utf-8');
  } else {
    // Attempt utf-8 fallback
    text = buffer.toString('utf-8');
  }

  // Clean text: normalize whitespace, strip control characters, and clean page boundaries
  text = text
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\r\n/g, '\n');

  // Remove common page marker lines like "-- 1 of 5 --"
  text = text.replace(/\n--\s*\d+\s+of\s+\d+\s*--\n?/gi, '\n');

  // Fix words broken with hyphens across line breaks (e.g., "bio-\nlogy" -> "biology")
  text = text.replace(/([A-Za-z]{2,})-\n([A-Za-z]{2,})/g, '$1$2');

  // Collapse 3 or more consecutive newlines into 2
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  if (!text || text.length < 15) {
    if (mimetype === 'application/pdf' || lowerFilename.endsWith('.pdf')) {
      throw new Error(
        'The uploaded PDF contains no extractable text layer. It appears to be a scanned image or photograph without OCR text. Please use a text-based PDF or paste your study notes into the "Paste Notes" tab.'
      );
    }
    throw new Error('The uploaded document appears to be empty or contains no readable text.');
  }

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characterCount = text.length;
  const snippet = text.slice(0, 300).replace(/\s+/g, ' ') + (text.length > 300 ? '...' : '');

  return {
    text,
    wordCount,
    characterCount,
    snippet,
    pageCount,
  };
}
