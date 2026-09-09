/**
 * Split text into smaller chunks with overlap.
 */
export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  if (!text) return [];
  
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // If not the first chunk, start from startIndex which is already (previousEnd - overlap)
    const chunk = text.substring(startIndex, endIndex).trim();
    
    if (chunk) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    
    // Avoid infinite loop if overlap >= chunkSize
    if (startIndex >= text.length || overlap >= chunkSize) break;
  }

  return chunks;
}
