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
  FormItem as AFormItem,
  Input as AInput,
  InputNumber as AInputNumber,
  Radio as ARadio,
  RadioGroup as ARadioGroup,
  Row as ARow,
  Select as ASelect,
  SelectOption as ASelectOption,
  Spin as ASpin,
  Switch as ASwitch,
  Button as AButton,
  Space as ASpace,
  Tag as ATag,
  Alert as AAlert,
} from 'ant-design-vue';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';
import {
  createAdminGroupBuyActivityApi,
  type CreateGroupBuyActivityRequest,
  type GroupBuyLotteryType,
  type GroupBuyRefundDeadlineType,
} from '#/api/products/group-buy-admin';
import { getProductListApi } from '#/api/products/product';
import { getCategoryTreeApi } from '#/api/products/productCategory';
import type { CascaderOption, CategoryDTO } from '#/types/category';
import type { ProductDTO, ProductSkuDTO } from '#/types/product';

defineOptions({ name: 'GroupBuyCreate' });

const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const productLoading = ref(false);

// 表单数据
const formState = ref<CreateGroupBuyActivityRequest>({
  name: '',
  productId: '',
  skuId: undefined,
  originalPrice: 0,
  groupPrice: 0,
  minPeople: 2,
  maxPeople: 10,
  startTime: '',
  endTime: '',
  expireHours: 24,
  lotteryType: 'GROUP_PRICE' as GroupBuyLotteryType,
  autoGroupEnabled: 0,
  refundDeadLineType: 'BEFORE_GROUP' as GroupBuyRefundDeadlineType,
});

// 分类相关
const categoryTree = ref<CategoryDTO[]>([]);
const categoryPath = ref<(number | string)[]>([]);
const selectedCategoryId = ref<string | undefined>('');

// 商品相关
const products = ref<ProductDTO[]>([]);
const selectedProduct = ref<ProductDTO | null>(null);
const productSearch = ref('');

// 抽奖类型选项
const lotteryTypeOptions = [
  { value: 'GROUP_PRICE', label: '团购价模式' },
  { value: 'LEADER_FREE', label: '团长免费模式' },
  { value: 'RANDOM_ONE', label: '随机一人免单模式' },
];

// 退款截止类型选项
const refundDeadlineOptions = [
  { value: 'BEFORE_GROUP', label: '成团前可退款' },
  { value: 'AFTER_GROUP', label: '成团后不可退款' },
];

// 分类选项转换
const categoryOptions = computed<CascaderOption[]>(() => {
  return convertCategoryToOptions(categoryTree.value);
});

// 过滤后的SKU列表
const skuOptions = computed(() => {
  if (!selectedProduct.value?.skus) return [];
  return selectedProduct.value.skus.map((sku: ProductSkuDTO) => ({
    value: String(sku.id),
    label: sku.skuName || `SKU #${sku.id}`,
    price: sku.price,
    originalPrice: sku.originalPrice,
  }));
});

// 转换分类为级联选择器选项
function convertCategoryToOptions(categories: CategoryDTO[]): CascaderOption[] {
  return categories.map((item: CategoryDTO) => {
    const children =
      item.children && item.children.length > 0
        ? convertCategoryToOptions(item.children)
        : undefined;

    return {
      value: item.id, // 保持string类型，避免精度丢失
      label: item.name,
      children,
      disabled: item.status !== 'ACTIVE',
    };
  });
}

// 处理分类变化
function handleCategoryChange(value: (string | number)[]) {
  const values = (value || []).map((item) => String(item)); // 转换为string
  categoryPath.value = values;
  selectedCategoryId.value = values.length > 0 ? values[values.length - 1] : undefined;
  // 选择分类后立即加载该分类下的商品
  loadProductsByCategory();
}

// 清空分类选择
function clearCategory() {
  categoryPath.value = [];
  selectedCategoryId.value = undefined;
  loadProductsByCategory();
}

// 加载商品
async function loadProductsByCategory() {
  productLoading.value = true;
  try {
    const params: any = {
      status: 'ACTIVE',
      page: 1,
      pageSize: 50,
    };

    if (selectedCategoryId.value) {
      params.categoryId = selectedCategoryId.value;
    }

    if (productSearch.value) {
      params.name = productSearch.value;
    }

    const res = await getProductListApi(params);
    products.value = res.list || [];
  } catch (e: any) {
    message.error(e?.message || '加载商品失败');
    products.value = [];
  } finally {
    productLoading.value = false;
  }
}

// 搜索商品（带防抖）
let searchTimer: ReturnType<typeof setTimeout> | null = null;
function handleProductSearch(value: string) {
  productSearch.value = value;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadProductsByCategory();
  }, 300);
}

