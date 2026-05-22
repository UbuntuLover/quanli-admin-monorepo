<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { UploadFile } from 'ant-design-vue';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    InputNumber as AInputNumber,
    Modal as AModal,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Switch as ASwitch,
    message,
} from 'ant-design-vue';

import MediaUpload from '#/components/upload/media-upload.vue';

import { createProductApi } from '#/api/products/product';
import { getLeafCategoriesApi } from '#/api/products/productCategory';
import { getAllProductBrandsApi, type ProductBrandDTO } from '#/api/products/productBrand';
import type { CategoryDTO } from '#/types/category';

type CreateProductSkuRequest = {
    skuCode?: string;
    name?: string;
    price: number;
    originalPrice?: number | null;
    stock: number;
    image?: string | null;
    attributes?: Record<string, string>;
};

type CreateProductRequest = {
    name: string;
    categoryId: string | number;
    brandId?: string | number | null;
    subtitle?: string | null;
    description?: string | null;
    isNew?: number;
    isHot?: number;
    mainImage?: string | null;
    videoUrl?: string | null;
    productType?: 'PHYSICAL';
    deliveryMode?: null;
    benefitType?: null;
    images?: string[] | null;
    skus: CreateProductSkuRequest[];
};

type BrandOption = {
    label: string;
    value: string;
};

interface MediaItem {
    fileId: number;
    mediaType: 'image' | 'video';
    url: string;
    previewUrl: string;
    originalName: string;
    size: number;
    mimeType?: string;
    objectKey: string;
    coverUrl?: string;
    sort?: number;
}

const submitting = ref(false);
const categoryLoading = ref(false);
const brandLoading = ref(false);

const form = reactive({
    name: '',
    categoryId: '',
    brandId: undefined as string | undefined,
    subtitle: '',
    description: '',
    isNew: false,
    isHot: false,
    mainImage: '',
    videoUrl: '',
    images: [] as string[],
});

// 使用 MediaUpload 组件的数据
const mainImageData = ref<MediaItem | null>(null);
const galleryImagesData = ref<MediaItem[]>([]);
const videoData = ref<MediaItem | null>(null);

const leafCategoryOptions = ref<Array<{ label: string; value: string }>>([]);
const brandOptions = ref<BrandOption[]>([]);

// 从 MediaItem 提取预览 URL
const mainImageUrl = computed(() => mainImageData.value?.previewUrl || '');
const videoPreviewUrl = computed(() => videoData.value?.previewUrl || '');
const galleryUrls = computed(() => galleryImagesData.value.map(item => item.previewUrl));

const skus = ref<
    Array<{
        id: string;
        name: string;
        skuCode: string;
        priceYuan: number;
        originalPriceYuan: number | null;
        stock: number;
        image: string;
        attrsText: string;
    }>
>([
    {
        id: cryptoRandomId(),
        name: '默认规格',
        skuCode: '',
        priceYuan: 0,
        originalPriceYuan: null,
        stock: 0,
        image: '',
        attrsText: '',
    },
]);

function cryptoRandomId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function yuanToFen(v: number) {
    return Math.round((Number(v) || 0) * 100);
}

function parseAttrs(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    const parts = (text || '')
        .split(';')
        .map((x) => x.trim())
        .filter(Boolean);

    for (const p of parts) {
        const idx = p.indexOf(':');
        if (idx <= 0) continue;
        const k = p.slice(0, idx).trim();
        const v = p.slice(idx + 1).trim();
        if (k) result[k] = v;
    }
    return result;
}

// 主图变化处理
function handleMainImageChange(value: MediaItem | null) {
    mainImageData.value = value;
    form.mainImage = value?.previewUrl || '';
}

// 轮播图变化处理
function handleGalleryChange(value: MediaItem[]) {
    galleryImagesData.value = value;
    form.images = value.map(item => item.previewUrl);
}

// 视频变化处理
function handleVideoChange(value: MediaItem | null) {
    videoData.value = value;
    form.videoUrl = value?.previewUrl || '';
}

async function loadLeafCategories() {
    try {
        categoryLoading.value = true;
        const list = (await getLeafCategoriesApi()) as CategoryDTO[];
        leafCategoryOptions.value = (list || []).map((c) => ({
            label: `${c.name} [L${c.level}]`,
            value: String(c.id),
        }));
    } catch (e: any) {
        message.error(e?.message || '加载三级分类失败');
    } finally {
        categoryLoading.value = false;
    }
}

