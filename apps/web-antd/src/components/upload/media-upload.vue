<script lang="ts" setup>
import {computed, ref} from 'vue';
import {
    DeleteOutlined,
    EyeOutlined,
    InboxOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons-vue';
import {
    message,
    Upload as AUpload,
    UploadDragger as AUploadDragger,
    Button as AButton,
    Modal,
} from 'ant-design-vue';

import {deleteFileApi} from '#/api/file';

import type {UploadProps} from 'ant-design-vue';
import {uploadToOss} from '#/services/upload/oss-upload';
import type {
    BizType,
    MediaItem,
    MediaModelValue,
    MediaUploadAcceptConfig,
    MediaUploadLimitConfig,
} from './types';
import {
    formatFileSize,
    getVideoPoster,
    isImageMedia,
    isVideoMedia,
    resolveMediaType,
} from './media-utils';

defineOptions({name: 'MediaUpload'});

interface Props {
    bizType: BizType;
    modelValue?: MediaModelValue;
    multiple?: boolean;
    maxCount?: number;
    disabled?: boolean;
    draggable?: boolean;
    listType?: 'card' | 'text';
    acceptConfig?: MediaUploadAcceptConfig;
    limitConfig?: MediaUploadLimitConfig;
    showHint?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    multiple: true,
    maxCount: 20,
    disabled: false,
    draggable: true,
    listType: 'card',
    showHint: true,
    acceptConfig: () => ({image: true, video: true}),
    limitConfig: () => ({imageMaxSizeMb: 10, videoMaxSizeMb: 300}),
});

const emit = defineEmits<{
    'update:modelValue': [value: MediaModelValue];
    change: [value: MediaModelValue];
}>();

const uploading = ref(false);
const previewVisible = ref(false);
const previewTitle = ref('');
const previewType = ref<'image' | 'video' | ''>('');
const previewUrl = ref('');
const pendingCount = ref(0);

const mediaList = computed<MediaItem[]>(() => {
    if (!props.modelValue) return [];
    return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
});

const canUpload = computed(() => {
    if (props.disabled) return false;
    return mediaList.value.length < props.maxCount;
});

const accept = computed(() => {
    const list: string[] = [];
    if (props.acceptConfig.image) list.push('.jpg,.jpeg,.png,.webp');
    if (props.acceptConfig.video) list.push('.mp4,.mov');
    return list.join(',');
});

const uploadHint = computed(() => {
    const text: string[] = [];
    if (props.acceptConfig.image) text.push('图片(jpg/png/webp)');
    if (props.acceptConfig.video) text.push('视频(mp4/mov)');
    return text.join(' / ');
});

const showBottomHint = computed(() => props.showHint && !props.draggable);

function emitValue(list: MediaItem[]) {
    const next: MediaModelValue = props.multiple ? list : (list[0] ?? null);
    emit('update:modelValue', next);
    emit('change', next);
}

function buildThumbUrl(item: MediaItem) {
    if (isImageMedia(item)) return item.previewUrl || item.url;
    if (isVideoMedia(item)) return getVideoPoster(item);
    return '';
}

function getCardImageSrc(item: MediaItem) {
    if (isImageMedia(item)) return item.previewUrl || item.url;
    if (isVideoMedia(item)) return buildThumbUrl(item);
    return '';
}

function validateFile(file: File): { passed: boolean; mediaType?: 'image' | 'video' } {
    const mediaType = resolveMediaType(file);

    if (!mediaType) {
        message.error('仅支持图片或视频文件');
        return {passed: false};
    }

    if (mediaType === 'image') {
        if (!props.acceptConfig.image) {
            message.error('当前不允许上传图片');
            return {passed: false};
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            message.error('仅支持 jpg/jpeg/png/webp 图片');
            return {passed: false};
        }
        const limit = props.limitConfig.imageMaxSizeMb ?? 10;
        if (file.size / 1024 / 1024 > limit) {
            message.error(`图片大小不能超过 ${limit}MB`);
            return {passed: false};
        }
        return {passed: true, mediaType};
    }

    if (mediaType === 'video') {
        if (!props.acceptConfig.video) {
            message.error('当前不允许上传视频');
            return {passed: false};
        }
        if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
            message.error('仅支持 mp4/mov 视频');
            return {passed: false};
        }
        const limit = props.limitConfig.videoMaxSizeMb ?? 300;
        if (file.size / 1024 / 1024 > limit) {
            message.error(`视频大小不能超过 ${limit}MB`);
            return {passed: false};
        }
        return {passed: true, mediaType};
    }

    return {passed: false};
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const result = validateFile(file as File);
    if (!result.passed) return false;

    const occupied = mediaList.value.length + pendingCount.value;
    if (occupied >= props.maxCount) {
        message.warning(`最多只能上传 ${props.maxCount} 个文件`);
        return false;
    }

    pendingCount.value += 1;
    return true;
};

