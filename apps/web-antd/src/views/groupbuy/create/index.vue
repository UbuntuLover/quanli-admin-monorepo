<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
    Card as ACard,
    Cascader as ACascader,
    Col as ACol,
    DatePicker as ADatePicker,
    Divider as ADivider,
    Form as AForm,
    Input as AInput,
    InputNumber as AInputNumber,
    Radio as ARadio,
    Row as ARow,
    Select as ASelect,
    Spin as ASpin,
    Switch as ASwitch,
    Button as AButton,
    Space as ASpace,
    Tag as ATag,
    Alert as AAlert,
} from 'ant-design-vue';

import {
    createAdminGroupBuyActivityApi,
    type CreateGroupBuyActivityRequest,
    type GroupBuyLotteryType,
    type GroupBuyRefundDeadlineType,
} from '#/api/products/group-buy-admin';

import { getProductListApi, getProductDetailApi } from '#/api/products/product';
import { getCategoryTreeApi } from '#/api/products/productCategory';

import type { CascaderOption, CategoryDTO } from '#/types/category';
import type { ProductDTO, ProductSkuDTO, ProductListDTO } from '#/types/product';

defineOptions({ name: 'GroupBuyCreate' });

const AFormItem = AForm.Item;
const ARadioGroup = ARadio.Group;
const ARadioButton = ARadio.Button;
const ASelectOption = ASelect.Option;

const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const productLoading = ref(false);

// 表单数据（提交后端：价格单位分）
const formState = ref<CreateGroupBuyActivityRequest>({
    name: '',
    productId: '',
    skuId: undefined,
    originalPrice: 0, // 分
    groupPrice: 0, // 分
    minPeople: 2,
    maxPeople: 10,
    startTime: '',
    endTime: '',
    expireHours: 24,
    lotteryType: 'GROUP_PRICE' as GroupBuyLotteryType,
    autoGroupEnabled: 0,
    refundDeadLineType: 'AFTER_GROUP' as GroupBuyRefundDeadlineType, // 默认成团后不可退款
});

// 前端价格展示/输入（单位：元）
const originalPriceYuan = ref<number | null>(null);
const groupPriceYuan = ref<number | null>(null);

// DatePicker 专用值（精确到小时）
const startTimePicker = ref<Dayjs | null>(null);
const endTimePicker = ref<Dayjs | null>(null);

// 分类相关
const categoryTree = ref<CategoryDTO[]>([]);
const categoryPath = ref<(number | string)[]>([]);
const selectedCategoryId = ref<string | undefined>(undefined);

// 商品相关
const products = ref<ProductListDTO[]>([]);
const selectedProduct = ref<ProductDTO | null>(null);
const productSearch = ref('');

// 抽奖类型选项
const lotteryTypeOptions = [
    { value: 'GROUP_PRICE', label: '团购价模式' },
    { value: 'LEADER_FREE', label: '团长免费模式' },
    { value: 'RANDOM_ONE', label: '随机一人免单模式' },
];

// 分类 options
const categoryOptions = computed<CascaderOption[]>(() => convertCategoryToOptions(categoryTree.value));

// SKU options（来自商品详情）
const skuOptions = computed(() => {
    if (!selectedProduct.value?.skus) return [];
    return selectedProduct.value.skus.map((sku: ProductSkuDTO) => ({
        value: String(sku.id),
        label: sku.skuName || `SKU #${sku.id}`,
        price: sku.price, // 分
        originalPrice: sku.originalPrice, // 分
    }));
});

const hasCategorySelected = computed(() => !!selectedCategoryId.value);

// 价格预览（元）
const discountYuan = computed(() => {
    if (originalPriceYuan.value == null || groupPriceYuan.value == null) return 0;
    return Math.max(0, originalPriceYuan.value - groupPriceYuan.value);
});

// 转换函数：元 -> 分
function yuanToCent(yuan: number | null | undefined): number {
    if (yuan == null || Number.isNaN(yuan)) return 0;
    return Math.round(yuan * 100);
}

