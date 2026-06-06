import { decode } from 'entities'
import { marked } from 'marked'

// Detect if content is markdown (not HTML).
// HTML content starts with a tag; markdown starts with plain text, #, *, etc.
function isMarkdown(str) {
    const trimmed = (str || '').trim()
    if (!trimmed) return false
    // If it starts with an HTML tag, treat as HTML
    if (/^<[a-zA-Z]/.test(trimmed)) return false
    // Contains markdown image syntax or other markdown markers
    if (/!\[/.test(trimmed)) return true
    if (/^#{1,6}\s/.test(trimmed)) return true
    if (/\*\*|__|\*[^*]|_[^_]/.test(trimmed)) return true
    return false
}

/**
 * Convert a product description to safe HTML string.
 * Handles both HTML (from the editor after Markdown plugin removal)
 * and legacy Markdown (from when the Markdown plugin was active).
 */
export function renderDescription(raw) {
    if (!raw) return ''
    const decoded = decode(raw)
    if (isMarkdown(decoded)) {
        return marked.parse(decoded)
    }
    return decoded
}
