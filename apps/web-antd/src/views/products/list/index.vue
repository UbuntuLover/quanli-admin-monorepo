<template>
    <div class="product-list-page">
        <a-card :bordered="false" class="table-card">
            <template #title>
                <div class="page-title">
                    <span>商品管理</span>
                    <a-tag color="blue">在售商品</a-tag>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="fetchProductList">刷新</a-button>
                    <a-button type="primary" @click="handleCreateProduct">
                        新建普通商品
                    </a-button>
                    <a-button type="primary" ghost @click="handleCreatePackageProduct">
                        新建权益商品
                    </a-button>
                </a-space>
            </template>

            <a-form
                class="filter-form"
                layout="vertical"
                :model="queryForm"
            >
                <a-row :gutter="16">
                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="商品名称">
                            <a-input
                                v-model:value="queryForm.name"
                                allow-clear
                                placeholder="请输入商品名称"
                                @press-enter="handleSearch"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="分类（请选择到三级分类）">
                            <a-cascader
                                v-model:value="categoryPath"
                                :options="categoryOptions"
                                allow-clear
                                change-on-select
                                placeholder="请选择商品分类"
                                @change="handleCategoryChange"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="4">
                        <a-form-item label="商品类型">
                            <a-select
                                v-model:value="queryForm.productType"
                                allow-clear
                                placeholder="全部"
                            >
                                <a-select-option value="PHYSICAL">实体商品</a-select-option>
                                <a-select-option value="VIRTUAL">虚拟权益</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="4">
                        <a-form-item label="商品状态">
                            <a-select
                                v-model:value="queryForm.status"
                                allow-clear
                                placeholder="全部"
                            >
                                <a-select-option value="ACTIVE">在售</a-select-option>
                                <a-select-option value="INACTIVE">下架</a-select-option>
                                <a-select-option value="SOLD_OUT">售罄</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="3">
                        <a-form-item label="新品">
                            <a-select
                                v-model:value="queryForm.isNew"
                                allow-clear
                                placeholder="全部"
                            >
                                <a-select-option :value="1">是</a-select-option>
                                <a-select-option :value="0">否</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="3">
                        <a-form-item label="热销">
                            <a-select
                                v-model:value="queryForm.isHot"
                                allow-clear
                                placeholder="全部"
                            >
                                <a-select-option :value="1">是</a-select-option>
                                <a-select-option :value="0">否</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="16">
                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="最低价">
                            <a-input-number
                                v-model:value="minPriceYuan"
                                style="width: 100%"
                                :min="0"
                                :precision="2"
                                placeholder="单位：元"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="最高价">
                            <a-input-number
                                v-model:value="maxPriceYuan"
                                style="width: 100%"
                                :min="0"
                                :precision="2"
                                placeholder="单位：元"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="排序">
                            <a-select
                                v-model:value="sortValue"
                                placeholder="请选择排序"
                                @change="handleSortChange"
                            >
                                <a-select-option value="created_at_DESC">最新创建</a-select-option>
                                <a-select-option value="sales_DESC">销量最高</a-select-option>
                                <a-select-option value="sales_ASC">销量最低</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="24" :md="24" :lg="9">
                        <a-form-item label=" ">
                            <a-space>
                                <a-button type="primary" @click="handleSearch">
                                    查询
                                </a-button>
                                <a-button @click="handleReset">
                                    重置
                                </a-button>
                            </a-space>
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>

            <a-table
                row-key="id"
                :loading="loading"
                :columns="columns"
                :data-source="productList"
                :pagination="pagination"
                :scroll="{ x: 1280 }"
                @change="handleTableChange"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'product'">
                        <div class="product-cell">
                            <a-image
                                class="product-image"
                                :src="record.mainImage || fallbackImage"
                                :width="64"
                                :height="64"
                                :preview="!!record.mainImage"
                            />

                            <div class="product-info">
                                <a-button
                                    type="link"
                                    class="product-name-link"
                                    @click="handleDetail(record)"
                                >
                                    {{ record.name }}
                                </a-button>


                                <div class="product-no">
                                    编号：{{ record.productNo }}
                                </div>

                                <div v-if="record.subtitle" class="product-subtitle">
                                    {{ record.subtitle }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'price'">
                        <div class="price-box">
              <span class="price">
                ¥{{ formatMoney(record.startPrice) }}
              </span>

                            <span
                                v-if="record.startOriginalPrice && record.startOriginalPrice > record.startPrice"
                                class="original-price"
                            >
                ¥{{ formatMoney(record.startOriginalPrice) }}
              </span>
                        </div>

                        <a-tag v-if="record.hasActivity" color="red">
                            活动中
                        </a-tag>
                    </template>

                    <template v-else-if="column.key === 'tags'">
                        <a-space>
                            <a-tag v-if="record.isNew === 1" color="blue">
                                新品
                            </a-tag>
                            <a-tag v-if="record.isHot === 1" color="orange">
                                热销
                            </a-tag>
                            <span v-if="record.isNew !== 1 && record.isHot !== 1" class="muted">
                -
              </span>
                        </a-space>
                    </template>

                    <template v-else-if="column.key === 'status'">
                        <a-tag :color="getStatusColor(record.status)">
                            {{ getStatusText(record.status) }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleDetail(record)">
                                详情
                            </a-button>

                            <a-button type="link" size="small" @click="handleEdit(record)">
                                编辑
                            </a-button>

                            <a-button
                                v-if="record.status === 'ACTIVE'"
                                type="link"
                                size="small"
                                @click="handleChangeStatus(record, 'INACTIVE')"
                            >
                                下架
                            </a-button>

                            <a-button
                                v-else
                                type="link"
                                size="small"
                                @click="handleChangeStatus(record, 'ACTIVE')"
                            >
                                上架
                            </a-button>

                            <a-popconfirm
                                title="确定删除该商品吗？"
                                ok-text="确定"
                                cancel-text="取消"
                                @confirm="handleDelete(record)"
                            >
                                <a-button type="link" size="small" danger>
                                    删除
                                </a-button>
                            </a-popconfirm>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import type { TablePaginationConfig } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
    Button as AButton,
    Card as ACard,
    Cascader as ACascader,
    Col as ACol,
    Form as AForm,
    Image as AImage,
    Input as AInput,
    InputNumber as AInputNumber,
    message,
    Popconfirm as APopconfirm,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Table as ATable,
    Tag as ATag,
} from 'ant-design-vue';

const AFormItem = AForm.Item;
const ASelectOption = ASelect.Option;


import {
    deleteProductApi,
    getProductListApi,
    updateProductStatusApi,
} from '#/api/products/product';

import { getCategoryTreeApi } from '#/api/products/productCategory';

import type { CascaderOption, CategoryDTO } from '#/types/category';
import type { ProductListDTO, ProductQueryDTO } from '#/types/product';

const router = useRouter();

const fallbackImage =
    'https://dummyimage.com/120x120/f5f5f5/999999&text=Product';

const loading = ref(false);
const productList = ref<ProductListDTO[]>([]);
const total = ref(0);

const categoryTree = ref<CategoryDTO[]>([]);
const categoryPath = ref<string[]>([]);

const minPriceYuan = ref<number | undefined>();
const maxPriceYuan = ref<number | undefined>();

const sortValue = ref('created_at_DESC');

const queryForm = reactive<ProductQueryDTO>({
    page: 1,
    pageSize: 10,
    name: undefined,
    categoryId: undefined,
    brandId: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    isNew: undefined,
    isHot: undefined,
    status: 'ACTIVE',
    productType: undefined,
    benefitType: undefined,
    sortField: 'created_at',
    sortDirection: 'DESC',
});

const columns = [
    {
        title: '商品信息',
        key: 'product',
        width: 380,
        fixed: 'left',
    },
    {
        title: '起售价',
        key: 'price',
        width: 180,
    },
    {
        title: '销量',
        dataIndex: 'sales',
        key: 'sales',
        width: 100,
    },
    {
        title: '标签',
        key: 'tags',
        width: 140,
    },
    {
        title: '状态',
        key: 'status',
        width: 120,
    },
    {
        title: '操作',
        key: 'actions',
        width: 260,
        fixed: 'right',
    },
];

const pagination = computed<TablePaginationConfig>(() => ({
    current: queryForm.page,
    pageSize: queryForm.pageSize,
    total: total.value,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (value) => `共 ${value} 条`,
}));

const categoryOptions = computed<CascaderOption[]>(() => {
    return convertCategoryToOptions(categoryTree.value);
});

onMounted(async () => {
    await Promise.all([fetchCategoryTree(), fetchProductList()]);
});

async function fetchProductList() {
    loading.value = true;

    try {
        syncPriceToQuery();

        const res = await getProductListApi({
            ...queryForm,
        });

        productList.value = res.list || [];
        total.value = res.total || 0;
        queryForm.page = res.page || queryForm.page;
        queryForm.pageSize = res.pageSize || queryForm.pageSize;
    } finally {
        loading.value = false;
    }
}

async function fetchCategoryTree() {
    const res = await getCategoryTreeApi();
    categoryTree.value = res || [];
}

function syncPriceToQuery() {
    queryForm.minPrice =
        minPriceYuan.value === undefined
            ? undefined
            : Math.round(minPriceYuan.value * 100);

    queryForm.maxPrice =
        maxPriceYuan.value === undefined
            ? undefined
            : Math.round(maxPriceYuan.value * 100);
}

function convertCategoryToOptions(categories: CategoryDTO[]): CascaderOption[] {
    return categories.map((item) => {
        const children =
            item.children && item.children.length > 0
                ? convertCategoryToOptions(item.children)
                : undefined;


        return {
            value: String(item.id),
            label: item.name,
            children,
            disabled: item.status !== 'ACTIVE',
        };
    });
}

function handleCategoryChange(value: Array<number | string>) {
    const values = (value || []).map((item) => String(item));
    categoryPath.value = values;

    queryForm.categoryId =
        values.length > 0 ? values[values.length - 1] : undefined;

}

function handleSortChange(value: string) {
    if (value === 'created_at_DESC') {
        queryForm.sortField = 'created_at';
        queryForm.sortDirection = 'DESC';
        return;
    }

    const parts = value.split('_');
    queryForm.sortDirection = parts.pop() as 'ASC' | 'DESC';
    queryForm.sortField = parts.join('_');
}

function handleSearch() {
    queryForm.page = 1;
    fetchProductList();
}

function handleReset() {
    queryForm.page = 1;
    queryForm.pageSize = 10;
    queryForm.name = undefined;
    queryForm.categoryId = undefined;
    queryForm.brandId = undefined;
    queryForm.minPrice = undefined;
    queryForm.maxPrice = undefined;
    queryForm.isNew = undefined;
    queryForm.isHot = undefined;
    queryForm.status = 'ACTIVE';
    queryForm.productType = undefined;
    queryForm.benefitType = undefined;
    queryForm.sortField = 'created_at';
    queryForm.sortDirection = 'DESC';

    categoryPath.value = [];
    minPriceYuan.value = undefined;
    maxPriceYuan.value = undefined;
    sortValue.value = 'created_at_DESC';

    fetchProductList();
}

function handleTableChange(pager: TablePaginationConfig) {
    queryForm.page = pager.current || 1;
    queryForm.pageSize = pager.pageSize || 10;
    fetchProductList();
}

function handleCreateProduct() {
    router.push('/product/create');
}

function handleCreatePackageProduct() {
    router.push('/package-product/create');
}

function handleDetail(record: ProductListDTO) {
    router.push({
        name: 'ProductDetail',
        params: {
            id: record.id,
        },
    });
}

function handleEdit(record: ProductListDTO) {
    router.push(`/products/edit/${record.id}`);
}

async function handleChangeStatus(record: ProductListDTO, status: string) {
    await updateProductStatusApi(record.id, status);
    message.success(status === 'ACTIVE' ? '商品已上架' : '商品已下架');
    fetchProductList();
}

async function handleDelete(record: ProductListDTO) {
    await deleteProductApi(record.id);
    message.success('删除成功');
    fetchProductList();
}

function formatMoney(value?: number | null) {
    if (value === undefined || value === null) {
        return '0.00';
    }

    return (value / 100).toFixed(2);
}

function getStatusColor(status: string) {
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

function getStatusText(status: string) {
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
</script>

<style scoped>
.product-list-page {
    min-height: 100%;
    padding: 16px;
    color: hsl(var(--foreground));
    background: hsl(var(--background));

    --sv-bg-card: hsl(var(--card));
    --sv-bg-soft: hsl(var(--accent));
    --sv-text: hsl(var(--foreground));
    --sv-text-secondary: hsl(var(--muted-foreground));
    --sv-border: hsl(var(--border));
    --sv-border-strong: hsl(var(--border));
}

.page-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--sv-text);
}

.filter-form {
    margin-bottom: 16px;
    padding: 16px;
    background: var(--sv-bg-card);
    border: 1px solid var(--sv-border);
    border-radius: 8px;
}

/* Table */
.table-card :deep(.ant-table) {
    color: var(--sv-text);
    background: var(--sv-bg-card);
}

.table-card :deep(.ant-table-container) {
    border-color: var(--sv-border);
}

.table-card :deep(.ant-table-cell) {
    padding: 8px;
    color: var(--sv-text);
    background: var(--sv-bg-card);
    border-color: var(--sv-border);
}

.table-card :deep(.ant-table-thead > tr > th) {
    color: var(--sv-text);
    background: var(--sv-bg-soft);
    border-color: var(--sv-border);
}

.table-card :deep(.ant-table-tbody > tr > td) {
    border-color: var(--sv-border);
}

.table-card :deep(.ant-table-tbody > tr:hover > td) {
    background: color-mix(in srgb, var(--sv-bg-card) 92%, var(--sv-text) 8%);
}

.product-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.product-image {
    flex-shrink: 0;
    object-fit: cover;
    overflow: hidden;
    background: color-mix(in srgb, var(--sv-bg-card) 90%, var(--sv-text-secondary) 10%);
    border-radius: 6px;
}

.product-info {
    min-width: 0;
}

.product-name {
    max-width: 250px;
    overflow: hidden;
    font-weight: 500;
    color: var(--sv-text);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.product-no {
    margin-top: 4px;
    font-size: 12px;
    color: var(--sv-text-secondary);
}

.product-name-link {
    max-width: 250px;
    padding: 0 !important;
    font-weight: 500;
    color: var(--sv-text);
    text-align: left;
}

.product-name-link :deep(span) {
    display: inline-block;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.product-name-link:hover {
    color: #1677ff;
}


.product-subtitle {
    max-width: 250px;
    margin-top: 4px;
    overflow: hidden;
    font-size: 12px;
    color: var(--sv-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.price-box {
    margin-bottom: 6px;
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

.muted {
    color: var(--sv-text-secondary);
}
</style>