// 处理商品选择变化
function handleProductChange(productId: string) {
  if (!productId) {
    // 清空商品选择
    selectedProduct.value = null;
    formState.value.productId = '';
    formState.value.skuId = undefined;
    formState.value.originalPrice = 0;
    formState.value.groupPrice = 0;
    return;
  }

  // 商品选择
  formState.value.skuId = undefined;
  formState.value.originalPrice = 0;
  formState.value.groupPrice = 0;
  if (productId) {
    selectedProduct.value = products.value.find((p) => String(p.id) === productId) || null;
  } else {
    selectedProduct.value = null;
  }
}

// 处理SKU选择变化
function handleSkuChange(skuId: string | undefined) {
  if (!skuId || !selectedProduct.value?.skus) {
    return;
  }

  const selectedSku = selectedProduct.value.skus.find((sku) => String(sku.id) === skuId);
  if (selectedSku) {
    formState.value.originalPrice = selectedSku.originalPrice;
    formState.value.groupPrice = selectedSku.price;
  }
}

// 格式化金额显示
function formatPrice(cents: number): string {
  if (!cents) return '¥0.00';
  return `¥${(cents / 100).toFixed(2)}`;
}

// 禁用过去的时间
function disabledDate(current: Dayjs): boolean {
  return current && current < dayjs().startOf('day');
}

// 禁用结束时间（不能早于开始时间）
function disabledEndDate(current: Dayjs): boolean {
  if (!formState.value.startTime) {
    return disabledDate(current);
  }
  return current && current < dayjs(formState.value.startTime).startOf('day');
}