// 转换函数：分 -> 元
function centToYuan(cent: number | null | undefined): number {
    if (cent == null || Number.isNaN(cent)) return 0;
    return cent / 100;
}

function formatYuan(yuan: number): string {
    return `¥${yuan.toFixed(2)}`;
}

function formatCentAsYuan(cent: number): string {
    return formatYuan(centToYuan(cent));
}

function convertCategoryToOptions(categories: CategoryDTO[]): CascaderOption[] {
    return categories.map((item: CategoryDTO) => {
        const children =
            item.children && item.children.length > 0 ? convertCategoryToOptions(item.children) : undefined;

        return {
            value: item.id,
            label: item.name,
            children,
            disabled: item.status !== 'ACTIVE',
        };
    });
}

function handleCategoryChange(value: (string | number)[]) {
    const values = (value || []).map((item) => String(item));
    categoryPath.value = values;
    selectedCategoryId.value = values.length > 0 ? values[values.length - 1] : undefined;

    // 清空商品、SKU、价格
    selectedProduct.value = null;
    formState.value.productId = '';
    formState.value.skuId = undefined;
    formState.value.originalPrice = 0;
    formState.value.groupPrice = 0;
    originalPriceYuan.value = null;
    groupPriceYuan.value = null;

    loadProductsByCategory();
}

function clearCategory() {
    categoryPath.value = [];
    selectedCategoryId.value = undefined;
    productSearch.value = '';

    products.value = [];
    selectedProduct.value = null;
    formState.value.productId = '';
    formState.value.skuId = undefined;
    formState.value.originalPrice = 0;
    formState.value.groupPrice = 0;
    originalPriceYuan.value = null;
    groupPriceYuan.value = null;
}

async function loadProductsByCategory() {
    if (!selectedCategoryId.value) {
        products.value = [];
        return;
    }

    productLoading.value = true;
    try {
        const params: any = {
            status: 'ACTIVE',
            page: 1,
            pageSize: 50,
            categoryId: selectedCategoryId.value,
        };

        if (productSearch.value) params.name = productSearch.value;

        const res = await getProductListApi(params);
        products.value = res.list || [];
    } catch (e: any) {
        message.error(e?.message || '加载商品失败');
        products.value = [];
    } finally {
        productLoading.value = false;
    }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function handleProductSearch(value: string) {
    if (!hasCategorySelected.value) {
        message.warning('请先选择商品分类');
        return;
    }

    productSearch.value = value;
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        loadProductsByCategory();
    }, 300);
}

async function handleProductChange(productId: string) {
    if (!productId) {
        selectedProduct.value = null;
        formState.value.productId = '';
        formState.value.skuId = undefined;
        formState.value.originalPrice = 0;
        formState.value.groupPrice = 0;
        originalPriceYuan.value = null;
        groupPriceYuan.value = null;
        return;
    }

    formState.value.productId = productId;
    formState.value.skuId = undefined;
    formState.value.originalPrice = 0;
    formState.value.groupPrice = 0;
    originalPriceYuan.value = null;
    groupPriceYuan.value = null;

    try {
        productLoading.value = true;
        const detail = await getProductDetailApi(productId);
        selectedProduct.value = detail;

        if (!detail.skus || detail.skus.length === 0) {
            message.info('该商品暂无SKU，请手动填写价格（元）');
        }
    } catch (e: any) {
        selectedProduct.value = null;
        message.error(e?.message || '获取商品详情失败');
    } finally {
        productLoading.value = false;
    }
}

// 选 SKU 自动回填价格（前端显示元，后端存分）
function handleSkuChange(skuId: string | undefined) {
    if (!skuId || !selectedProduct.value?.skus) return;

    const selectedSku = selectedProduct.value.skus.find((sku) => String(sku.id) === skuId);
    if (selectedSku) {
        formState.value.originalPrice = selectedSku.originalPrice;
        formState.value.groupPrice = selectedSku.price;
        originalPriceYuan.value = centToYuan(selectedSku.originalPrice);
        groupPriceYuan.value = centToYuan(selectedSku.price);
    }
}

