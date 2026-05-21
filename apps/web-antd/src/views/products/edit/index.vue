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
                    <a-button type="primary" :loading="submitting" @click="handleSubmit">保存</a-button>
                </a-space>
            </template>

            <a-spin :spinning="loading">
                <a-form ref="formRef" :model="formState" layout="vertical">
                    <a-row :gutter="16">
                        <a-col :xs="24" :md="12">
                            <a-form-item label="商品名称" name="name" :rules="[{ required: true, message: '请输入商品名称' }]">
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
                            <a-form-item label="权益类型（只读）">
                                <a-input :value="benefitTypeDisplayText" readonly />
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
                                <a-textarea v-model:value="formState.description" :rows="5" placeholder="请输入商品描述" />
                            </a-form-item>
                        </a-col>

                        <!-- 主图区：移除点击图片修改，只保留按钮修改 -->
                        <a-col :xs="24">
                            <a-form-item label="主图（优先 mainImage，空时回退 images[0]）" required>
                                <div class="main-image-wrap">
                                    <div class="main-image-static">
                                        <a-image
                                            :src="mainImageThumb || fallbackImage"
                                            :preview="mainImagePreview ? { src: mainImagePreview } : false"
                                            class="main-image"
                                        />
                                    </div>

                                    <div class="main-image-actions">
                                        <a-button @click="triggerMainImageUpload">更换主图</a-button>
                                        <span class="main-image-tip">主图字段独立保存，不随图片集拖拽自动变化</span>
                                    </div>
                                </div>

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

                        <!-- 图片集 -->
                        <a-col :xs="24">
                            <a-form-item label="商品图片集（最多10张，可拖拽排序）" required>
                                <div class="images-editor">
                                    <draggable
                                        v-model="imagesFileList"
                                        item-key="uid"
                                        class="sortable-grid"
                                        :animation="200"
                                        handle=".drag-handle"
                                        @end="onDragEnd"
                                    >
                                        <template #item="{ element, index }">
                                            <div class="img-card">
                                                <div class="drag-handle" title="拖拽排序">☰</div>
                                                <div v-if="isCurrentMainImage(element)" class="main-badge">当前主图</div>

                                                <img
                                                    class="img-card__img"
                                                    :src="resolveThumbUrlStrict(element) || fallbackImage"
                                                    :alt="element.name || `图片${index + 1}`"
                                                    @click="handlePreview(element)"
                                                />

                                                <div class="img-card__actions">
                                                    <a-button size="small" @click="handlePreview(element)">预览</a-button>
                                                    <a-button size="small" @click="setAsMainImage(index)" :disabled="isCurrentMainImage(element)">
                                                        设为主图
                                                    </a-button>
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
                                            <div class="upload-trigger__hint">{{ imagesFileList.length }}/{{ MAX_IMAGES }}</div>
                                        </div>
                                    </a-upload>
                                </div>

                                <div class="images-tip">
                                    预览仅使用后端返回的签名 previewUrl/thumbUrl；若未拿到签名，将显示占位图并提示。
                                </div>

                                <a-modal :open="previewVisible" :title="previewTitle" :footer="null" @cancel="previewVisible = false" destroy-on-close>
                                    <img alt="preview" style="width: 100%" :src="previewImage || fallbackImage" />
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
                            <a-button type="primary" :loading="submitting" @click="handleSubmit">保存</a-button>
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
    Form as AForm,
    Input as AInput,
    message,
    Modal as AModal,
    Radio as ARadio,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    Upload as AUpload,
    Image as AImage,
} from 'ant-design-vue';

import { getProductDetailApi, updateProductApi } from '#/api/products/product';
import { uploadToOss } from '#/services/upload/oss-upload';
import { deleteFileApi, getFilePreviewApi } from '#/api/file';

const AFormItem = AForm.Item;
const ASelectOption = ASelect.Option;
const ATextarea = AInput.TextArea;
const ARadioGroup = ARadio.Group;

const MAX_IMAGES = 10;
const fallbackImage = 'https://dummyimage.com/240x240/f5f5f5/999999&text=Product';

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const mainUploadRef = ref<any>(null);

const loading = ref(false);
const submitting = ref(false);
const productId = computed(() => String(route.params.id ?? ''));