async function loadBrandOptions() {
    try {
        brandLoading.value = true;
        const list = (await getAllProductBrandsApi()) as ProductBrandDTO[];
        brandOptions.value = (list || []).map((b) => ({
            label: b.name,
            value: String(b.id),
        }));
    } catch (e: any) {
        message.error(e?.message || '加载品牌失败');
    } finally {
        brandLoading.value = false;
    }
}

function addSku() {
    skus.value.push({
        id: cryptoRandomId(),
        name: '',
        skuCode: '',
        priceYuan: 0,
        originalPriceYuan: null,
        stock: 0,
        image: '',
        attrsText: '',
    });
}

function removeSku(id: string) {
    if (skus.value.length <= 1) {
        message.warning('至少保留一个 SKU');
        return;
    }
    skus.value = skus.value.filter((x) => x.id !== id);
}

async function submit() {
    try {
        if (!form.name.trim()) throw new Error('请输入商品名称');
        if (!form.categoryId) throw new Error('请选择第三级分类');
        if (!form.brandId) throw new Error('请选择品牌');
        if (!skus.value.length) throw new Error('请至少添加一个 SKU');
        if (!form.mainImage) throw new Error('请上传主图');

        const normalizedSkus: CreateProductSkuRequest[] = skus.value.map((s, idx) => {
            if ((s.priceYuan ?? 0) <= 0) throw new Error(`第 ${idx + 1} 个SKU价格必须大于0`);
            if ((s.stock ?? 0) < 0) throw new Error(`第 ${idx + 1} 个SKU库存不能小于0`);

            return {
                skuCode: s.skuCode || undefined,
                name: s.name || undefined,
                price: yuanToFen(s.priceYuan),
                originalPrice:
                    s.originalPriceYuan === null || s.originalPriceYuan === undefined
                        ? null
                        : yuanToFen(s.originalPriceYuan),
                stock: Number(s.stock || 0),
                image: s.image || null,
                attributes: parseAttrs(s.attrsText),
            };
        });

        const payload: CreateProductRequest = {
            name: form.name.trim(),
            categoryId: form.categoryId,
            brandId: form.brandId || null,
            subtitle: form.subtitle || null,
            description: form.description || null,
            isNew: form.isNew ? 1 : 0,
            isHot: form.isHot ? 1 : 0,
            mainImage: form.mainImage || null,
            videoUrl: form.videoUrl || null,
            productType: 'PHYSICAL',
            deliveryMode: null,
            benefitType: null,
            images: form.images?.length ? form.images : null,
            skus: normalizedSkus,
        };

        submitting.value = true;
        const created = await createProductApi(payload as any);
        message.success(`创建成功：${created?.name || form.name}`);
        AModal.success({
            title: '创建成功',
            content: `商品「${created?.name || form.name}」已创建`,
        });
    } catch (e: any) {
        message.error(e?.message || '创建失败');
    } finally {
        submitting.value = false;
    }
}

onMounted(async () => {
    await Promise.all([loadLeafCategories(), loadBrandOptions()]);
});
</script>

