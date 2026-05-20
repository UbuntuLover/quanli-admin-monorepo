<template>
    <div class="product-edit-page">
        <a-card :bordered="false" class="edit-card">
            <template #title>
                <div class="page-title">
                    <a-space>
                        <a-button @click="handleBack">返回</a-button>
                        <span>编辑商品</span>
                        <a-tag color="blue">ID: {{ productId }}</a-tag>
                    </a-space>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="fetchDetail" :loading="loading">刷新</a-button>
                    <a-button type="primary" :loading="submitting" @click="handleSubmit">
                        保存
                    </a-button>
                </a-space>
            </template>

            <a-spin :spinning="loading">
                <a-form ref="formRef" :model="formState" layout="vertical">
                    <a-row :gutter="16">
                        <a-col :xs="24" :md="12">
                            <a-form-item
                                label="商品名称"
                                name="name"
                                :rules="[{ required: true, message: '请输入商品名称' }]"
                            >
                                <a-input v-model:value="formState.name" placeholder="请输入商品名称" />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="分类（只读）">
                                <a-input :value="categoryDisplayText" readonly />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="品牌ID（只读）">
                                <a-input :value="brandIdDisplayText" disabled />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="商品状态" name="status">
                                <a-select v-model:value="formState.status" placeholder="请选择状态">
                                    <a-select-option value="ACTIVE">在售</a-select-option>
                                    <a-select-option value="INACTIVE">下架</a-select-option>
                                    <a-select-option value="SOLD_OUT">售罄</a-select-option>
                                </a-select>
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24">
                            <a-form-item label="副标题" name="subtitle">
                                <a-input v-model:value="formState.subtitle" placeholder="请输入副标题" />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24">
                            <a-form-item label="商品描述" name="description">
                                <a-textarea
                                    v-model:value="formState.description"
                                    :rows="5"
                                    placeholder="请输入商品描述"
                                />
                            </a-form-item>
                        </a-col>

                        <!-- 主图预览 -->
                        <a-col :xs="24">
                            <a-form-item label="主图预览" required>
                                <div class="main-image-box">
                                    <div v-if="!mainImageUrl" class="upload-trigger main-upload-trigger" @click="triggerMainImageUpload">
                                        <PlusOutlined />
                                        <div style="margin-top: 8px">点击上传主图</div>
                                    </div>
                                    <div v-else class="main-image-wrapper">
                                        <a-image
                                            :src="mainImageUrl"
                                            :preview="{ src: mainImageUrl }"
                                            :width="140"
                                            :height="140"
                                            class="main-image"
                                        />
                                        <div class="main-image-actions">
                                            <a-button size="small" @click="removeMainImage">删除</a-button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 上传进度条 -->
                                <div v-if="mainImageUploadProgress > 0 && mainImageUploadProgress < 100" class="upload-progress-wrap">
                                    <div class="upload-progress-item">
                                        <span class="upload-progress-name">主图上传中...</span>
                                        <a-progress :percent="mainImageUploadProgress" :show-info="false" />
                                    </div>
                                </div>
                                
                                <div class="images-tip">
                                    主图优先使用 mainImage；若为空则回退图片集第一张。
                                </div>
                                
                                <!-- 隐藏的主图上传组件 -->
                                <a-upload
                                    ref="mainUploadRef"
                                    style="display: none"
                                    :show-upload-list="false"
                                    :accept="'.jpg,.jpeg,.png,.webp'"
                                    :before-upload="beforeMainImageUpload"
                                    :custom-request="handleMainImageCustomRequest"
                                />
                            </a-form-item>
                        </a-col>

                        <!-- 图片集：预览/删除/上传/排序 -->
                        <a-col :xs="24">
                            <a-form-item label="商品图片集（最多10张，可拖拽排序）" required>
                                <div class="images-editor">
                                    <draggable
                                        v-model="imagesFileList"
                                        item-key="uid"
                                        class="sortable-grid"
                                        :animation="200"
                                        handle=".drag-handle"
                                    >
                                        <template #item="{ element, index }">
                                            <div class="img-card">
                                                <div class="drag-handle" title="拖拽排序">☰</div>
                                                <img
                                                    class="img-card__img"
                                                    :src="resolvePreviewUrl(element)"
                                                    :alt="element.name || `图片${index + 1}`"
                                                    @click="handlePreview(element)"
                                                />
                                                <div class="img-card__actions">
                                                    <a-button size="small" @click="handlePreview(element)">预览</a-button>
                                                    <a-button size="small" danger @click="removeImageAt(index)">删除</a-button>
                                                </div>
                                            </div>
                                        </template>
                                    </draggable>

                                    <a-upload
                                        v-if="imagesFileList.length < MAX_IMAGES"
                                        :show-upload-list="false"
                                        :multiple="true"
                                        :accept="'.jpg,.jpeg,.png,.webp'"
                                        :before-upload="beforeImageUpload"
                                        :custom-request="handleImageCustomRequest"
                                    >
                                        <div class="upload-trigger">
                                            <PlusOutlined />
                                            <div style="margin-top: 8px">上传</div>
                                            <div class="upload-trigger__hint">
                                                {{ imagesFileList.length }}/{{ MAX_IMAGES }}
                                            </div>
                                        </div>
                                    </a-upload>
                                </div>

                                <!-- 上传进度 -->
                                <div v-if="uploadProgressList.length" class="upload-progress-wrap">
                                    <div
                                        v-for="item in uploadProgressList"
                                        :key="item.uid"
                                        class="upload-progress-item"
                                    >
                                        <div class="upload-progress-name" :title="item.name">
                                            {{ item.name }}
                                        </div>
                                        <a-progress
                                            :percent="item.percent"
                                            size="small"
                                            :status="item.status === 'error' ? 'exception' : item.status === 'done' ? 'success' : 'active'"
                                        />
                                    </div>
                                </div>

                                <div class="images-tip">
                                    点击图片可预览；拖拽左上角“☰”调整顺序；提交时按当前顺序保存。
                                </div>

                                <a-modal
                                    :open="previewVisible"
                                    :title="previewTitle"
                                    :footer="null"
                                    @cancel="previewVisible = false"
                                    destroy-on-close
                                >
                                    <img alt="preview" style="width: 100%" :src="previewImage" />
                                </a-modal>
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24">
                            <a-form-item label="视频URL" name="videoUrl">
                                <a-input v-model:value="formState.videoUrl" placeholder="https://..." />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="新品" name="isNew">
                                <a-radio-group v-model:value="formState.isNew">
                                    <a-radio :value="1">是</a-radio>
                                    <a-radio :value="0">否</a-radio>
                                </a-radio-group>
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="热销" name="isHot">
                                <a-radio-group v-model:value="formState.isHot">
                                    <a-radio :value="1">是</a-radio>
                                    <a-radio :value="0">否</a-radio>
                                </a-radio-group>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <div class="footer-actions">
                        <a-space>
                            <a-button @click="handleBack">取消</a-button>
                            <a-button type="primary" :loading="submitting" @click="handleSubmit">
                                保存
                            </a-button>
                        </a-space>
                    </div>
                </a-form>
            </a-spin>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import type { FormInstance, UploadFile, UploadProps } from 'ant-design-vue';