const categoryInfo = reactive({ id: '', name: '' });
const benefitType = ref('');

const categoryDisplayText = computed(() => `${categoryInfo.name || '-'}（ID: ${categoryInfo.id || '-'}）`);
const benefitTypeDisplayText = computed(() => {
    switch ((benefitType.value || '').toUpperCase()) {
        case 'PACKAGE': return '权益卡';
        case 'COUPON': return '优惠券';
        case 'BALANCE': return '账户余额';
        case 'MIXED': return '组合卡';
        default: return benefitType.value || '-';
    }
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

const brandIdDisplayText = computed(() => {
    const s = String(formState.brandId ?? '').trim().toLowerCase();
    return !s || s === 'null' || s === 'undefined' ? '-' : String(formState.brandId).trim();
});

type EnhancedUploadFile = UploadFile & {
    rawUrl?: string;
    fileId?: number;
    previewUrl?: string;     // 仅存后端签名 previewUrl
    thumbUrlSigned?: string; // 仅存后端签名 thumbUrl
};

const imagesFileList = ref<EnhancedUploadFile[]>([]);
const mainImageFile = ref<EnhancedUploadFile | null>(null);

const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');

const mainImagePreview = ref('');
const mainImageThumb = ref('');

// cache
const CACHE_KEY = 'file_preview_cache_v2';
type CacheItem = { previewUrl: string; thumbUrl: string; expireAt: number };
type CacheMap = Record<string, CacheItem>;
let cache: CacheMap = loadCache();
const inflight = new Map<string, Promise<CacheItem>>();

onMounted(fetchDetail);

function normalizeNullableString(val: unknown) {
    const s = String(val ?? '').trim().toLowerCase();
    return !s || s === 'null' || s === 'undefined' ? '' : String(val).trim();
}
function normalizeUrl(url?: string) {
    return String(url ?? '').trim().replace(/\s+/g, '');
}
function loadCache(): CacheMap {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as CacheMap;
        const now = Math.floor(Date.now() / 1000);
        Object.keys(parsed).forEach((k) => {
            if (!parsed[k] || parsed[k].expireAt <= now) delete parsed[k];
        });
        return parsed;
    } catch {
        return {};
    }
}
function saveCache() {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}
function parseFileIdFromUrl(url: string): number | null {
    const u = normalizeUrl(url);
    if (!u) return null;
    const mQuery = u.match(/[?&]fileId=(\d+)/i);
    if (mQuery) return Number(mQuery[1]);
    const mPath = u.match(/\/files?\/(\d+)(?:\/|$|\?)/i);
    if (mPath) return Number(mPath[1]);
    const mTail = u.match(/\/(\d+)(?:\?.*)?$/);
    if (mTail) return Number(mTail[1]);
    return null;
}
function isValidImage(file: File) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}
function pickUploadedFileId(uploaded: any): number | undefined {
    const id =
        uploaded?.id ??
        uploaded?.fileId ??
        uploaded?.data?.id ??
        uploaded?.data?.fileId ??
        uploaded?.result?.id ??
        uploaded?.result?.fileId;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : undefined;
}
function pickUploadedUrl(uploaded: any): string {
    return String(uploaded?.url ?? uploaded?.data?.url ?? uploaded?.result?.url ?? '').trim();
}

async function getSignedPair(fileId: number, w: number, h: number): Promise<CacheItem> {
    const key = `${fileId}_${w}x${h}`;
    const now = Math.floor(Date.now() / 1000);
    const c = cache[key];
    if (c && c.expireAt > now + 30) return c;

    const running = inflight.get(key);
    if (running) return running;

    const p = (async () => {
        const res = await getFilePreviewApi(fileId, w, h);
        const item: CacheItem = {
            previewUrl: String((res as any)?.previewUrl || ''),
            thumbUrl: String((res as any)?.thumbUrl || ''),
            expireAt: Number((res as any)?.expireAt || now + 600),
        };
        cache[key] = item;
        saveCache();
        return item;
    })().finally(() => inflight.delete(key));

    inflight.set(key, p);
    return p;
}