const customRequest: UploadProps['customRequest'] = async (options) => {
    const rawFile = options.file as File;
    const result = validateFile(rawFile);

    if (!result.passed || !result.mediaType) {
        pendingCount.value = Math.max(0, pendingCount.value - 1);
        options.onError?.(new Error('文件校验失败'));
        return;
    }

    try {
        uploading.value = true;
        const uploaded = await uploadToOss({
            bizType: props.bizType,
            mediaType: result.mediaType,
            file: rawFile,
            onProgress: (percent) => options.onProgress?.({percent}),
        });

        const item: MediaItem = {
            fileId: uploaded.id,
            mediaType: result.mediaType,
            url: uploaded.url,
            previewUrl: uploaded.previewUrl,
            originalName: uploaded.originalName,
            size: uploaded.size,
            mimeType: uploaded.mimeType,
            objectKey: uploaded.objectKey,
            coverUrl: '',
        };

        const next = props.multiple
            ? [...mediaList.value, item].slice(0, props.maxCount)
            : [item];

        emitValue(next);
        options.onSuccess?.(uploaded);
        message.success('上传成功');
    } catch (e: any) {
        console.error(e);
        message.error(e?.message || '上传失败');
        options.onError?.(e);
    } finally {
        pendingCount.value = Math.max(0, pendingCount.value - 1);
        uploading.value = false;
    }
};

function handlePreviewItem(item: MediaItem) {
    previewTitle.value = item.originalName;
    previewType.value = item.mediaType;
    previewUrl.value = item.previewUrl || item.url;
    previewVisible.value = true;
}

