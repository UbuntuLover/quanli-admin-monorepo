<script lang="ts" setup>
import {computed, ref, watch} from 'vue';
import {message} from 'ant-design-vue';
import type {UploadFile, UploadProps} from 'ant-design-vue';
import {uploadToOss} from '#/services/upload/oss-upload';
import type {BizType, MediaItem, MediaModelValue} from './types';
import {formatFileSize} from './media-utils';

interface Props {
    bizType: BizType;
    modelValue?: MediaModelValue;
    multiple?: boolean;
    maxCount?: number;
    disabled?: boolean;
    maxSizeMb?: number;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    multiple: false,
    maxCount: 1,
    disabled: false,
    maxSizeMb: 300,
});

const emit = defineEmits<{
    'update:modelValue': [value: MediaModelValue];
    change: [value: MediaModelValue];
}>();

const innerFileList = ref<UploadFile[]>([]);
const uploading = ref(false);
const previewVisible = ref(false);
const previewTitle = ref('');
const previewVideoUrl = ref('');

const isMultiple = computed(() => props.multiple);

function normalizeModelValueToArray(value: MediaModelValue): MediaItem[] {
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}

watch(
    () => props.modelValue,
    (val) => {
        innerFileList.value = normalizeModelValueToArray(val).map((item) => ({
            uid: String(item.fileId),
            name: item.originalName,
            status: 'done',
            url: item.previewUrl || item.url,
        }));
    },
    {immediate: true, deep: true},
);

function emitValue(list: MediaItem[]) {
    const nextValue: MediaModelValue = isMultiple.value ? list : (list[0] ?? null);
    emit('update:modelValue', nextValue);
    emit('change', nextValue);
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const rawFile = file as File;

    const allowMime = ['video/mp4', 'video/quicktime'];
    if (!allowMime.includes(rawFile.type)) {
        message.error('仅支持 mp4/mov 视频');
        return false;
    }

    const isLtLimit = rawFile.size / 1024 / 1024 <= props.maxSizeMb;
    if (!isLtLimit) {
        message.error(`视频大小不能超过 ${props.maxSizeMb}MB`);
        return false;
    }

    const current = normalizeModelValueToArray(props.modelValue);
    if (current.length >= props.maxCount) {
        message.warning(`最多只能上传 ${props.maxCount} 个视频`);
        return false;
    }

    return true;
};

const customRequest: UploadProps['customRequest'] = async (options) => {
    const rawFile = options.file as File;

    try {
        uploading.value = true;

        const result = await uploadToOss({
            bizType: props.bizType,
            mediaType: 'video',
            file: rawFile,
            onProgress: (percent) => {
                options.onProgress?.({percent});
            },
        });

        const item: MediaItem = {
            fileId: result.id,
            mediaType: 'video',
            url: result.url,
            previewUrl: result.previewUrl,
            originalName: result.originalName,
            size: result.size,
            mimeType: result.mimeType,
            objectKey: result.objectKey,
        };

        const current = normalizeModelValueToArray(props.modelValue);
        const next = isMultiple.value ? [...current, item].slice(0, props.maxCount) : [item];

        emitValue(next);
        options.onSuccess?.(result);
        message.success('上传成功');
    } catch (error: any) {
        console.error(error);
        message.error(error?.message || '上传失败');
        options.onError?.(error);
    } finally {
        uploading.value = false;
    }
};

const handleRemove: UploadProps['onRemove'] = async (file) => {
    const current = normalizeModelValueToArray(props.modelValue);
    const next = current.filter(
        (item) =>
            String(item.fileId) !== String(file.uid) &&
            item.previewUrl !== file.url &&
            item.url !== file.url,
    );
    emitValue(next);
    return true;
};

const canUpload = computed(() => {
    if (props.disabled) {
        return false;
    }
    const current = normalizeModelValueToArray(props.modelValue);
    return current.length < props.maxCount;
});

function handlePreview(item: MediaItem) {
    previewTitle.value = item.originalName;
    previewVideoUrl.value = item.previewUrl || item.url;
    previewVisible.value = true;
}
</script>

<template>
    <div class="w-full space-y-3">
        <a-upload
            :multiple="multiple"
            :max-count="maxCount"
            :file-list="innerFileList"
            :before-upload="beforeUpload"
            :custom-request="customRequest"
            :on-remove="handleRemove"
            :show-upload-list="false"
            :disabled="disabled"
            accept=".mp4,.mov"
        >
            <a-button v-if="canUpload" :loading="uploading">
                {{ uploading ? '上传中...' : '上传视频' }}
            </a-button>
        </a-upload>

        <div
            v-if="normalizeModelValueToArray(modelValue).length"
            class="space-y-2"
        >
            <div
                v-for="item in normalizeModelValueToArray(modelValue)"
                :key="item.fileId"
                class="flex items-center justify-between rounded border px-3 py-2"
            >
                <div class="min-w-0 flex-1">
                    <div class="truncate font-medium" :title="item.originalName">
                        {{ item.originalName }}
                    </div>
                    <div class="text-xs text-[var(--ant-color-text-description)]">
                        {{ item.mimeType || 'video' }} / {{ formatFileSize(item.size) }}
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <a-button type="link" @click="handlePreview(item)">预览</a-button>
                    <a-button
                        danger
                        size="small"
                        :disabled="disabled"
                        @click="emitValue(normalizeModelValueToArray(modelValue).filter((m) => m.fileId !== item.fileId))"
                    >
                        删除
                    </a-button>
                </div>
            </div>
        </div>

        <a-modal
            v-model:open="previewVisible"
            :title="previewTitle"
            :footer="null"
            width="860px"
            destroy-on-close
        >
            <video
                v-if="previewVideoUrl"
                :src="previewVideoUrl"
                controls
                style="width: 100%; max-height: 70vh; background: #000"
            />
        </a-modal>
    </div>
</template>