import type { UpdateProductRequest } from '#/types/product';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { PlusOutlined } from '@ant-design/icons-vue';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Empty as AEmpty,
    Form as AForm,
    Image as AImage,
    Input as AInput,
    message,
    Modal as AModal,
    Progress as AProgress,
    Radio as ARadio,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    Upload as AUpload,
} from 'ant-design-vue';

import { getProductDetailApi, updateProductApi } from '#/api/products/product';
import { uploadToOss } from '#/services/upload/oss-upload';
import { deleteFileApi } from '#/api/file';

const AFormItem = AForm.Item;
const ASelectOption = ASelect.Option;
const ATextarea = AInput.TextArea;
const ARadioGroup = ARadio.Group;

const MAX_IMAGES = 10;

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const mainUploadRef = ref<any>(null);

const loading = ref(false);
const submitting = ref(false);

const productId = computed(() => String(route.params.id ?? ''));

const categoryInfo = reactive({
    id: '' as string,
    name: '' as string,
});

const categoryDisplayText = computed(() => {
    const name = categoryInfo.name || '-';
    const id = categoryInfo.id || '-';
    return `${name}（ID: ${id}）`;
});

const formState = reactive<UpdateProductRequest>({
    name: '',
    categoryId: '',
    brandId: '',
    subtitle: '',
    description: '',
    status: 'ACTIVE',
    isNew: 0,
    isHot: 0,
    mainImage: '',
    videoUrl: '',
} as UpdateProductRequest);