// 提交表单
async function handleSubmit() {
  // 验证表单
  if (!formState.value.name) {
    message.error('请输入活动名称');
    return;
  }
  if (!formState.value.productId) {
    message.error('请选择商品');
    return;
  }
  
  // 如果商品有SKU，则必须选择SKU
  if (selectedProduct.value?.skus && selectedProduct.value.skus.length > 0 && !formState.value.skuId) {
    message.error('请选择商品规格（SKU）');
    return;
  }
  
  if (formState.value.originalPrice <= 0) {
    message.error('请输入正确的原价');
    return;
  }
  if (formState.value.groupPrice <= 0 || formState.value.groupPrice >= formState.value.originalPrice) {
    message.error('团购价必须大于0且小于原价');
    return;
  }
  if (!formState.value.startTime) {
    message.error('请选择活动开始时间');
    return;
  }
  if (!formState.value.endTime) {
    message.error('请选择活动结束时间');
    return;
  }
  if (dayjs(formState.value.endTime).isBefore(dayjs(formState.value.startTime))) {
    message.error('结束时间不能早于开始时间');
    return;
  }
  if (formState.value.expireHours <= 0) {
    message.error('请输入正确的成团过期时间');
    return;
  }

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

// 返回列表
function handleBack() {
  router.push({ name: 'GroupBuyList' });
}

// 加载分类树
async function loadCategoryTree() {
  try {
    categoryTree.value = await getCategoryTreeApi();
  } catch (e: any) {
    console.error('加载分类失败', e);
  }
}

// 初始化
onMounted(async () => {
  await Promise.all([
    loadCategoryTree(),
    loadProductsByCategory(),
  ]);
});

// 监听SKU变化，自动填充价格
watch(() => formState.value.skuId, (newSkuId) => {
  handleSkuChange(newSkuId);
});
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
          <!-- 基本信息 -->
          <a-divider orientation="left">基本信息</a-divider>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="活动名称" required>
                <a-input
                  v-model:value="formState.name"
                  placeholder="请输入活动名称"
                  :maxlength="100"
                  show-count
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="成团过期时间" required>
                <a-input-number
                  v-model:value="formState.expireHours"
                  :min="1"
                  :max="168"
                  style="width: 100%"
                  addon-after="小时"
                />
                <div class="form-tip">从用户参团到成团的超时时间</div>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 商品信息 -->
          <a-divider orientation="left">商品信息</a-divider>
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :md="12">
              <a-form-item label="商品分类">
                <div class="flex gap-2">
                  <a-cascader
                    v-model:value="categoryPath"
                    :options="categoryOptions"
                    placeholder="选择分类筛选商品"
                    allow-clear
                    change-on-select
                    style="flex: 1"
                    @change="handleCategoryChange"
                  />
                  <a-button v-if="selectedCategoryId" @click="clearCategory">
                    重置
                  </a-button>
                </div>
                <div class="form-tip">
                  <span v-if="selectedCategoryId && productLoading" class="text-primary">
                    正在加载该分类商品...
                  </span>
                  <span v-else-if="selectedCategoryId">
                    已选择分类，当前显示 {{ products.length }} 个商品
                  </span>
                  <span v-else>
                    选择分类可筛选该分类下的商品
                  </span>
                </div>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="搜索商品">
                <a-input
                  v-model:value="productSearch"
                  placeholder="输入商品名称搜索（可结合分类使用）"
                  allow-clear
                  @press-enter="handleProductSearch(productSearch)"
                >
                  <template #suffix>
                    <a-button type="link" size="small" :loading="productLoading" @click="handleProductSearch(productSearch)">
                      搜索
                    </a-button>
                  </template>
                </a-input>
                <div class="form-tip">按回车键或点击搜索按钮进行搜索</div>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="选择商品" required>
                <a-select
                  v-model:value="formState.productId"
                  placeholder="请先选择分类或搜索商品"
                  show-search
                  :loading="productLoading"
                  :filter-option="false"
                  :allow-clear="true"
                  not-found-content="暂无商品，请尝试其他分类或搜索词"
                  @change="handleProductChange"
                >
                  <a-select-option
                    v-for="product in products"
                    :key="product.id"
                    :value="String(product.id)"
                  >
                    <div class="product-option">
                      <img
                        v-if="product.mainImage"
                        :src="product.mainImage"
                        class="product-image"
                      />
                      <span v-else class="product-image-placeholder">无图</span>
                      <span class="product-name">{{ product.name }}</span>
                    </div>
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 已选商品信息展示 -->
          <a-row v-if="selectedProduct" :gutter="24">
            <a-col :span="24">
              <div class="selected-product-info">
                <div class="product-detail-card">
                  <img
                    v-if="selectedProduct.mainImage"
                    :src="selectedProduct.mainImage"
                    class="product-detail-image"
                  />
                  <div v-else class="product-detail-image product-detail-image-placeholder">
                    无图
                  </div>
                  <div class="product-detail-info">
                    <div class="product-detail-name">{{ selectedProduct.name }}</div>
                    <div class="product-detail-sub">{{ selectedProduct.subtitle || '' }}</div>
                    <div class="product-detail-category">
                      {{ selectedProduct.categoryName || '' }}
                    </div>
                  </div>
                </div>

                <!-- SKU选择 -->
                <div class="sku-selection">
                  <div class="sku-title">
                    选择商品规格（SKU）
                    <span v-if="skuOptions.length > 0" class="sku-count">共 {{ skuOptions.length }} 个规格</span>
                    <span v-if="skuOptions.length === 0" class="text-gray-400">（无规格）</span>
                  </div>
                  
                  <!-- SKU列表 -->
                  <div v-if="skuOptions.length > 0" class="sku-list">
                    <a-card
                      v-for="sku in skuOptions"
                      :key="sku.value"
                      :bordered="formState.skuId === sku.value"
                      class="sku-card"
                      :class="{ 'sku-card-active': formState.skuId === sku.value }"
                      hoverable
                      @click="formState.skuId = sku.value"
                    >
                      <div class="sku-card-content">
                        <div class="sku-card-name">{{ sku.label }}</div>
                        <div class="sku-card-price">
                          <span class="sku-price-tag">
                            <span class="sku-price-label">团购价</span>
                            <span class="sku-price-value">{{ formatPrice(sku.price) }}</span>
                          </span>
                          <span class="sku-original-price">
                            <span class="sku-price-label">原价</span>
                            <span class="sku-price-value">{{ formatPrice(sku.originalPrice) }}</span>
                          </span>
                        </div>
                      </div>
                      <div v-if="formState.skuId === sku.value" class="sku-selected-icon">✓</div>
                    </a-card>
                  </div>

                  <div v-if="formState.skuId" class="sku-price-info">
                    <a-alert
                      message="已选择规格"
                      description="价格已自动填充，您仍可手动调整"
                      type="success"
                      :show-icon="true"
                    />
                  </div>
                </div>
              </div>
            </a-col>
          </a-row>

          <!-- 价格设置 -->
          <a-divider orientation="left">价格设置</a-divider>
          <a-row :gutter="24">
            <a-col :span="8">
              <a-form-item label="原价（分）" required>
                <a-input-number
                  v-model:value="formState.originalPrice"
                  :min="1"
                  :max="999999999"
                  style="width: 100%"
                  placeholder="请输入原价（单位：分）"
                />
                <div class="form-tip">原价，单位为分。如：1000 = ¥10.00</div>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="团购价（分）" required>
                <a-input-number
                  v-model:value="formState.groupPrice"
                  :min="1"
                  :max="formState.originalPrice - 1"
                  style="width: 100%"
                  placeholder="请输入团购价（单位：分）"
                />
                <div class="form-tip">团购价必须小于原价</div>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="价格预览">
                <div class="price-preview">
                  <div class="price-item">
                    <span class="price-label">原价</span>
                    <span class="price-value original">{{ formatPrice(formState.originalPrice) }}</span>
                  </div>
                  <div class="price-item">
                    <span class="price-label">团购价</span>
                    <span class="price-value group">{{ formatPrice(formState.groupPrice) }}</span>
                  </div>
                  <div class="price-item">
                    <span class="price-label">优惠</span>
                    <span class="price-value discount">
                      -{{ formatPrice(formState.originalPrice - formState.groupPrice) }}
                    </span>
                  </div>
                </div>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 成团设置 -->
          <a-divider orientation="left">成团设置</a-divider>
          <a-row :gutter="24">
            <a-col :span="8">
              <a-form-item label="最小成团人数" required>
                <a-input-number
                  v-model:value="formState.minPeople"
                  :min="2"
                  :max="100"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="最大成团人数" required>
                <a-input-number
                  v-model:value="formState.maxPeople"
                  :min="formState.minPeople"
                  :max="100"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="自动成团">
                <a-switch v-model:checked="formState.autoGroupEnabled" :checked-value="1" :unchecked-value="0" />
                <div class="form-tip">开启后，人数不足时系统自动补齐</div>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 时间设置 -->
          <a-divider orientation="left">时间设置</a-divider>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="活动开始时间" required>
                <a-date-picker
                  v-model:value="formState.startTime"
                  show-time
                  format="YYYY-MM-DD HH:mm:ss"
                  :disabled-date="disabledDate"
                  style="width: 100%"
                  placeholder="选择活动开始时间"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="活动结束时间" required>
                <a-date-picker
                  v-model:value="formState.endTime"
                  show-time
                  format="YYYY-MM-DD HH:mm:ss"
                  :disabled-date="disabledEndDate"
                  style="width: 100%"
                  placeholder="选择活动结束时间"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 抽奖模式设置 -->
          <a-divider orientation="left">抽奖模式</a-divider>
          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="抽奖类型">
                <a-radio-group v-model:value="formState.lotteryType" button-style="solid">
                  <a-radio-button
                    v-for="opt in lotteryTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </a-radio-button>
                </a-radio-group>
                <div class="form-tip">
                  <p v-if="formState.lotteryType === 'GROUP_PRICE'">
                    <strong>团购价模式：</strong>所有成团用户都以团购价购买
                  </p>
                  <p v-else-if="formState.lotteryType === 'LEADER_FREE'">
                    <strong>团长免费模式：</strong>团长免费获得商品，团员以原价购买
                  </p>
                  <p v-else-if="formState.lotteryType === 'RANDOM_ONE'">
                    <strong>随机免单模式：</strong>成团后随机一名用户免单，其余用户以原价购买
                  </p>
                </div>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 退款设置 -->
          <a-divider orientation="left">退款设置</a-divider>
          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="退款截止类型">
                <a-radio-group v-model:value="formState.refundDeadLineType">
                  <a-radio value="BEFORE_GROUP">成团前可退款</a-radio>
                  <a-radio value="AFTER_GROUP">成团后不可退款</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 提交按钮 -->
          <a-divider />
          <a-row>
            <a-col :span="24" class="text-center">
              <a-space size="large">
                <a-button @click="handleBack">取消</a-button>
                <a-button type="primary" :loading="submitting" @click="handleSubmit">
                  提交创建
                </a-button>
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

.form-tip {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.product-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-container);
  border-radius: 4px;
  font-size: 10px;
  color: var(--color-text-secondary);
}

