import {
    completeUploadApi,
    type FileCompleteRequest,
    type FileUploadPolicyRequest,
    getUploadPolicyApi,
    type SysFileVO,
} from '#/api/file';

export interface UploadToOssOptions {
    bizType: 'user' | 'store' | 'product' | 'common';
    mediaType: 'image' | 'video';
    file: File;
    onProgress?: (percent: number) => void;
}

export async function uploadToOss(options: UploadToOssOptions): Promise<SysFileVO> {
    const {bizType, mediaType, file, onProgress} = options;

    // 1. 获取上传凭证
    const policyReq: FileUploadPolicyRequest = {
        bizType,
        mediaType,
        fileName: file.name,
        contentType: file.type,
    };

    // 如果你的 requestClient 已经自动拆 data，这里直接用 policyRes 即可
    const policy = await getUploadPolicyApi(policyReq);

    // 2. 直传 OSS
    await uploadFileToOss(policy.endpoint, {
        key: policy.objectKey,
        policy: policy.policy,
        OSSAccessKeyId: policy.accessKeyId,
        Signature: policy.signature,
        success_action_status: '200',
        file,
    }, onProgress);

    // 3. 通知后端上传完成
    const completeReq: FileCompleteRequest = {
        bizType,
        mediaType,
        objectKey: policy.objectKey,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        md5: '',
    };

    return await completeUploadApi(completeReq);
}

interface OssFormData {
    key: string;
    policy: string;
    OSSAccessKeyId: string;
    Signature: string;
    success_action_status: string;
    file: File;
}

function uploadFileToOss(
    endpoint: string,
    data: OssFormData,
    onProgress?: (percent: number) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', endpoint, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`OSS 上传失败，状态码: ${xhr.status}，响应: ${xhr.responseText}`));
            }
        };

        xhr.onerror = () => {
            reject(new Error('OSS 上传失败，网络异常'));
        };

        const formData = new FormData();
        formData.append('key', data.key);
        formData.append('policy', data.policy);
        formData.append('OSSAccessKeyId', data.OSSAccessKeyId);
        formData.append('Signature', data.Signature);
        formData.append('success_action_status', data.success_action_status);
        formData.append('file', data.file);

        xhr.send(formData);
    });
}