async function handleDeleteItem(item: MediaItem) {
    if (props.disabled) return;

    try {
        await new Promise<void>((resolve, reject) => {
            Modal.confirm({
                title: '确认删除',
                content: '删除后会同时移除云端文件，且不可恢复。',
                okText: '删除',
                okType: 'danger',
                cancelText: '取消',
                centered: true,
                onOk: async () => {
                    try {
                        await deleteFileApi({fileId: item.fileId});
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                },
                onCancel: () => reject(new Error('cancel')),
            });
        });

        emitValue(mediaList.value.filter((m) => m.fileId !== item.fileId));
        message.success('删除成功');
    } catch (e: any) {
        if (e?.message === 'cancel') return;
        console.error(e);
        message.error(e?.message || '删除失败');
    }
}

</script>

<template>
    <div class="media-upload">

        <a-upload-dragger
            v-if="props.draggable && canUpload"
            class="media-upload__dragger"
            :multiple="props.multiple"
            :show-upload-list="false"
            :before-upload="beforeUpload"
            :custom-request="customRequest"
            :disabled="props.disabled"
            :accept="accept"
        >
            <p class="ant-upload-drag-icon">
                <InboxOutlined/>
            </p>
            <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p class="ant-upload-hint">支持 {{ uploadHint }}，最多 {{ props.maxCount }} 个文件</p>
        </a-upload-dragger>

        <a-upload
            v-else-if="canUpload"
            :multiple="props.multiple"
            :show-upload-list="false"
            :before-upload="beforeUpload"
            :custom-request="customRequest"
            :disabled="props.disabled"
            :accept="accept"
        >
            <a-button :loading="uploading">上传媒体</a-button>
        </a-upload>

        <div v-if="showBottomHint" class="media-upload__hint">
            支持 {{ uploadHint }}，最多 {{ props.maxCount }} 个文件
        </div>

        <div v-if="mediaList.length && props.listType === 'card'" class="media-grid">
            <div v-for="item in mediaList" :key="item.fileId" class="media-card">
                <div class="media-card__cover">
                    <img
                        v-if="isImageMedia(item)"
                        :src="getCardImageSrc(item)"
                        :alt="item.originalName"
                        class="media-card__img"
                    />

                    <div v-else-if="isVideoMedia(item)" class="media-card__video">
                        <img
                            v-if="getCardImageSrc(item)"
                            :src="getCardImageSrc(item)"
                            :alt="item.originalName"
                            class="media-card__img media-card__img--video"
                        />
                        <div v-else class="media-card__video-empty">
                            <VideoCameraOutlined/>
                        </div>
                        <div class="media-card__video-mask">
                            <span class="media-card__video-icon"><VideoCameraOutlined/></span>
                        </div>
                    </div>

                    <div class="media-card__actions">
                        <a-button size="small" shape="circle" @click="handlePreviewItem(item)">
                            <template #icon>
                                <EyeOutlined/>
                            </template>
                        </a-button>
                        <a-button size="small" shape="circle" danger :disabled="props.disabled"
                                  @click="handleDeleteItem(item)">
                            <template #icon>
                                <DeleteOutlined/>
                            </template>
                        </a-button>
                    </div>
                </div>

                <div class="media-card__meta">
                    <div class="media-card__name" :title="item.originalName">{{ item.originalName }}</div>
                    <div class="media-card__sub">{{ item.mediaType }} / {{ formatFileSize(item.size) }}</div>
                </div>
            </div>
        </div>

        <div v-if="mediaList.length && props.listType === 'text'" class="media-text-list">
            <div v-for="item in mediaList" :key="item.fileId" class="media-text-row">
                <div class="media-text-row__main">
                    <div class="media-text-row__name">{{ item.originalName }}</div>
                    <div class="media-text-row__sub">{{ item.mediaType }} / {{ formatFileSize(item.size) }}</div>
                </div>
                <div class="media-text-row__actions">
                    <a-button size="small" @click="handlePreviewItem(item)">预览</a-button>
                    <a-button size="small" danger :disabled="props.disabled" @click="handleDeleteItem(item)">删除
                    </a-button>
                </div>
            </div>
        </div>

        <Modal
            v-model:open="previewVisible"
            :title="previewTitle"
            :footer="null"
            width="800px"
            centered
            destroy-on-close
        >
            <div class="media-preview">
                <img v-if="previewType === 'image'" :src="previewUrl" alt="preview" class="media-preview__img"/>
                <video v-else-if="previewType === 'video'" :src="previewUrl" controls class="media-preview__video"/>
                <div v-else class="media-preview__empty">无法预览</div>
            </div>
        </Modal>
    </div>
</template>

<style scoped>
.media-upload {
    width: 100%;
}

.media-upload__debug {
    margin: 8px 0;
    font-size: 12px;
    color: #ff7875;
}

/* 强制恢复 upload 布局，不依赖 tailwind */
.media-upload :deep(.ant-upload-wrapper),
.media-upload :deep(.ant-upload),
.media-upload :deep(.ant-upload-select),
.media-upload :deep(.ant-upload-select-picture-card) {
    width: 100%;
}

.media-upload :deep(.ant-upload-wrapper .ant-upload-drag) {
    width: 100% !important;
    min-height: 152px !important;
    box-sizing: border-box;
    border: 1px dashed var(--ant-color-border) !important;
    border-radius: 10px !important;
    background: var(--ant-color-fill-quaternary) !important;
    padding: 16px 12px !important;
    cursor: pointer;
    transition: all 0.2s ease;
}

.media-upload :deep(.ant-upload-wrapper .ant-upload-drag:hover) {
    border-color: var(--ant-color-primary) !important;
}

.media-upload :deep(.ant-upload-wrapper .ant-upload-btn) {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
}

.media-upload :deep(.ant-upload-wrapper .ant-upload-drag .ant-upload-text) {
    margin: 0 0 4px;
    color: var(--ant-color-text);
}

.media-upload :deep(.ant-upload-wrapper .ant-upload-drag .ant-upload-hint) {
    color: var(--ant-color-text-description);
}

.media-upload__hint {
    margin-top: 8px;
    font-size: 12px;
    color: var(--ant-color-text-description);
}

.media-grid {
    margin-top: 16px;
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 768px) {
    .media-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1280px) {
    .media-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.media-card {
    overflow: hidden;
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: 10px;
    background: var(--ant-color-bg-container);
}

.media-card__cover {
    position: relative;
    height: 160px;
    overflow: hidden;
    background: var(--ant-color-fill-alter);
}

.media-card__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.media-card__img--video {
    opacity: 0.9;
}

.media-card__video {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
}

.media-card__video-empty {
    width: 100%;
    height: 100%;
    display: flex;
    color: rgba(255, 255, 255, 0.85);
    align-items: center;
    justify-content: center;
    font-size: 28px;
}

.media-card__video-mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.media-card__video-icon {
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 999px;
    padding: 8px 10px;
}

.media-card__actions {
    position: absolute;
    right: 8px;
    top: 8px;
    display: flex;
    gap: 8px;
}

.media-card__meta {
    padding: 12px;
}

.media-card__name {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.media-card__sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--ant-color-text-description);
}

.media-text-list {
    margin-top: 16px;
    display: grid;
    gap: 8px;
}

.media-text-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: 8px;
    padding: 8px 12px;
}

.media-text-row__main {
    min-width: 0;
    flex: 1;
}

.media-text-row__name {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.media-text-row__sub {
    margin-top: 2px;
    font-size: 12px;
    color: var(--ant-color-text-description);
}

.media-text-row__actions {
    margin-left: 12px;
    display: flex;
    gap: 8px;
}

.media-preview {
    display: flex;
    align-items: center;
    justify-content: center;
}

.media-preview__img,
.media-preview__video {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
}

.media-preview__empty {
    color: var(--ant-color-text-description);
}

/* 防止全局 reset 干扰 p */
.media-upload :deep(p) {
    margin: 0;
}
</style>