const mainImageUploadProgress = ref(0);

const brandIdDisplayText = computed(() => {
    const s = String(formState.brandId ?? '').trim().toLowerCase();
    return !s || s === 'null' || s === 'undefined' ? '-' : String(formState.brandId).trim();
});

const imagesFileList = ref<UploadFile[]>([]);
const mainImageUrl = ref(''); // 主图显示URL（mainImage 优先，否则 images[0]）

const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');

type UploadProgressItem = {
    uid: string;
    name: string;
    percent: number;
    status: 'uploading' | 'done' | 'error';
};
const uploadProgressList = ref<UploadProgressItem[]>([]);

onMounted(() => {
    fetchDetail();
});

function normalizeNullableString(val: unknown) {
    const s = String(val ?? '').trim().toLowerCase();
    return !s || s === 'null' || s === 'undefined' ? '' : String(val).trim();
}

function isValidImage(file: File) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

function resolvePreviewUrl(file: UploadFile): string {
    const resp = (file.response || {}) as any;
    return (
        (file.thumbUrl as string) ||
        (resp.previewUrl as string) ||
        (file.url as string) ||
        (resp.url as string) ||
        ''
    );
}

function syncMainImagePreviewByRule(detailMainImage?: string) {
    const main = String(detailMainImage || '').trim();

    if (main) {
        // mainImage 是直接可以前端使用的 URL，无需调用签名接口
        mainImageUrl.value = main;
        return;
    }

    const first = imagesFileList.value[0];
    mainImageUrl.value = first ? resolvePreviewUrl(first) : '';
}

function removeMainImage() {
    formState.mainImage = '';
    mainImageUrl.value = '';
    syncImagesToForm();
}

function triggerMainImageUpload() {
    const input = mainUploadRef.value?.$el?.querySelector?.('input[type="file"]') as HTMLInputElement | null;
    input?.click();
}

const beforeMainImageUpload: UploadProps['beforeUpload'] = (file) => {
    const f = file as File;
    if (!isValidImage(f)) {
        message.error('仅支持 jpg/jpeg/png/webp 图片');
        return false;
    }
    
    const maxMb = 10;
    if (f.size / 1024 / 1024 > maxMb) {
        message.error(`单张图片不能超过 ${maxMb}MB`);
        return false;
    }
    
    return true;
};

const handleMainImageCustomRequest: UploadProps['customRequest'] = async (options) => {
    const rawFile = options.file as File;
    
    try {
        // 重置进度
        mainImageUploadProgress.value = 0;
        
        const uploaded = await uploadToOss({
            bizType: 'product',
            mediaType: 'image',
            file: rawFile,
            onProgress: (percent) => {
                const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
                mainImageUploadProgress.value = p;
                options.onProgress?.({ percent: p });
            },
        });
        
        const url = (uploaded as any).previewUrl || (uploaded as any).url || '';
        if (!url) {
            throw new Error('上传成功但未返回可用URL');
        }
        
        formState.mainImage = url;
        mainImageUrl.value = url;
        mainImageUploadProgress.value = 100;
        
        options.onSuccess?.(uploaded);
        message.success('主图上传成功');
        
        setTimeout(() => {
            mainImageUploadProgress.value = 0;
        }, 800);
    } catch (e: any) {
        console.error(e);
        mainImageUploadProgress.value = 0;
        message.error(e?.message || '主图上传失败');
        options.onError?.(e);
    }
};

function upsertProgress(item: UploadProgressItem) {
    const idx = uploadProgressList.value.findIndex((x) => x.uid === item.uid);
    if (idx >= 0) {
        uploadProgressList.value[idx] = item;
    } else {
        uploadProgressList.value.push(item);
    }
}
function removeProgress(uid: string, delay = 800) {
    setTimeout(() => {
        uploadProgressList.value = uploadProgressList.value.filter((x) => x.uid !== uid);
    }, delay);
}