async function enrichImageSigned(file: EnhancedUploadFile, w = 120, h = 120): Promise<boolean> {
    const fileId = file.fileId ?? parseFileIdFromUrl(String(file.rawUrl || file.url || ''));
    if (!fileId) {
        file.previewUrl = '';
        file.thumbUrlSigned = '';
        return false;
    }

    try {
        const pair = await getSignedPair(fileId, w, h);
        file.previewUrl = pair.previewUrl || '';
        file.thumbUrlSigned = pair.thumbUrl || '';
        return !!(file.previewUrl || file.thumbUrlSigned);
    } catch {
        file.previewUrl = '';
        file.thumbUrlSigned = '';
        return false;
    }
}

/** 严格：只返回签名图，不回退裸链 */
function resolveThumbUrlStrict(file: EnhancedUploadFile): string {
    const resp = (file.response || {}) as any;
    return String(file.thumbUrlSigned || resp.thumbUrl || '').trim();
}
/** 严格：只返回签名图，不回退裸链 */
function resolvePreviewUrlStrict(file: EnhancedUploadFile): string {
    const resp = (file.response || {}) as any;
    return String(file.previewUrl || resp.previewUrl || '').trim();
}

function triggerMainImageUpload() {
    const input = mainUploadRef.value?.$el?.querySelector?.('input[type="file"]') as HTMLInputElement | null;
    input?.click();
}

async function refreshMainImageView() {
    const source = mainImageFile.value;
    if (!source) {
        mainImagePreview.value = '';
        mainImageThumb.value = '';
        formState.mainImage = '';
        return;
    }
    mainImagePreview.value = resolvePreviewUrlStrict(source);
    mainImageThumb.value = resolveThumbUrlStrict(source);
    formState.mainImage = String(source.rawUrl || source.url || '').trim();
}

function isCurrentMainImage(file: EnhancedUploadFile) {
    const mainRaw = String(mainImageFile.value?.rawUrl || mainImageFile.value?.url || '').trim();
    const curRaw = String(file.rawUrl || file.url || '').trim();
    return !!mainRaw && mainRaw === curRaw;
}

const beforeImageUpload: UploadProps['beforeUpload'] = (file) => {
    const f = file as File;
    if (!isValidImage(f)) return message.error('仅支持 jpg/jpeg/png/webp 图片'), false;
    if (f.size / 1024 / 1024 > 10) return message.error('单张图片不能超过 10MB'), false;
    if (imagesFileList.value.length >= MAX_IMAGES) return message.warning(`最多上传 ${MAX_IMAGES} 张图片`), false;
    return true;
};
const beforeMainImageUpload: UploadProps['beforeUpload'] = (file) => {
    const f = file as File;
    if (!isValidImage(f)) return message.error('仅支持 jpg/jpeg/png/webp 图片'), false;
    if (f.size / 1024 / 1024 > 10) return message.error('单张图片不能超过 10MB'), false;
    return true;
};

const handleImageCustomRequest: UploadProps['customRequest'] = async (options) => {
    try {
        if (imagesFileList.value.length >= MAX_IMAGES) {
            options.onError?.(new Error('exceed max count'));
            message.warning(`最多上传 ${MAX_IMAGES} 张图片`);
            return;
        }

        const rawFile = options.file as File;
        const uploaded = await uploadToOss({
            bizType: 'product',
            mediaType: 'image',
            file: rawFile,
            onProgress: (percent) => options.onProgress?.({ percent }),
        });

        const fileId = pickUploadedFileId(uploaded);
        const url = pickUploadedUrl(uploaded);
        if (!url) throw new Error('上传成功但未返回可用URL');

        const next: EnhancedUploadFile = {
            uid: String(fileId || Date.now()),
            name: (uploaded as any)?.originalName || rawFile.name || 'image',
            status: 'done',
            url,
            rawUrl: url,
            fileId,
            response: uploaded,
        };

        const ok = await enrichImageSigned(next, 120, 120);

        const nextRaw = String(next.rawUrl || '').trim();
        const exists = imagesFileList.value.some((x) => String(x.rawUrl || x.url || '').trim() === nextRaw);
        if (!exists) imagesFileList.value = [...imagesFileList.value, next].slice(0, MAX_IMAGES);

        if (!mainImageFile.value && imagesFileList.value.length > 0) {
            mainImageFile.value = imagesFileList.value[0];
            await refreshMainImageView();
        }

        syncImagesToForm();
        options.onSuccess?.(uploaded);

        if (!ok) {
            message.warning('上传成功，但未拿到签名预览URL（previewUrl/thumbUrl）');
        } else {
            message.success('上传成功');
        }
    } catch (e: any) {
        message.error(e?.message || '上传失败');
        options.onError?.(e);
    }
};

