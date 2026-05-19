<template>
    <div class="product-detail-page">
        <a-card :bordered="false" class="detail-card">
            <template #title>
                <div class="page-title">
                    <a-space>
                        <a-button @click="handleBack">返回</a-button>
                        <span>商品详情</span>
                        <a-tag :color="getStatusColor(product?.status)">
                            {{ getStatusText(product?.status) }}
                        </a-tag>
                    </a-space>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="handleRefresh" :loading="loading">刷新</a-button>
                    <a-button type="primary" @click="handleEdit" :disabled="!product?.id">
                        编辑商品
                    </a-button>
                </a-space>
            </template>

            <a-spin :spinning="loading">
                <a-empty v-if="!product" description="暂无商品数据" />
                <template v-else>
                    <!-- 基础信息 -->
                    <a-card size="small" title="基础信息" class="section-card">
                        <a-row :gutter="16">
                            <a-col :xs="24" :md="8">
                                <div class="cover-box">
                                    <a-image
                                        :src="product.mainImage || fallbackImage"
                                        :preview="!!product.mainImage"
                                        class="main-image"
                                    />
                                </div>
                            </a-col>

                            <a-col :xs="24" :md="16">
                                <a-descriptions bordered :column="2" size="small">
                                    <a-descriptions-item label="商品ID">
                                        {{ product.id }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="商品编号">
                                        {{ product.productNo || '-' }}
                                    </a-descriptions-item>

                                    <a-descriptions-item label="商品名称">
                                        {{ product.name || '-' }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="副标题">
                                        {{ product.subtitle || '-' }}
                                    </a-descriptions-item>

                                    <a-descriptions-item label="分类">
                                        {{ product.categoryName || product.categoryId || '-' }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="品牌">
                                        {{ product.brandName || product.brandId || '-' }}
                                    </a-descriptions-item>

                                    <a-descriptions-item label="商品类型">
                                        {{ getProductTypeText(product.productType) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="权益类型">
                                        {{ product.benefitType || '-' }}
                                    </a-descriptions-item>

                                    <a-descriptions-item label="履约方式">
                                        {{ translateDeliveryMode(product.deliveryMode) || '-' }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="销量">
                                        {{ product.sales ?? 0 }}
                                    </a-descriptions-item>

                                    <a-descriptions-item label="标签" :span="2">
                                        <a-space>
                                            <a-tag v-if="product.isNew === 1" color="blue">新品</a-tag>
                                            <a-tag v-if="product.isHot === 1" color="orange">热销</a-tag>
                                            <span v-if="product.isNew !== 1 && product.isHot !== 1" class="muted">-</span>
                                        </a-space>
                                    </a-descriptions-item>

                                    <a-descriptions-item label="创建时间" :span="2">
                                        {{ formatDateTime(product.createdAt) }}
                                    </a-descriptions-item>
                                </a-descriptions>
                            </a-col>
                        </a-row>
                    </a-card>

                    <!-- 描述 -->
                    <a-card size="small" title="商品描述" class="section-card">
                        <div class="description-text">
                            {{ product.description || '暂无描述' }}
                        </div>
                    </a-card>

                    <!-- 图片 -->
                    <a-card size="small" title="商品图片" class="section-card">
                        <a-empty v-if="!product.images || product.images.length === 0" description="暂无图片" />
                        <a-image-preview-group v-else>
                            <a-space wrap>
                                <a-image
                                    v-for="(img, idx) in product.images"
                                    :key="`${img}-${idx}`"
                                    :src="img"
                                    :width="96"
                                    :height="96"
                                    class="thumb"
                                />
                            </a-space>
                        </a-image-preview-group>
                    </a-card>

                    <!-- SKU 列表 -->
                    <a-card size="small" title="SKU 列表" class="section-card">
                        <a-table
                            row-key="id"
                            :columns="skuColumns"
                            :data-source="product.skus || []"
                            :pagination="false"
                            :scroll="{ x: 980 }"
                            size="small"
                        >
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.key === 'price'">
                                    <span class="price">¥{{ formatMoney(record.price) }}</span>
                                    <span
                                        v-if="record.originalPrice && record.originalPrice > record.price"
                                        class="original-price"
                                    >
                    ¥{{ formatMoney(record.originalPrice) }}
                  </span>
                                </template>

                                <template v-else-if="column.key === 'attributes'">
                                    <a-space wrap>
                                        <a-tag
                                            v-for="(val, key) in record.attributes"
                                            :key="`${record.id}-${key}`"
                                        >
                                            {{ key }}: {{ val }}
                                        </a-tag>
                                        <span
                                            v-if="!record.attributes || Object.keys(record.attributes).length === 0"
                                            class="muted"
                                        >
                      -
                    </span>
                                    </a-space>
                                </template>

                                <template v-else-if="column.key === 'status'">
                                    <a-tag :color="record.status === 'ACTIVE' ? 'green' : 'default'">
                                        {{ record.status === 'ACTIVE' ? '启用' : '停用' }}
                                    </a-tag>
                                </template>

                                <template v-else-if="column.key === 'image'">
                                    <a-image
                                        v-if="record.image"
                                        :src="record.image"
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Descriptions as ADescriptions,
    Empty as AEmpty,
    Image as AImage,
    Row as ARow,
    Space as ASpace,
    Spin as ASpin,
    Table as ATable,
    Tag as ATag,
    message,
} from 'ant-design-vue';

import { getProductDetailApi } from '#/api/products/product';
import type { ProductDTO } from '#/types/product';

const ADescriptionsItem = ADescriptions.Item;

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const product = ref<ProductDTO | null>(null);

const fallbackImage = 'https://dummyimage.com/240x240/f5f5f5/999999&text=Product';

const productId = computed(() => {
    const raw = route.params.id;
    const id = Number(raw);
    return Number.isFinite(id) ? id : NaN;
});

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

onMounted(() => {
    fetchDetail();
});

async function fetchDetail() {
    if (!Number.isFinite(productId.value)) {
        message.error('商品ID无效');
        return;
    }

    loading.value = true;
    try {
        const res = await getProductDetailApi(productId.value);
        product.value = res;
    } catch (error) {
        message.error('获取商品详情失败');
    } finally {
        loading.value = false;
    }
}

function handleRefresh() {
    fetchDetail();
}

function translateDeliveryMode(deliveryMode?: string) {
    switch (deliveryMode) {
        case 'MANUAL_ACTIVATE':
            return '手动激活';
        case 'PICKUP':
            return '自提';
        case 'DIRECT':
            return '自动发货';
        default:
            return deliveryMode || '-';
    }
}

function handleBack() {
    router.push('/products/list');
}

function handleEdit() {
    if (!product.value?.id) return;
    router.push(`/products/edit/${product.value.id}`);
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
        case 'ACTIVE':
            return 'green';
        case 'INACTIVE':
            return 'default';
        case 'SOLD_OUT':
            return 'orange';
        default:
            return 'default';
    }
}

function getStatusText(status?: string) {
    switch (status) {
        case 'ACTIVE':
            return '在售';
        case 'INACTIVE':
            return '下架';
        case 'SOLD_OUT':
            return '售罄';
        default:
            return status || '-';
    }
}

function getProductTypeText(type?: string) {
    switch (type) {
        case 'PHYSICAL':
            return '实体商品';
        case 'VIRTUAL':
            return '虚拟权益';
        default:
            return type || '-';
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
    --sv-bg-soft: hsl(var(--accent));
    --sv-text: hsl(var(--foreground));
    --sv-text-secondary: hsl(var(--muted-foreground));
    --sv-border: hsl(var(--border));
}

.detail-card {
    background: var(--sv-bg-card);
}

.page-title {
    color: var(--sv-text);
}

.section-card {
    margin-bottom: 16px;
}

.cover-box {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    border: 1px solid var(--sv-border);
    border-radius: 8px;
}

.main-image {
    border-radius: 8px;
}

.description-text {
    color: var(--sv-text);
    line-height: 1.8;
    white-space: pre-wrap;
}

.price {
    font-weight: 600;
    color: #f5222d;
}

.original-price {
    margin-left: 8px;
    font-size: 12px;
    color: var(--sv-text-secondary);
    text-decoration: line-through;
}

.thumb {
    border-radius: 6px;
    overflow: hidden;
}

.muted {
    color: var(--sv-text-secondary);
}

:deep(.ant-card-head),
:deep(.ant-card-body),
:deep(.ant-descriptions-view),
:deep(.ant-table),
:deep(.ant-table-cell) {
    background: var(--sv-bg-card);
}
</style>
