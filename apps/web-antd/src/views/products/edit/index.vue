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
    // 若你的类型里有 images 字段，这里会在 submit 时动态挂载
} as UpdateProductRequest);

const brandIdDisplayText = computed(() => {
    const s = String(formState.brandId ?? '').trim().toLowerCase();
    return !s || s === 'null' || s === 'undefined' ? '-' : String(formState.brandId).trim();
});

const imagesFileList = ref<UploadFile[]>([]);

const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');

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
    try {
        if (imagesFileList.value.length >= MAX_IMAGES) {
            message.warning(`最多上传 ${MAX_IMAGES} 张图片`);
            options.onError?.(new Error('exceed max count'));
            return;
        }

        const rawFile = options.file as File;
        const uploaded = await uploadToOss({
            bizType: 'product',
            mediaType: 'image',
            file: rawFile,
            onProgress: (percent) => options.onProgress?.({ percent }),
        });

        console.log('uploaded', uploaded);

        const next: UploadFile = {
            uid: String(uploaded.id),
            name: uploaded.originalName || rawFile.name || 'image',
            status: 'done',
            url: uploaded.previewUrl, // 原图地址
            thumbUrl: uploaded.previewUrl, // 优先可预览地址
            response: uploaded, // 保留原始返回
        };


        imagesFileList.value = [...imagesFileList.value, next].slice(0, MAX_IMAGES);
        syncImagesToForm();
        options.onSuccess?.(uploaded);
        message.success('上传成功');
    } catch (e: any) {
        console.error(e);
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
        // 老图通常没有 fileId，删除云端失败不阻塞前端移除
        console.warn('delete file api skipped/failed:', e);
    }

    imagesFileList.value.splice(index, 1);
    syncImagesToForm();
}

function syncImagesToForm() {
    const orderedUrls = imagesFileList.value
        .map((f) => String(f.url || f.thumbUrl || '').trim())
        .filter(Boolean);

    // 约定：第一张作为 mainImage
    formState.mainImage = orderedUrls[0] || '';

    // 如果 UpdateProductRequest 有 images 字段，动态写入
    (formState as any).images = orderedUrls;
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

        categoryInfo.id = String(detail.categoryId ?? '');
        categoryInfo.name = detail.categoryName || '';

        // 兼容两种后端返回：images[] 或只有 mainImage
        const images: string[] = Array.isArray((detail as any).images)
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

        if (!imagesFileList.value.length) {
            message.warning('请至少上传1张商品图片');
            return;
        }

        submitting.value = true;
        syncImagesToForm();

        const payload: UpdateProductRequest = {
            name: formState.name?.trim(),
            // 品牌ID只读，按你现逻辑做空值屏蔽
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
            // 若后端支持 images 数组，会一并提交
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

.upload-trigger:hover {
    border-color: #1677ff;
    color: #1677ff;
}

.upload-trigger__hint {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
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