// 禁用过去时间（按小时）
function disabledDate(current: Dayjs): boolean {
    return !!current && current < dayjs().startOf('day');
}
function disabledEndDate(current: Dayjs): boolean {
    if (!startTimePicker.value) return disabledDate(current);
    return !!current && current < startTimePicker.value.startOf('hour');
}

// 统一把分钟秒归零，精确到小时
function normalizeToHour(value: Dayjs | null): Dayjs | null {
    if (!value) return null;
    return value.minute(0).second(0).millisecond(0);
}

async function handleSubmit() {
    if (!formState.value.name) return message.error('请输入活动名称');
    if (!selectedCategoryId.value) return message.error('请先选择商品分类');
    if (!formState.value.productId) return message.error('请选择商品');

    if (selectedProduct.value?.skus && selectedProduct.value.skus.length > 0 && !formState.value.skuId) {
        return message.error('请选择商品规格（SKU）');
    }

    // 前端元 -> 后端分
    formState.value.originalPrice = yuanToCent(originalPriceYuan.value);
    formState.value.groupPrice = yuanToCent(groupPriceYuan.value);

    if (formState.value.originalPrice <= 0) return message.error('请输入正确的原价（元）');
    if (formState.value.groupPrice <= 0 || formState.value.groupPrice >= formState.value.originalPrice) {
        return message.error('团购价必须大于0且小于原价');
    }

    const startNormalized = normalizeToHour(startTimePicker.value);
    const endNormalized = normalizeToHour(endTimePicker.value);

    if (!startNormalized) return message.error('请选择活动开始时间');
    if (!endNormalized) return message.error('请选择活动结束时间');
    if (endNormalized.isBefore(startNormalized)) return message.error('结束时间不能早于开始时间');

    if (formState.value.expireHours <= 0) return message.error('请输入正确的成团过期时间');

    formState.value.startTime = startNormalized.format('YYYY-MM-DDTHH:mm:ss');
    formState.value.endTime = endNormalized.format('YYYY-MM-DDTHH:mm:ss');

    submitting.value = true;
    try {
        await createAdminGroupBuyActivityApi(formState.value);
        message.success('创建成功');
        router.push({ name: 'GroupBuyList' });
    } catch (e: any) {
        message.error(e?.message || '创建失败');
    } finally {
        submitting.value = false;
    }
}

function handleBack() {
    router.push({ name: 'GroupBuyList' });
}

async function loadCategoryTree() {
    try {
        categoryTree.value = await getCategoryTreeApi();
    } catch {
        message.error('加载分类失败');
    }
}

onMounted(async () => {
    await loadCategoryTree();
    products.value = [];
});

// 监听 SKU 自动填价
watch(
    () => formState.value.skuId,
    (newSkuId) => handleSkuChange(newSkuId),
);
</script>

