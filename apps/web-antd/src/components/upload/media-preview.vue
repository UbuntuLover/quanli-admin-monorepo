<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { MediaItem, MediaModelValue } from './types';
import { formatFileSize, isImageMedia, isVideoMedia } from './media-utils';

interface Props {
    modelValue?: MediaModelValue;
    grid?: boolean;
    readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    grid: true,
    readonly: true,
});

const previewVisible = ref(false);
const previewTitle = ref('');
const currentImage = ref('');
const currentVideo = ref('');
const currentType = ref<'image' | 'video' | ''>('');

const mediaList = computed<MediaItem[]>(() => {
    if (!props.modelValue) return [];
    return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
});

function openPreview(item: MediaItem) {
    previewTitle.value = item.originalName;
    if (isImageMedia(item)) {
        currentType.value = 'image';
        currentImage.value = item.previewUrl || item.url;
        currentVideo.value = '';
    } else if (isVideoMedia(item)) {
        currentType.value = 'video';
        currentVideo.value = item.previewUrl || item.url;
        currentImage.value = '';
    } else {
        currentType.value = '';
        currentVideo.value = '';
        currentImage.value = '';
    }
    previewVisible.value = true;
}
</script>

<template>
    <div v-if="mediaList.length" class="w-full">
        <div
            v-if="grid"
            class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
        >
            <div
                v-for="item in mediaList"
                :key="item.fileId"
                class="overflow-hidden rounded border bg-white"
            >
                <div
                    class="flex h-40 cursor-pointer items-center justify-center overflow-hidden bg-[var(--ant-color-fill-alter)]"
                    @click="openPreview(item)"
                >
                    <img
                        v-if="isImageMedia(item)"
                        :src="item.previewUrl || item.url"
                        :alt="item.originalName"
                        class="h-full w-full object-cover"
                    />
                    <video
                        v-else-if="isVideoMedia(item)"
                        :src="item.previewUrl || item.url"
                        class="h-full w-full object-cover"
                        muted
                    />
                    <div v-else class="text-xs text-[var(--ant-color-text-description)]">
                        无法预览
                    </div>
                </div>

                <div class="space-y-1 p-2">
                    <div class="truncate text-sm font-medium" :title="item.originalName">
                        {{ item.originalName }}
                    </div>
                    <div class="text-xs text-[var(--ant-color-text-description)]">
                        {{ item.mediaType }} / {{ formatFileSize(item.size) }}
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="space-y-2">
            <div
                v-for="item in mediaList"
                :key="item.fileId"
                class="flex items-center justify-between rounded border px-3 py-2"
            >
                <div class="min-w-0 flex-1">
                    <div class="truncate font-medium">{{ item.originalName }}</div>
                    <div class="text-xs text-[var(--ant-color-text-description)]">
                        {{ item.mediaType }} / {{ formatFileSize(item.size) }}
                    </div>
                </div>
                <a-button type="link" @click="openPreview(item)">预览</a-button>
            </div>
        </div>

        <a-modal
            v-model:open="previewVisible"
            :title="previewTitle"
            :footer="null"
            width="900px"
            destroy-on-close
        >
            <img
                v-if="currentType === 'image'"
                :src="currentImage"
                alt="preview"
                style="width: 100%"
            />
            <video
                v-else-if="currentType === 'video'"
                :src="currentVideo"
                controls
                style="width: 100%; max-height: 70vh; background: #000"
            />
            <div v-else>暂不支持预览</div>
        </a-modal>
    </div>

    <a-empty v-else description="暂无媒体资源" />
</template>
