<template>
    <div class="product-detail-page">
        <a-card :bordered="false" class="detail-card">
            <template #title>
                <div class="page-title">
                    <a-space>
                        <a-button @click="handleBack">返回</a-button>
                        <span>商品详情</span>
                        <a-tag :color="getStatusColor(viewProduct?.status)">
                            {{ getStatusText(viewProduct?.status) }}
                        </a-tag>
                    </a-space>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="handleRefresh" :loading="loading">刷新</a-button>
                    <a-button type="primary" @click="handleEdit" :disabled="!viewProduct?.id">
                        编辑商品
                    </a-button>
                </a-space>
            </template>

            <a-spin :spinning="loading">
                <a-empty v-if="!viewProduct" description="暂无商品数据" />
                <template v-else>
                    <a-card size="small" title="基础信息" class="section-card">
                        <a-row :gutter="16">
                            <a-col :xs="24" :md="8">
                                <div class="cover-box">
                                    <a-image
                                        :src="mainImageThumb || fallbackImage"
                                        :preview="mainImagePreview ? { src: mainImagePreview } : false"
                                        class="main-image"
                                    />
                                </div>
                            </a-col>

                            <a-col :xs="24" :md="16">
                                <a-descriptions bordered :column="2" size="small">
                                    <a-descriptions-item label="商品ID">{{ viewProduct.id }}</a-descriptions-item>
                                    <a-descriptions-item label="商品编号">{{ viewProduct.productNo || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="商品名称">{{ viewProduct.name || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="副标题">{{ viewProduct.subtitle || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="分类">{{ viewProduct.categoryName || viewProduct.categoryId || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="品牌">{{ viewProduct.brandName || viewProduct.brandId || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="商品类型">{{ getProductTypeText(viewProduct.productType) }}</a-descriptions-item>
                                    <a-descriptions-item label="权益类型">{{ viewProduct.benefitType || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="履约方式">{{ translateDeliveryMode(viewProduct.deliveryMode) || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="销量">{{ viewProduct.sales ?? 0 }}</a-descriptions-item>
                                    <a-descriptions-item label="标签" :span="2">
                                        <a-space>
                                            <a-tag v-if="viewProduct.isNew === 1" color="blue">新品</a-tag>
                                            <a-tag v-if="viewProduct.isHot === 1" color="orange">热销</a-tag>
                                            <span v-if="viewProduct.isNew !== 1 && viewProduct.isHot !== 1" class="muted">-</span>
                                        </a-space>
                                    </a-descriptions-item>
                                    <a-descriptions-item label="创建时间" :span="2">{{ formatDateTime(viewProduct.createdAt) }}</a-descriptions-item>
                                </a-descriptions>
                            </a-col>
                        </a-row>
                    </a-card>

                    <a-card size="small" title="商品描述" class="section-card">
                        <div class="description-text">{{ viewProduct.description || '暂无描述' }}</div>
                    </a-card>

                    <a-card size="small" title="商品图片" class="section-card">
                        <a-empty v-if="visibleImages.length === 0" description="暂无图片" />
                        <AImagePreviewGroup v-else>
                            <a-space wrap>
                                <a-image
                                    v-for="(img, idx) in visibleImages"
                                    :key="`${img.preview}-${idx}`"
                                    :src="img.thumb || img.preview"
                                    :preview="{ src: img.preview }"
                                    :width="96"
                                    :height="96"
                                    class="thumb"
                                />
                            </a-space>
                        </AImagePreviewGroup>
                        <div v-if="signedImages.length > visibleImageCount" class="load-more-wrap">
                            <a-button size="small" @click="loadMoreImages">加载更多图片</a-button>
                        </div>
                    </a-card>

                    <a-card size="small" title="SKU 列表" class="section-card">
                        <a-table
                            row-key="id"
                            :columns="skuColumns"
                            :data-source="viewProduct.skus || []"
                            :pagination="false"
                            :scroll="{ x: 980 }"
                            size="small"
                        >
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.key === 'price'">
                                    <span class="price">¥{{ formatMoney(record.price) }}</span>
                                    <span v-if="record.originalPrice && record.originalPrice > record.price" class="original-price">
                    ¥{{ formatMoney(record.originalPrice) }}
                  </span>
                                </template>

                                <template v-else-if="column.key === 'attributes'">
                                    <a-space wrap>
                                        <a-tag v-for="(val, key) in record.attributes" :key="`${record.id}-${key}`">
                                            {{ key }}: {{ val }}
                                        </a-tag>
                                        <span v-if="!record.attributes || Object.keys(record.attributes).length === 0" class="muted">-</span>
                                    </a-space>
                                </template>

                                <template v-else-if="column.key === 'status'">
                                    <a-tag :color="record.status === 'ACTIVE' ? 'green' : 'default'">
                                        {{ record.status === 'ACTIVE' ? '启用' : '停用' }}
                                    </a-tag>
                                </template>

                                <template v-else-if="column.key === 'image'">
                                    <a-image
                                        v-if="getSkuThumb(record.id)"
                                        :src="getSkuThumb(record.id)"
                                        :preview="{ src: getSkuPreview(record.id) }"
                                        :width="40"
                                        :height="40"
                                    />
                                    <span v-else class="muted">-</span>
                                </template>
                            </template>
                        </a-table>
                    </a-card>
                </template>
            </a-spin>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Descriptions as ADescriptions,
    Empty as AEmpty,
    Image as AImage,
    message,
    Row as ARow,
    Space as ASpace,
    Spin as ASpin,
    Table as ATable,
    Tag as ATag,
} from 'ant-design-vue';

import {getProductDetailApi} from '#/api/products/product';
import {batchGetFilePreviewApi, getFilePreviewApi} from '#/api/file';
import type {ProductDTO} from '#/types/product';

const ADescriptionsItem = ADescriptions.Item;
const AImagePreviewGroup = AImage.PreviewGroup;

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const viewProduct = ref<ProductDTO | null>(null);
const fallbackImage = 'https://dummyimage.com/240x240/f5f5f5/999999&text=Product';
const productId = computed(() => String(route.params.id ?? ''));

const visibleImageCount = ref(8);
const signedImages = ref<Array<{ preview: string; thumb: string }>>([]);
const mainImagePreview = ref('');
const mainImageThumb = ref('');
const skuImageMap = ref<Record<string, { preview: string; thumb: string }>>({});
const lastRefreshAt = ref(0);

// fileId -> previewUrl 映射（统一存储所有图片的预览URL）
const filePreviewMap = ref<Map<number, string>>(new Map());

const visibleImages = computed(() => signedImages.value.slice(0, visibleImageCount.value));

const skuColumns = [
    { title: 'SKU ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: 'SKU 编号', dataIndex: 'skuNo', key: 'skuNo', width: 180 },
    { title: 'SKU 名称', dataIndex: 'skuName', key: 'skuName', width: 180 },
    { title: '图片', key: 'image', width: 80 },
    { title: '价格', key: 'price', width: 150 },
    { title: '库存', dataIndex: 'stock', key: 'stock', width: 90 },
    { title: '销量', dataIndex: 'sales', key: 'sales', width: 90 },
    { title: '属性', key: 'attributes', width: 260 },
    { title: '状态', key: 'status', width: 100 },
];

// session缓存：按 fileId + 尺寸
const CACHE_KEY = 'file_preview_cache_v2';
type CacheItem = { previewUrl: string; thumbUrl: string; expireAt: number };
type CacheMap = Record<string, CacheItem>;
let cache: CacheMap = loadCache();

// 并发去重
const inflight = new Map<string, Promise<CacheItem>>();

onMounted(fetchDetail);

// 批量加载文件预览 URL（使用批量接口）
async function batchLoadFilePreviews(fileIds: number[]) {
    if (fileIds.length === 0) return;
    
    filePreviewMap.value.clear();
    
    try {
        const previewResults = await batchGetFilePreviewApi({ fileIds: fileIds.map(String) });
        for (const item of previewResults) {
            filePreviewMap.value.set(item.fileId, item.previewUrl);
        }
    } catch (e) {
        console.error('批量获取文件预览失败:', e);
    }
}

// 根据 fileId 获取预览 URL
function getPreviewUrl(fileId?: number): string {
    if (!fileId || fileId <= 0) return '';
    return filePreviewMap.value.get(fileId) || '';
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
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // ignore
    }
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

async function getSignedPair(fileId: number, w: number, h: number): Promise<CacheItem> {
    const key = `${fileId}_${w}x${h}`;
    const now = Math.floor(Date.now() / 1000);

    const c = cache[key];
    if (c && c.expireAt > now + 30) return c; // 预留30秒

    const running = inflight.get(key);
    if (running) return running;

    const p = (async () => {
        const res = await getFilePreviewApi(fileId, w, h);
        const item: CacheItem = {
            previewUrl: String(res?.previewUrl || ''),
            thumbUrl: String(res?.thumbUrl || ''),
            expireAt: Number(res?.expireAt || now + 600),
        };
        cache[key] = item;
        saveCache();
        return item;
    })().finally(() => inflight.delete(key));

    inflight.set(key, p);
    return p;
}

async function resolveImageByUrl(url: string, w: number, h: number): Promise<{ preview: string; thumb: string }> {
    const raw = normalizeUrl(url);
    if (!raw) return { preview: '', thumb: '' };

    const fileId = parseFileIdFromUrl(raw);
    if (!fileId) {
        // 没有fileId无法调用预览接口，兜底
        return { preview: raw, thumb: raw };
    }

    try {
        const pair = await getSignedPair(fileId, w, h);
        return {
            preview: pair.previewUrl || raw,
            thumb: pair.thumbUrl || pair.previewUrl || raw,
        };
    } catch {
        return { preview: raw, thumb: raw };
    }
}

async function fetchDetail() {
    if (!productId.value) {
        message.error('商品ID无效');
        return;
    }

    loading.value = true;
    try {
        viewProduct.value = await getProductDetailApi(productId.value as any);

        // 收集所有图片的 fileId
        const fileIdMap = new Map<number, { source: string; type: 'main' | 'image' | 'sku'; skuId?: string }>();
        
        // 主图
        const mainRaw = normalizeUrl(viewProduct.value?.mainImage);
        const mainFileId = mainRaw;
        if (mainFileId) {
            fileIdMap.set(Number(mainFileId), { source: mainRaw, type: 'main' });
        }

        // 商品图
        const imgs = Array.isArray(viewProduct.value?.images) ? viewProduct.value?.images : [];
        imgs.forEach((u: string) => {
            if (u && !fileIdMap.has(Number(u))) {
                fileIdMap.set(Number(u), { source: u, type: 'image' });
            }
        });



        // SKU图
        const skus = Array.isArray(viewProduct.value?.skus) ? viewProduct.value?.skus : [];
        const skuImageData: Array<{ id: string; fileId: number | null; source: string }> = [];
        skus.forEach((s: any) => {
            const imgRaw = normalizeUrl(String(s?.image || ''));
            const fid = imgRaw ? parseFileIdFromUrl(imgRaw) : null;
            skuImageData.push({ id: String(s.id), fileId: fid, source: imgRaw });
            if (fid && !fileIdMap.has(fid)) {
                fileIdMap.set(fid, { source: imgRaw, type: 'sku', skuId: String(s.id) });
            }
        });

        // 批量获取所有预览 URL
        const fileIds = Array.from(fileIdMap.keys());
        await batchLoadFilePreviews(fileIds);

        // 设置主图预览
        if (mainFileId) {
            const previewUrl = getPreviewUrl(Number(mainFileId));
            mainImagePreview.value = previewUrl;
            mainImageThumb.value = previewUrl;
        } else if (mainRaw) {
            // 无 fileId，兜底使用原 URL
            mainImagePreview.value = mainRaw;
            mainImageThumb.value = mainRaw;
        } else {
            mainImagePreview.value = '';
            mainImageThumb.value = '';
        }

        // 设置商品图预览
        signedImages.value = imgs
            .map((u: string) => {
                if (u) {
                    const previewUrl = getPreviewUrl(Number(u));
                    return { preview: previewUrl || u, thumb: previewUrl || u };
                }
                return { preview: u, thumb: u };
            })
            .filter((x) => x.preview);

        // 设置 SKU 图预览
        const m: Record<string, { preview: string; thumb: string }> = {};
        skuImageData.forEach(({ id, fileId, source }) => {
            if (fileId) {
                const previewUrl = getPreviewUrl(fileId);
                if (previewUrl) {
                    m[id] = { preview: previewUrl, thumb: previewUrl };
                }
            } else if (source) {
                m[id] = { preview: source, thumb: source };
            }
        });
        skuImageMap.value = m;

        visibleImageCount.value = 8;
        lastRefreshAt.value = Date.now();
    } catch {
        message.error('获取商品详情失败');
    } finally {
        loading.value = false;
    }
}

function getSkuThumb(id: string | number) {
    return skuImageMap.value[String(id)]?.thumb || '';
}
function getSkuPreview(id: string | number) {
    return skuImageMap.value[String(id)]?.preview || '';
}

function loadMoreImages() {
    visibleImageCount.value += 8;
}

function handleRefresh() {
    const now = Date.now();
    if (now - lastRefreshAt.value < 5000) {
        message.warning('操作太频繁，请稍后再试');
        return;
    }
    fetchDetail();
}

function translateDeliveryMode(deliveryMode?: string) {
    switch (deliveryMode) {
        case 'MANUAL_ACTIVATE': return '手动激活';
        case 'PICKUP': return '自提';
        case 'DIRECT': return '自动发货';
        default: return deliveryMode || '-';
    }
}

function handleBack() {
    router.push('/products/list');
}

function handleEdit() {
    if (!viewProduct.value?.id) return;
    router.push(`/products/edit/${viewProduct.value.id}`);
}

function formatMoney(value?: number | null) {
    if (value === undefined || value === null) return '0.00';
    return (value / 100).toFixed(2);
}

function formatDateTime(value?: string) {
    if (!value) return '-';
    return value.replace('T', ' ');
}

function getStatusColor(status?: string) {
    switch (status) {
        case 'ACTIVE': return 'green';
        case 'INACTIVE': return 'default';
        case 'SOLD_OUT': return 'orange';
        default: return 'default';
    }
}

function getStatusText(status?: string) {
    switch (status) {
        case 'ACTIVE': return '在售';
        case 'INACTIVE': return '下架';
        case 'SOLD_OUT': return '售罄';
        default: return status || '-';
    }
}

function getProductTypeText(type?: string) {
    switch (type) {
        case 'PHYSICAL': return '实体商品';
        case 'VIRTUAL': return '虚拟权益';
        default: return type || '-';
    }
}
</script>

<style scoped>
.product-detail-page {
    min-height: 100%;
    padding: 16px;
    color: hsl(var(--foreground));
    background: hsl(var(--background));
    --sv-bg-card: hsl(var(--card));
    --sv-text: hsl(var(--foreground));
    --sv-text-secondary: hsl(var(--muted-foreground));
    --sv-border: hsl(var(--border));
}
.detail-card { background: var(--sv-bg-card); }
.page-title { color: var(--sv-text); }
.section-card { margin-bottom: 16px; }
.cover-box {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    border: 1px solid var(--sv-border);
    border-radius: 8px;
}
.main-image { border-radius: 8px; }
.description-text { color: var(--sv-text); line-height: 1.8; white-space: pre-wrap; }
.price { font-weight: 600; color: #f5222d; }
.original-price {
    margin-left: 8px;
    font-size: 12px;
    color: var(--sv-text-secondary);
    text-decoration: line-through;
}
.thumb { border-radius: 6px; overflow: hidden; }
.muted { color: var(--sv-text-secondary); }
.load-more-wrap { margin-top: 12px; }

:deep(.ant-card-head),
:deep(.ant-card-body),
:deep(.ant-descriptions-view),
:deep(.ant-table),
:deep(.ant-table-cell) {
    background: var(--sv-bg-card);
}
</style>