const handleMainImageCustomRequest: UploadProps['customRequest'] = async (options) => {
    try {
        const rawFile = options.file as File;
        const uploaded = await uploadToOss({
            bizType: 'product',
            mediaType: 'image',
            file: rawFile,
            onProgress: (percent) => options.onProgress?.({ percent }),
        });

        const fileId = pickUploadedFileId(uploaded);
        const url = pickUploadedUrl(uploaded);
        if (!url) throw new Error('主图上传成功但未返回可用URL');

        const next: EnhancedUploadFile = {
            uid: `main-${fileId || Date.now()}`,
            name: (uploaded as any)?.originalName || rawFile.name || 'main-image',
            status: 'done',
            url,
            rawUrl: url,
            fileId,
            response: uploaded,
        };

        const ok = await enrichImageSigned(next, 600, 600);
        mainImageFile.value = next;
        await refreshMainImageView();

        const raw = String(next.rawUrl || '').trim();
        const exists = imagesFileList.value.some((x) => String(x.rawUrl || x.url || '').trim() === raw);
        if (!exists && imagesFileList.value.length < MAX_IMAGES) {
            const listItem: EnhancedUploadFile = { ...next, uid: `img-${next.uid}` };
            await enrichImageSigned(listItem, 120, 120);
            imagesFileList.value = [...imagesFileList.value, listItem];
        }

        syncImagesToForm();
        options.onSuccess?.(uploaded);

        if (!ok) {
            message.warning('主图上传成功，但未拿到签名预览URL');
        } else {
            message.success('主图上传成功');
        }
    } catch (e: any) {
        message.error(e?.message || '主图上传失败');
        options.onError?.(e);
    }
};

function setAsMainImage(index: number) {
    const target = imagesFileList.value[index];
    if (!target) return;
    mainImageFile.value = target;
    refreshMainImageView();
    syncImagesToForm();
    message.success('已设为主图');
}

function onDragEnd() {
    syncImagesToForm();
    if (!mainImageFile.value && imagesFileList.value.length > 0) {
        mainImageFile.value = imagesFileList.value[0];
        refreshMainImageView();
    }
}

function handlePreview(file: EnhancedUploadFile) {
    const src = resolvePreviewUrlStrict(file);
    if (!src) {
        message.warning('该图片未获取到签名预览URL');
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
        const fileId = target.fileId || Number((target.response as any)?.id || 0) || undefined;
        if (fileId) await deleteFileApi({ fileId: String(fileId) });
    } catch (e) {
        console.warn('delete file api skipped/failed:', e);
    }

    const removedRaw = String(target.rawUrl || target.url || '').trim();
    imagesFileList.value.splice(index, 1);
    imagesFileList.value = [...imagesFileList.value];

    const mainRaw = String(mainImageFile.value?.rawUrl || mainImageFile.value?.url || '').trim();
    if (mainRaw && removedRaw === mainRaw) {
        mainImageFile.value = imagesFileList.value[0] || null;
        await refreshMainImageView();
    }

    syncImagesToForm();
}

function syncImagesToForm() {
    const orderedUrls = imagesFileList.value.map((f) => String(f.rawUrl || f.url || '').trim()).filter(Boolean);
    (formState as any).images = orderedUrls;
    formState.mainImage = String(mainImageFile.value?.rawUrl || mainImageFile.value?.url || '').trim();
}

