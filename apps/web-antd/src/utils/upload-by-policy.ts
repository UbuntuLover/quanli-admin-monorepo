import { baseRequestClient } from '#/api/request';
import {
    completeUploadApi,
    getUploadPolicyApi,
    type FileUploadPolicyVO,
    type SysFileVO,
} from '#/api/file';

type BizType = 'user' | 'store' | 'product' | 'common';
type MediaType = 'image' | 'video';

export interface UploadByPolicyOptions {
    bizType: BizType;
    mediaType: MediaType;
    onProgress?: (percent: number) => void;
}

export async function uploadByPolicy(
    file: File,
    options: UploadByPolicyOptions,
): Promise<SysFileVO> {
    const { bizType, mediaType, onProgress } = options;

    const policy = (await getUploadPolicyApi({
        bizType,
        mediaType,
        fileName: file.name,
        contentType: file.type || (mediaType === 'image' ? 'image/jpeg' : 'video/mp4'),
    })) as FileUploadPolicyVO;

    const formData = new FormData();
    formData.append('key', policy.objectKey);
    formData.append('policy', policy.policy);
    formData.append('OSSAccessKeyId', policy.accessKeyId);
    formData.append('signature', policy.signature);
    formData.append('success_action_status', '200');
    formData.append('file', file);

    await baseRequestClient.post(policy.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt: ProgressEvent) => {
            if (!evt.total) return;
            const percent = Math.round((evt.loaded / evt.total) * 100);
            onProgress?.(percent);
        },
    });

    const saved = (await completeUploadApi({
        bizType,
        mediaType,
        objectKey: policy.objectKey,
        originalName: file.name,
        size: file.size,
        mimeType: file.type || (mediaType === 'image' ? 'image/jpeg' : 'video/mp4'),
    })) as SysFileVO;

    return saved;
}
;