<template>
    <div style="padding: 16px">
        <a-card title="创建商品（实体商品）" :bordered="false">
            <a-form layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="商品名称" required>
                            <a-input v-model:value="form.name" :maxlength="100" placeholder="请输入商品名称" />
                        </a-form-item>
                    </a-col>

                    <a-col :span="6">
                        <a-form-item label="第三级分类" required>
                            <a-select
                                v-model:value="form.categoryId"
                                :options="leafCategoryOptions"
                                :loading="categoryLoading"
                                show-search
                                option-filter-prop="label"
                                placeholder="请选择第三级分类"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :span="6">
                        <a-form-item label="品牌" required>
                            <a-select
                                v-model:value="form.brandId"
                                :options="brandOptions"
                                :loading="brandLoading"
                                show-search
                                option-filter-prop="label"
                                placeholder="请选择品牌"
                            />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="副标题">
                            <a-input v-model:value="form.subtitle" :maxlength="120" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="3">
                        <a-form-item label="新品">
                            <a-switch v-model:checked="form.isNew" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="3">
                        <a-form-item label="热销">
                            <a-switch v-model:checked="form.isHot" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="商品类型">
                            <a-input value="实体商品（PHYSICAL）" disabled />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="商品描述">
                    <a-input-textarea v-model:value="form.description" :rows="4" :maxlength="2000" />
                </a-form-item>

                <a-row :gutter="16">
                    <a-col :span="8" class="upload-column">
                        <a-form-item label="主图" required>
                            <div class="upload-section upload-section--main">
                                <MediaUpload
                                    v-model="mainImageData"
                                    :biz-type="'product'"
                                    :multiple="false"
                                    :max-count="1"
                                    :accept-config="{ image: true, video: false }"
                                    @change="handleMainImageChange"
                                />
                            </div>
                        </a-form-item>
                    </a-col>

                    <a-col :span="8" class="upload-column">
                        <a-form-item label="轮播图/商品图">
                            <div class="upload-section upload-section--gallery">
                                <MediaUpload
                                    v-model="galleryImagesData"
                                    :biz-type="'product'"
                                    :multiple="true"
                                    :max-count="20"
                                    :accept-config="{ image: true, video: false }"
                                    @change="handleGalleryChange"
                                />
                            </div>
                        </a-form-item>
                    </a-col>

                    <a-col :span="8" class="upload-column">
                        <a-form-item label="商品视频">
                            <div class="upload-section upload-section--video">
                                <MediaUpload
                                    v-model="videoData"
                                    :biz-type="'product'"
                                    :multiple="false"
                                    :max-count="1"
                                    :accept-config="{ image: false, video: true }"
                                    @change="handleVideoChange"
                                />
                            </div>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-divider>SKU 列表（至少一个）</a-divider>

                <div
                    v-for="(sku, idx) in skus"
                    :key="sku.id"
                    style="margin-bottom: 16px; padding: 12px; border: 1px solid #f0f0f0; border-radius: 8px"
                >
                    <a-row :gutter="12">
                        <a-col :span="6">
                            <a-form-item :label="`SKU名称 #${idx + 1}`">
                                <a-input v-model:value="sku.name" placeholder="如：黑色L码" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="4">
                            <a-form-item label="SKU编码">
                                <a-input v-model:value="sku.skuCode" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="4">
                            <a-form-item label="价格(元)" required>
                                <a-input-number v-model:value="sku.priceYuan" :min="0" :precision="2" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="4">
                            <a-form-item label="原价(元)">
                                <a-input-number
                                    v-model:value="sku.originalPriceYuan"
                                    :min="0"
                                    :precision="2"
                                    style="width: 100%"
                                />
                            </a-form-item>
                        </a-col>
                        <a-col :span="3">
                            <a-form-item label="库存">
                                <a-input-number v-model:value="sku.stock" :min="0" :precision="0" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="3" style="display: flex; align-items: center; justify-content: flex-end">
                            <a-button danger @click="removeSku(sku.id)">删除SKU</a-button>
                        </a-col>
                    </a-row>

                    <a-row :gutter="12">
                        <a-col :span="12">
                            <a-form-item label="属性（格式：颜色:黑;尺码:L）">
                                <a-input v-model:value="sku.attrsText" placeholder="颜色:黑;尺码:L" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="12">
                            <a-form-item label="SKU图片URL（可选）">
                                <a-input v-model:value="sku.image" placeholder="可填上传后的图片链接" />
                            </a-form-item>
                        </a-col>
                    </a-row>
                </div>

                <a-space>
                    <a-button @click="addSku">新增SKU</a-button>
                    <a-button type="primary" :loading="submitting" @click="submit">创建商品</a-button>
                </a-space>
            </a-form>
        </a-card>
    </div>
</template>

<style scoped>
.upload-section {
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-container);
    min-height: 150px;
    display: flex;
    align-items: flex-start;
    box-sizing: border-box;
}

.upload-section--main {
    border-left: 3px solid #1890ff;
}

.upload-section--gallery {
    border-left: 3px solid #52c41a;
}

.upload-section--video {
    border-left: 3px solid #faad14;
}

/* 列之间的分隔线 */
.upload-column {
    position: relative;
}

.upload-column:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 10%;
    bottom: 10%;
    width: 2px;
    background: var(--color-border);
}
</style>
