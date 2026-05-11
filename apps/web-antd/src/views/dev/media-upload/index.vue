<template>
    <div class="p-4 media-upload-playground">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">MediaUpload 组件预览</div>
                        <div class="mt-1 text-xs text-gray-400">
                            用于独立验证样式、上传限制、暗色模式表现和数据回填
                        </div>
                    </div>
                    <a-tag color="blue">Playground</a-tag>
                </div>
            </template>

            <a-row :gutter="[16, 16]">
                <!-- 左侧：控制面板 -->
                <a-col :xs="24" :lg="8">
                    <a-card size="small" title="控制面板">
                        <a-form layout="vertical">
                            <a-form-item label="业务类型 bizType">
                                <a-select v-model:value="panel.bizType" :options="bizTypeOptions" />
                            </a-form-item>

                            <a-form-item label="列表样式 listType">
                                <a-segmented
                                    v-model:value="panel.listType"
                                    :options="[
                    { label: '卡片', value: 'card' },
                    { label: '文本', value: 'text' }
                  ]"
                                />
                            </a-form-item>

                            <a-form-item label="最大数量 maxCount">
                                <a-input-number
                                    v-model:value="panel.maxCount"
                                    :min="1"
                                    :max="50"
                                    style="width: 100%"
                                />
                            </a-form-item>

                            <a-row :gutter="12">
                                <a-col :span="12">
                                    <a-form-item label="multiple">
                                        <a-switch v-model:checked="panel.multiple" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="draggable">
                                        <a-switch v-model:checked="panel.draggable" />
                                    </a-form-item>
                                </a-col>
                            </a-row>

                            <a-row :gutter="12">
                                <a-col :span="12">
                                    <a-form-item label="disabled">
                                        <a-switch v-model:checked="panel.disabled" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="showHint">
                                        <a-switch v-model:checked="panel.showHint" />
                                    </a-form-item>
                                </a-col>
                            </a-row>

                            <a-divider orientation="left">接受类型</a-divider>

                            <a-row :gutter="12">
                                <a-col :span="12">
                                    <a-form-item label="图片 image">
                                        <a-switch v-model:checked="panel.acceptImage" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="视频 video">
                                        <a-switch v-model:checked="panel.acceptVideo" />
                                    </a-form-item>
                                </a-col>
                            </a-row>

                            <a-form-item label="图片大小限制(MB)">
                                <a-input-number
                                    v-model:value="panel.imageMaxSizeMb"
                                    :min="1"
                                    :max="100"
                                    style="width: 100%"
                                />
                            </a-form-item>

                            <a-form-item label="视频大小限制(MB)">
                                <a-input-number
                                    v-model:value="panel.videoMaxSizeMb"
                                    :min="10"
                                    :max="1024"
                                    style="width: 100%"
                                />
                            </a-form-item>

                            <a-space>
                                <a-button @click="mockOneImage">灌入1条图片Mock</a-button>
                                <a-button @click="mockTwoMixed">灌入图+视频Mock</a-button>
                                <a-button danger @click="clearAll">清空</a-button>
                            </a-space>
                        </a-form>
                    </a-card>
                </a-col>

                <!-- 右侧：预览区 -->
                <a-col :xs="24" :lg="16">
                    <a-card size="small" title="组件预览区">
                        <MediaUpload
                            v-model="modelValue"
                            :biz-type="panel.bizType"
                            :multiple="panel.multiple"
                            :max-count="panel.maxCount"
                            :disabled="panel.disabled"
                            :draggable="panel.draggable"
                            :list-type="panel.listType"
                            :show-hint="panel.showHint"
                            :accept-config="{
                image: panel.acceptImage,
                video: panel.acceptVideo
              }"
                            :limit-config="{
                imageMaxSizeMb: panel.imageMaxSizeMb,
                videoMaxSizeMb: panel.videoMaxSizeMb
              }"
                        />
                    </a-card>

                    <a-card class="mt-4" size="small" title="v-model 输出（实时）">
                        <pre class="json-box">{{ prettyValue }}</pre>
                    </a-card>
                </a-col>
            </a-row>
        </a-card>
    </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    InputNumber as AInputNumber,
    Row as ARow,
    Segmented as ASegmented,
    Select as ASelect,
    Space as ASpace,
    Switch as ASwitch,
    Tag as ATag,
} from 'ant-design-vue';
import { MediaUpload } from '#/components/upload';
import type { BizType, MediaItem, MediaModelValue } from '#/components/upload';

defineOptions({ name: 'MediaUploadPlayground' });

const bizTypeOptions = [
    { label: 'user', value: 'user' },
    { label: 'store', value: 'store' },
    { label: 'product', value: 'product' },
    { label: 'common', value: 'common' },
];

const panel = reactive({
    bizType: 'user' as BizType,
    listType: 'card' as 'card' | 'text',
    maxCount: 9,
    multiple: true,
    draggable: true,
    disabled: false,
    showHint: true,
    acceptImage: true,
    acceptVideo: false,
    imageMaxSizeMb: 10,
    videoMaxSizeMb: 300,
});

const modelValue = ref<MediaModelValue>([]);

const prettyValue = computed(() => JSON.stringify(modelValue.value, null, 2));

function clearAll() {
    modelValue.value = panel.multiple ? [] : null;
}

function mockOneImage() {
    const one: MediaItem = {
        fileId: Date.now(),
        mediaType: 'image',
        url: 'https://dummyimage.com/600x400/ddd/333&text=Mock+Image',
        previewUrl: 'https://dummyimage.com/600x400/ddd/333&text=Mock+Image',
        originalName: 'mock-image.jpg',
        size: 245678,
        mimeType: 'image/jpeg',
        objectKey: 'mock/mock-image.jpg',
        coverUrl: '',
    };
    modelValue.value = panel.multiple ? [one] : one;
}

function mockTwoMixed() {
    const image: MediaItem = {
        fileId: Date.now(),
        mediaType: 'image',
        url: 'https://dummyimage.com/600x400/ccc/222&text=Mock+Image+2',
        previewUrl: 'https://dummyimage.com/600x400/ccc/222&text=Mock+Image+2',
        originalName: 'mock-image-2.jpg',
        size: 312000,
        mimeType: 'image/jpeg',
        objectKey: 'mock/mock-image-2.jpg',
        coverUrl: '',
    };
    const video: MediaItem = {
        fileId: Date.now() + 1,
        mediaType: 'video',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        previewUrl: '',
        originalName: 'mock-video.mp4',
        size: 2048000,
        mimeType: 'video/mp4',
        objectKey: 'mock/mock-video.mp4',
        coverUrl: '',
    };

    if (!panel.multiple) {
        modelValue.value = image;
        return;
    }
    modelValue.value = [image, video];
}
</script>

<style scoped>
.json-box {
    max-height: 320px;
    overflow: auto;
    padding: 12px;
    border-radius: 8px;
    background: var(--ant-color-fill-quaternary);
    font-size: 12px;
    line-height: 1.6;
}
</style>
