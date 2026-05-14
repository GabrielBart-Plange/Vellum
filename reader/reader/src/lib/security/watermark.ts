/**
 * Vellum Invisible Watermarking System
 * 
 * Uses Zero-Width Characters to embed hidden identifiers in text.
 * \u200B - Zero Width Space
 * \u200C - Zero Width Non-Joiner
 * \u200D - Zero Width Joiner
 */

const ZW_MAP: Record<string, string> = {
    '0': '\u200B',
    '1': '\u200C',
    '2': '\u200D',
};

const ZW_REVERSE: Record<string, string> = {
    '\u200B': '0',
    '\u200C': '1',
    '\u200D': '2',
};

/**
 * Encodes a string into a zero-width sequence
 */
export function encodeWatermark(text: string): string {
    const binary = text.split('').map(char => {
        return char.charCodeAt(0).toString(3).padStart(8, '0'); // Base 3 encoding
    }).join('');

    return binary.split('').map(bit => ZW_MAP[bit]).join('');
}

/**
 * Decodes a zero-width sequence back into a string
 */
export function decodeWatermark(zwSequence: string): string {
    let binary = '';
    for (const char of zwSequence) {
        if (ZW_REVERSE[char]) {
            binary += ZW_REVERSE[char];
        }
    }

    if (!binary) return '';

    const chunks = binary.match(/.{1,8}/g) || [];
    return chunks.map(chunk => String.fromCharCode(parseInt(chunk, 3))).join('');
}

/**
 * Injects a watermark into the content
 * @param content The story content
 * @param identifier The string to hide (e.g. "VELLUM" or User ID)
 */
export function applyWatermark(content: string, identifier: string = "VELLUM"): string {
    if (!content) return content;
    
    const watermark = encodeWatermark(`[VLM:${identifier}]`);
    const words = content.split(' ');
    
    // We inject the watermark into 10% of the spaces to keep it pervasive but subtle
    const result = words.map((word, index) => {
        if (index > 0 && index % 15 === 0) {
            return watermark + word;
        }
        return word;
    }).join(' ');

    return result;
}