const beforeImageUpload: UploadProps['beforeUpload'] = (file) => {
    const f = file as File;
    if (!isValidImage(f)) {
        message.error('仅支持 jpg/jpeg/png/webp 图片');
        return false;
    }

    const maxMb = 10;
    if (f.size / 1024 / 1024 > maxMb) {
        message.error(`单张图片不能超过 ${maxMb}MB`);
        return false;
    }

    if (imagesFileList.value.length >= MAX_IMAGES) {
        message.warning(`最多上传 ${MAX_IMAGES} 张图片`);
        return false;
    }

    return true;
};

const handleImageCustomRequest: UploadProps['customRequest'] = async (options) => {
    const rawFile = options.file as File;
    const progressUid = `${Date.now()}-${rawFile.name}-${Math.random().toString(36).slice(2, 8)}`;

    try {
        if (imagesFileList.value.length >= MAX_IMAGES) {
            message.warning(`最多上传 ${MAX_IMAGES} 张图片`);
            options.onError?.(new Error('exceed max count'));
            return;
        }

        upsertProgress({
            uid: progressUid,
            name: rawFile.name || 'image',
            percent: 0,
            status: 'uploading',
        });

        const uploaded = await uploadToOss({
            bizType: 'product',
            mediaType: 'image',
            file: rawFile,
            onProgress: (percent) => {
                const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
                upsertProgress({
                    uid: progressUid,
                    name: rawFile.name || 'image',
                    percent: p,
                    status: 'uploading',
                });
                options.onProgress?.({ percent: p });
            },
        });

        const next: UploadFile = {
            uid: String((uploaded as any).id || progressUid),
            name: (uploaded as any).originalName || rawFile.name || 'image',
            status: 'done',
            url: (uploaded as any).previewUrl || (uploaded as any).url || '',
            thumbUrl: (uploaded as any).previewUrl || (uploaded as any).url || '',
            response: uploaded,
        };

        imagesFileList.value = [...imagesFileList.value, next].slice(0, MAX_IMAGES);
        syncImagesToForm();

        upsertProgress({
            uid: progressUid,
            name: rawFile.name || 'image',
            percent: 100,
            status: 'done',
        });
        removeProgress(progressUid);

        options.onSuccess?.(uploaded);
        message.success('上传成功');
    } catch (e: any) {
        console.error(e);
        upsertProgress({
            uid: progressUid,
            name: rawFile.name || 'image',
            percent: 100,
            status: 'error',
        });
        removeProgress(progressUid, 1500);

        message.error(e?.message || '上传失败');
        options.onError?.(e);
    }
};

function handlePreview(file: UploadFile) {
    const src = resolvePreviewUrl(file);

    if (!src) {
        message.warning('当前图片缺少可预览地址');
        return;
    }

    previewImage.value = src;
    previewTitle.value = file.name || '图片预览';
    previewVisible.value = true;
}

async function removeImageAt(index: number) {
    const target = imagesFileList.value[index];
    if (!target) return;

    try {
        const fileId = (target.response as any)?.id;
        if (fileId) {
            await deleteFileApi({ fileId: String(fileId) });
        }
    } catch (e) {
        console.warn('delete file api skipped/failed:', e);
    }

    imagesFileList.value.splice(index, 1);
    imagesFileList.value = [...imagesFileList.value];
    syncImagesToForm();
}

function syncImagesToForm() {
    const orderedUrls = imagesFileList.value
        .map((f) => String(f.url || f.thumbUrl || '').trim())
        .filter(Boolean);

    (formState as any).images = orderedUrls;
    
    // 只在 mainImage 为空时才用图片集第一张
    if (!formState.mainImage) {
        formState.mainImage = orderedUrls[0] || '';
    }

    // 当前页面主图预览：用当前 mainImage（如果存在），否则图片集首图
    syncMainImagePreviewByRule(formState.mainImage);
}