<template>
    <div class="group-buy-create-page p-4">
        <a-spin :spinning="loading">
            <a-card :bordered="false">
                <template #title>
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-base font-semibold">创建拼团活动</div>
                            <div class="mt-1 text-xs text-gray-400">填写活动信息后即可创建拼团活动</div>
                        </div>
                        <a-tag color="blue">Group Buy Create</a-tag>
                    </div>
                </template>

                <a-form layout="vertical">
                    <a-divider orientation="left">基本信息</a-divider>
                    <a-row :gutter="24">
                        <a-col :span="12">
                            <a-form-item label="活动名称" required>
                                <a-input v-model:value="formState.name" placeholder="请输入活动名称" :maxlength="100" show-count />
                            </a-form-item>
                        </a-col>
                        <a-col :span="12">
                            <a-form-item label="成团过期时间" required>
                                <a-input-number v-model:value="formState.expireHours" :min="1" :max="168" style="width: 100%" addon-after="小时" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">商品信息</a-divider>
                    <a-row :gutter="[16, 16]">
                        <a-col :xs="24" :md="12">
                            <a-form-item label="商品分类" required>
                                <div class="flex gap-2">
                                    <a-cascader
                                        v-model:value="categoryPath"
                                        :options="categoryOptions"
                                        placeholder="请先选择分类"
                                        allow-clear
                                        change-on-select
                                        style="flex: 1"
                                        @change="handleCategoryChange"
                                    />
                                    <a-button v-if="selectedCategoryId" @click="clearCategory">重置</a-button>
                                </div>
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="搜索商品">
                                <a-input
                                    v-model:value="productSearch"
                                    :disabled="!hasCategorySelected"
                                    :placeholder="hasCategorySelected ? '输入商品名称搜索' : '请先选择分类'"
                                    allow-clear
                                    @press-enter="handleProductSearch(productSearch)"
                                />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="24">
                        <a-col :span="24">
                            <a-form-item label="选择商品" required>
                                <a-select
                                    v-model:value="formState.productId"
                                    :disabled="!hasCategorySelected"
                                    :placeholder="hasCategorySelected ? '请选择商品' : '请先选择分类'"
                                    show-search
                                    :loading="productLoading"
                                    :filter-option="false"
                                    :allow-clear="true"
                                    not-found-content="暂无商品"
                                    @change="handleProductChange"
                                >
                                    <a-select-option v-for="product in products" :key="product.id" :value="String(product.id)">
                                        <div class="product-option">
                                            <img v-if="product.mainImage" :src="product.mainImage" class="product-image" />
                                            <span v-else class="product-image-placeholder">无图</span>
                                            <span class="product-name">{{ product.name }}</span>
                                        </div>
                                    </a-select-option>
                                </a-select>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row v-if="selectedProduct" :gutter="24">
                        <a-col :span="24">
                            <div class="selected-product-info">
                                <div class="sku-selection">
                                    <div class="sku-title">选择商品规格（SKU）</div>

                                    <div v-if="skuOptions.length > 0" class="sku-list">
                                        <a-card
                                            v-for="sku in skuOptions"
                                            :key="sku.value"
                                            class="sku-card"
                                            :class="{ 'sku-card-active': formState.skuId === sku.value }"
                                            hoverable
                                            @click="formState.skuId = sku.value"
                                        >
                                            <div class="sku-card-content">
                                                <div class="sku-card-name">{{ sku.label }}</div>
                                                <div class="sku-card-price">
                                                    团购价：{{ formatCentAsYuan(sku.price) }} / 原价：{{ formatCentAsYuan(sku.originalPrice) }}
                                                </div>
                                            </div>
                                        </a-card>
                                    </div>

                                    <div v-else>
                                        <a-alert message="该商品暂无 SKU，可手动填写价格（元）" type="info" :show-icon="true" />
                                    </div>

                                    <div v-if="formState.skuId" class="sku-price-info">
                                        <a-alert message="已选择规格，价格已自动填充（单位：元）" type="success" :show-icon="true" />
                                    </div>
                                </div>
                            </div>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">价格设置（单位：元）</a-divider>
                    <a-row :gutter="24">
                        <a-col :span="8">
                            <a-form-item label="原价（元）" required>
                                <a-input-number
                                    v-model:value="originalPriceYuan"
                                    :min="0.01"
                                    :step="0.01"
                                    :precision="2"
                                    style="width: 100%"
                                    placeholder="请输入原价（元）"
                                />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="团购价（元）" required>
                                <a-input-number
                                    v-model:value="groupPriceYuan"
                                    :min="0.01"
                                    :step="0.01"
                                    :precision="2"
                                    style="width: 100%"
                                    placeholder="请输入团购价（元）"
                                />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="价格预览">
                                <div class="price-preview">
                                    <div class="price-item">
                                        <span class="price-label">原价</span>
                                        <span class="price-value">{{ formatYuan(originalPriceYuan || 0) }}</span>
                                    </div>
                                    <div class="price-item">
                                        <span class="price-label">团购价</span>
                                        <span class="price-value group">{{ formatYuan(groupPriceYuan || 0) }}</span>
                                    </div>
                                    <div class="price-item">
                                        <span class="price-label">优惠</span>
                                        <span class="price-value discount">-{{ formatYuan(discountYuan) }}</span>
                                    </div>
                                </div>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">成团设置</a-divider>
                    <a-row :gutter="24">
                        <a-col :span="8">
                            <a-form-item label="最小成团人数" required>
                                <a-input-number v-model:value="formState.minPeople" :min="2" :max="100" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="最大成团人数" required>
                                <a-input-number v-model:value="formState.maxPeople" :min="formState.minPeople" :max="100" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="自动成团">
                                <a-switch v-model:checked="formState.autoGroupEnabled" :checked-value="1" :unchecked-value="0" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">时间设置（精确到小时）</a-divider>
                    <a-row :gutter="24">
                        <a-col :span="12">
                            <a-form-item label="活动开始时间" required>
                                <a-date-picker
                                    v-model:value="startTimePicker"
                                    show-time
                                    format="YYYY-MM-DD HH:00"
                                    value-format=""
                                    :disabled-date="disabledDate"
                                    style="width: 100%"
                                    placeholder="选择开始时间（小时）"
                                />
                            </a-form-item>
                        </a-col>
                        <a-col :span="12">
                            <a-form-item label="活动结束时间" required>
                                <a-date-picker
                                    v-model:value="endTimePicker"
                                    show-time
                                    format="YYYY-MM-DD HH:00"
                                    value-format=""
                                    :disabled-date="disabledEndDate"
                                    style="width: 100%"
                                    placeholder="选择结束时间（小时）"
                                />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">抽奖模式</a-divider>
                    <a-form-item label="抽奖类型">
                        <a-radio-group v-model:value="formState.lotteryType" button-style="solid">
                            <a-radio-button v-for="opt in lotteryTypeOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </a-radio-button>
                        </a-radio-group>
                    </a-form-item>

                    <a-divider orientation="left">退款设置</a-divider>
                    <a-form-item label="退款截止类型">
                        <a-radio-group v-model:value="formState.refundDeadLineType">
                            <a-radio value="BEFORE_GROUP">成团前可退款</a-radio>
                            <a-radio value="AFTER_GROUP">成团后不可退款</a-radio>
                        </a-radio-group>
                    </a-form-item>

                    <a-divider />
                    <a-row>
                        <a-col :span="24" class="text-center">
                            <a-space size="large">
                                <a-button @click="handleBack">取消</a-button>
                                <a-button type="primary" :loading="submitting" @click="handleSubmit">提交创建</a-button>
                            </a-space>
                        </a-col>
                    </a-row>
                </a-form>
            </a-card>
        </a-spin>
    </div>
