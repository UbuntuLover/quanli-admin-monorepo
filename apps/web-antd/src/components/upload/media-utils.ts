import type { MediaType } from './types';

export function resolveMediaType(file: File): MediaType | null {
    if (file.type.startsWith('image/')) {
        return 'image';
    }
    if (file.type.startsWith('video/')) {
        return 'video';
    }
    return null;
}

export function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function isImageMedia(item: { mediaType?: string; mimeType?: string }) {
    return item.mediaType === 'image' || item.mimeType?.startsWith('image/');
}

export function isVideoMedia(item: { mediaType?: string; mimeType?: string }) {
    return item.mediaType === 'video' || item.mimeType?.startsWith('video/');
}

export function getFileExtension(fileName?: string) {
    if (!fileName) return '';
    const index = fileName.lastIndexOf('.');
    return index >= 0 ? fileName.slice(index + 1).toLowerCase() : '';
}

export function getVideoPoster(item: {
    coverUrl?: string;
    previewUrl?: string;
    url?: string;
}) {
    return item.coverUrl || '';
}
