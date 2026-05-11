<script lang="ts" setup>
import {computed, ref, watch} from 'vue';
import {message, Upload as AUpload, Modal as AModal} from 'ant-design-vue';
import type {UploadFile, UploadProps} from 'ant-design-vue';
import {uploadToOss} from '#/services/upload/oss-upload';
import type {BizType, MediaItem, MediaModelValue} from './types';

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
    maxSizeMb: 10,
});

const emit = defineEmits<{
    'update:modelValue': [value: MediaModelValue];
    change: [value: MediaModelValue];
}>();

const innerFileList = ref<UploadFile[]>([]);
const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');
const uploading = ref(false);

const isMultiple = computed(() => props.multiple);

function normalizeModelValueToArray(value: MediaModelValue): MediaItem[] {
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}

function mapModelToUploadFileList(value: MediaModelValue): UploadFile[] {
    return normalizeModelValueToArray(value).map((item) => ({
        uid: String(item.fileId),
        name: item.originalName,
        status: 'done',
        url: item.previewUrl || item.url,
    }));
}

watch(
    () => props.modelValue,
    (val) => {
        innerFileList.value = mapModelToUploadFileList(val);
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

    const allowMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowMime.includes(rawFile.type)) {
        message.error('仅支持 jpg/jpeg/png/webp 图片');
        return Upload.LIST_IGNORE;
    }

    const isLtLimit = rawFile.size / 1024 / 1024 <= props.maxSizeMb;
    if (!isLtLimit) {
        message.error(`图片大小不能超过 ${props.maxSizeMb}MB`);
        return Upload.LIST_IGNORE;
    }

    const current = normalizeModelValueToArray(props.modelValue);
    if (current.length >= props.maxCount) {
        message.warning(`最多只能上传 ${props.maxCount} 张图片`);
        return Upload.LIST_IGNORE;
    }

    return true;
};

const customRequest: UploadProps['customRequest'] = async (options) => {
    const rawFile = options.file as File;

    try {
        uploading.value = true;

        const result = await uploadToOss({
            bizType: props.bizType,
            mediaType: 'image',
            file: rawFile,
            onProgress: (percent) => {
                options.onProgress?.({percent});
            },
        });

        const item: MediaItem = {
            fileId: result.id,
            mediaType: 'image',
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

const handlePreview: UploadProps['onPreview'] = async (file) => {
    previewImage.value = (file.url || file.thumbUrl || '') as string;
    previewVisible.value = true;
    previewTitle.value = file.name || '图片预览';
};

const canUpload = computed(() => {
    if (props.disabled) {
        return false;
    }
    const current = normalizeModelValueToArray(props.modelValue);
    return current.length < props.maxCount;
});
</script>

<template>
    <div class="w-full">
        <a-upload
            list-type="picture-card"
            :multiple="multiple"
            :max-count="maxCount"
            :file-list="innerFileList"
            :before-upload="beforeUpload"
            :custom-request="customRequest"
            :on-remove="handleRemove"
            :on-preview="handlePreview"
            :show-upload-list="true"
            :disabled="disabled"
            accept=".jpg,.jpeg,.png,.webp"
        >
            <div v-if="canUpload">
                <div class="text-xs text-[var(--ant-color-text-description)]">
                    {{ uploading ? '上传中...' : '上传图片' }}
                </div>
            </div>
        </a-upload>

        <a-modal
            v-model:open="previewVisible"
            :title="previewTitle"
            :footer="null"
            width="720px"
            destroy-on-close
        >
            <img alt="preview" style="width: 100%" :src="previewImage"/>
        </a-modal>
    </div>
</template>