.product-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-product-info {
  margin-top: 8px;
  padding: 16px;
  background: var(--color-bg-container);
  border-radius: 8px;
  border: 1px solid var(--ant-color-border-secondary);
}

.product-detail-card {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: var(--color-bg-base);
  border-radius: 8px;
}

.product-detail-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.product-detail-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-container);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.product-detail-info {
  flex: 1;
}

.product-detail-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.product-detail-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.product-detail-category {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.sku-selection {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--ant-color-border-secondary);
}

.sku-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sku-count {
  font-weight: 400;
  font-size: 12px;
  color: var(--ant-color-primary);
}

.sku-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.sku-card {
  position: relative;
  padding: 12px;
  transition: all 0.3s ease;
}

.sku-card:hover {
  border-color: var(--ant-color-primary);
}

.sku-card-active {
  border-color: var(--ant-color-primary);
  background: rgba(24, 144, 255, 0.05);
}

.sku-card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sku-card-name {
  font-weight: 500;
  font-size: 14px;
}

.sku-card-price {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sku-price-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sku-price-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.sku-price-value {
  font-weight: 600;
  font-size: 16px;
  color: var(--ant-color-primary);
}

.sku-original-price .sku-price-value {
  color: var(--color-text-secondary);
  text-decoration: line-through;
  font-weight: 400;
}

.sku-selected-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--ant-color-primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
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
  align-items: center;
}

.price-label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.price-value {
  font-weight: 600;
  font-size: 14px;
}

.price-value.original {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

.price-value.group {
  color: var(--ant-color-primary);
}

.price-value.discount {
  color: #ff4d4f;
}
</style>