</template>

<style scoped>
.group-buy-create-page {
    width: 100%;
}
.product-option {
    display: flex;
    align-items: center;
    gap: 8px;
}
.product-image {
    width: 32px;
    height: 32px;
    object-fit: cover;
    border-radius: 4px;
}
.product-image-placeholder {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-container);
    border-radius: 4px;
    font-size: 10px;
}
.product-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.selected-product-info {
    margin-top: 8px;
    padding: 16px;
    background: var(--color-bg-container);
    border-radius: 8px;
}
.sku-selection {
    margin-top: 8px;
}
.sku-title {
    font-weight: 600;
    margin-bottom: 12px;
}
.sku-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
}
.sku-card {
    cursor: pointer;
}
.sku-card-active {
    border: 1px solid var(--ant-color-primary);
}
.sku-card-name {
    font-weight: 500;
}
.sku-card-price {
    margin-top: 8px;
    color: var(--color-text-secondary);
}
.sku-price-info {
    margin-top: 12px;
}
.price-preview {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--color-bg-container);
    border-radius: 8px;
}
.price-item {
    display: flex;
    justify-content: space-between;
}
.price-label {
    color: var(--color-text-secondary);
}
.price-value.group {
    color: var(--ant-color-primary);
}
.price-value.discount {
    color: #ff4d4f;
}
</style>