async function fetchDetail() {
    if (!productId.value) {
        message.error('商品ID无效');
        return;
    }

    loading.value = true;
    try {
        const detail = await getProductDetailApi(productId.value);

        formState.name = detail.name || '';
        formState.categoryId = String(detail.categoryId ?? '');
        formState.brandId = normalizeNullableString(detail.brandId);
        formState.subtitle = detail.subtitle || '';
        formState.description = detail.description || '';
        formState.status = detail.status || 'ACTIVE';
        formState.isNew = detail.isNew ?? 0;
        formState.isHot = detail.isHot ?? 0;
        formState.videoUrl = detail.videoUrl || '';
        formState.mainImage = detail.mainImage ?? '';

        categoryInfo.id = String(detail.categoryId ?? '');
        categoryInfo.name = detail.categoryName || '';

        const images: string[] = Array.isArray(detail.images)
            ? (detail as any).images.filter(Boolean)
            : detail.mainImage
                ? [detail.mainImage]
                : [];

        imagesFileList.value = images.slice(0, MAX_IMAGES).map((url, idx) => ({
            uid: `init-${idx}-${url}`,
            name: `图片${idx + 1}`,
            status: 'done',
            url,
            thumbUrl: url,
            response: {
                url,
                previewUrl: url,
            },
        }));

        // 主图：mainImage 优先，否则 images 第一张
        syncMainImagePreviewByRule(String(detail.mainImage || ''));

        syncImagesToForm();
    } catch (e) {
        message.error('获取商品详情失败');
    } finally {
        loading.value = false;
    }
}

async function handleSubmit() {
    if (!productId.value) {
        message.error('商品ID无效');
        return;
    }

    try {
        await formRef.value?.validate();

        // 验证主图
        if (!mainImageUrl.value) {
            message.error('请至少为商品选择一张主图');
            return;
        }

        submitting.value = true;
        syncImagesToForm();

        const payload: UpdateProductRequest = {
            name: formState.name?.trim(),
            brandId:
                !formState.brandId ||
                String(formState.brandId).trim().toLowerCase() === 'null' ||
                String(formState.brandId).trim().toLowerCase() === 'undefined'
                    ? undefined
                    : String(formState.brandId).trim(),
            subtitle: formState.subtitle?.trim() || undefined,
            description: formState.description?.trim() || undefined,
            status: formState.status,
            isNew: formState.isNew,
            isHot: formState.isHot,
            mainImage: formState.mainImage?.trim() || undefined,
            videoUrl: formState.videoUrl?.trim() || undefined,
            ...(Array.isArray((formState as any).images)
                ? { images: (formState as any).images }
                : {}),
        } as UpdateProductRequest;

        await updateProductApi(productId.value, payload);
        message.success('保存成功');
        router.push(`/products/detail/${productId.value}`);
    } catch (e) {
        if ((e as any)?.errorFields) return;
        message.error('保存失败');
    } finally {
        submitting.value = false;
    }
}

function handleBack() {
    if (productId.value) {
        router.push(`/products/detail/${productId.value}`);
        return;
    }
    router.push('/products/list');
}
</script>

<style scoped>
.product-edit-page {
    min-height: 100%;
    padding: 16px;
    color: hsl(var(--foreground));
    background: hsl(var(--background));
}

.edit-card {
    background: hsl(var(--card));
}

.page-title {
    color: hsl(var(--foreground));
}

.main-image-box {
    min-height: 110px;
    display: flex;
    align-items: center;
}

.main-image {
    border-radius: 8px;
    overflow: hidden;
}

.images-editor {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.sortable-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.img-card {
    width: 104px;
    height: 104px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    background: #fafafa;
}

.img-card__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
}

.drag-handle {
    position: absolute;
    left: 4px;
    top: 4px;
    z-index: 2;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    border-radius: 4px;
    font-size: 12px;
    padding: 0 6px;
    line-height: 18px;
    cursor: move;
    user-select: none;
}

.img-card__actions {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 4px;
    display: flex;
    justify-content: space-between;
    gap: 4px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.upload-trigger {
    width: 104px;
    height: 104px;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.main-upload-trigger {
    width: 140px;
    height: 140px;
}

.main-image-wrapper {
    position: relative;
    display: inline-block;
}

.main-image-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 4px;
    display: flex;
    justify-content: flex-end;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.upload-trigger:hover {
    border-color: #1677ff;
    color: #1677ff;
}

.upload-trigger__hint {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
}

.upload-progress-wrap {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.upload-progress-item {
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    padding: 6px 8px;
    background: #fff;
}

.upload-progress-name {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.images-tip {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
}

.footer-actions {
    margin-top: 12px;
    text-align: right;
}
</style>
