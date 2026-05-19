import {requestClient} from '#/api/request';

export interface FileUploadPolicyRequest {
    bizType: 'user' | 'store' | 'product' | 'common';
    mediaType: 'image' | 'video';
    fileName: string;
    contentType: string;
}


export interface FileUploadPolicyVO {
    bucket: string;
    endpoint: string;
    publicUrl: string;
    objectKey: string;
    dir: string;
    accessKeyId: string;
    policy: string;
    signature: string;
    expire: number;
}

export interface FileCompleteRequest {
    bizType: 'user' | 'store' | 'product' | 'common';
    mediaType: 'image' | 'video';
    objectKey: string;
    originalName: string;
    size: number;
    mimeType: string;
    md5?: string;
}

export interface SysFileVO {
    id: number;
    bizType: string;
    mediaType: string;
    bucket: string;
    objectKey: string;
    url: string;
    previewUrl: string;
    originalName: string;
    extension?: string;
    mimeType?: string;
    size: number;
    md5?: string;
    uploadedBy?: number;
}

export interface FileDeleteRequest {
    fileId: number;
}

export interface FileBatchDeleteRequest {
    fileIds: number[];
}

export function deleteFileApi(data: FileDeleteRequest) {
    return requestClient.post<boolean>('/api/file/delete', data);
}

export function batchDeleteFilesApi(data: FileBatchDeleteRequest) {
    return requestClient.post<boolean>('/api/file/batch-delete', data);
}

export function getUploadPolicyApi(data: FileUploadPolicyRequest) {
    return requestClient.post<FileUploadPolicyVO>('/api/file/upload-policy', data);
}

export function completeUploadApi(data: FileCompleteRequest) {
    return requestClient.post<SysFileVO>('/api/file/complete', data);
}

export function getFileDetailApi(fileId: number) {
    return requestClient.get<SysFileVO>(`/api/file/${fileId}`);
}

export function getFilePreviewApi(fileId: number, w?: number, h?: number) {
    const query: string[] = [];
    if (w) query.push(`w=${w}`);
    if (h) query.push(`h=${h}`);
    const qs = query.length ? `?${query.join('&')}` : '';
    return requestClient.get<{ fileId: number; previewUrl: string; thumbUrl: string; expireAt: number }>(
        `/api/file/${fileId}/preview${qs}`,
    );
}