async function fetchDetail() {
    if (!productId.value) return message.error('商品ID无效');

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
        benefitType.value = String((detail as any).benefitType || '');

        categoryInfo.id = String(detail.categoryId ?? '');
        categoryInfo.name = detail.categoryName || '';

        const images: string[] = Array.isArray((detail as any).images) ? (detail as any).images.filter(Boolean) : [];
        imagesFileList.value = images.slice(0, MAX_IMAGES).map((url, idx) => ({
            uid: `init-${idx}-${url}`,
            name: `图片${idx + 1}`,
            status: 'done',
            url,
            rawUrl: url,
            fileId: parseFileIdFromUrl(url) || undefined,
            response: { url },
        }));

        await Promise.all(imagesFileList.value.map((f) => enrichImageSigned(f, 120, 120)));
        imagesFileList.value = [...imagesFileList.value];

        const mainRaw = normalizeUrl((detail as any).mainImage);
        if (mainRaw) {
            const mainFile: EnhancedUploadFile = {
                uid: `main-init-${mainRaw}`,
                name: '主图',
                status: 'done',
                url: mainRaw,
                rawUrl: mainRaw,
                fileId: parseFileIdFromUrl(mainRaw) || undefined,
                response: { url: mainRaw },
            };
            await enrichImageSigned(mainFile, 600, 600);
            mainImageFile.value = mainFile;
        } else {
            mainImageFile.value = imagesFileList.value[0] || null;
        }

        syncImagesToForm();
        await refreshMainImageView();
    } catch {
        message.error('获取商品详情失败');
    } finally {
        loading.value = false;
    }
}

async function handleSubmit() {
    if (!productId.value) return message.error('商品ID无效');

    try {
        await formRef.value?.validate();

        if (!imagesFileList.value.length && !mainImageFile.value) {
            message.warning('请至少上传1张商品图片');
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
            ...(Array.isArray((formState as any).images) ? { images: (formState as any).images } : {}),
        } as UpdateProductRequest;

        await updateProductApi(productId.value, payload);
        message.success('保存成功');
        router.push(`/products/detail/${productId.value}`);
    } catch (e: any) {
        if (e?.errorFields) return;
        message.error('保存失败');
    } finally {
        submitting.value = false;
    }
}

function handleBack() {
    if (productId.value) return router.push(`/products/detail/${productId.value}`);
    router.push('/products/list');
}
</script>

<style scoped>
.product-edit-page { min-height: 100%; padding: 16px; color: hsl(var(--foreground)); background: hsl(var(--background)); }
.edit-card { background: hsl(var(--card)); }
.page-title { color: hsl(var(--foreground)); }

.main-image-wrap { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.main-image-static { position: relative; width: 180px; }
.main-image { border-radius: 8px; }
.main-image-mask {
    position: absolute; left: 0; right: 0; bottom: 0;
    font-size: 12px; text-align: center; color: #fff;
    background: linear-gradient(to top, rgba(0,0,0,.55), transparent);
    padding: 6px 0;
    border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;
}
.main-image-actions { display: flex; flex-direction: column; gap: 8px; }
.main-image-tip { font-size: 12px; color: #999; }

.images-editor { display: flex; flex-wrap: wrap; gap: 8px; }
.sortable-grid { display: flex; flex-wrap: wrap; gap: 8px; }

.img-card { width: 104px; height: 104px; border: 1px solid #d9d9d9; border-radius: 8px; position: relative; overflow: hidden; background: #fafafa; }
.img-card__img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
.drag-handle { position: absolute; left: 4px; top: 4px; z-index: 3; background: rgba(0,0,0,.45); color: #fff; border-radius: 4px; font-size: 12px; padding: 0 6px; line-height: 18px; cursor: move; user-select: none; }
.main-badge { position: absolute; right: 4px; top: 4px; z-index: 3; background: #1677ff; color: #fff; border-radius: 4px; font-size: 12px; padding: 0 6px; line-height: 18px; }
.img-card__actions { position: absolute; left: 0; right: 0; bottom: 0; padding: 4px; display: flex; justify-content: space-between; gap: 4px; background: linear-gradient(to top, rgba(0,0,0,.6), transparent); }

.upload-trigger { width: 104px; height: 104px; border: 1px dashed #d9d9d9; border-radius: 8px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
.upload-trigger:hover { border-color: #1677ff; color: #1677ff; }
.upload-trigger__hint { margin-top: 4px; font-size: 12px; color: #999; }

.images-tip { margin-top: 8px; color: #999; font-size: 12px; }
.footer-actions { margin-top: 12px; text-align: right; }
</style>
