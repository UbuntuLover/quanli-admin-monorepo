export type BizType = 'user' | 'store' | 'product' | 'common' | 'coach';
export type MediaType = 'image' | 'video';

export interface MediaItem {
    fileId: number;
    mediaType: MediaType;
    url: string;
    previewUrl: string;
    originalName: string;
    size: number;
    mimeType?: string;
    objectKey: string;
    coverUrl?: string;
    sort?: number;
}

export type MediaModelValue = MediaItem[] | MediaItem | null;

export interface MediaUploadAcceptConfig {
    image?: boolean;
    video?: boolean;
}

export interface MediaUploadLimitConfig {
    imageMaxSizeMb?: number;
    videoMaxSizeMb?: number;
}
