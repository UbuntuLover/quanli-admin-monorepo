<template>
    <div class="page-wrap">
        <a-card :title="pageTitle" :bordered="false">
            <template #extra>
                <a-space>
                    <a-button @click="handleBack">取消</a-button>
                    <a-button type="primary" :loading="submitting" @click="handleSubmit">保存</a-button>
                </a-space>
            </template>

            <a-spin :spinning="pageLoading">
                <!-- 单卡表单（课程卡/场地卡） -->
                <a-form v-if="isSingleCard" layout="vertical">
                    <a-divider orientation="left">模板信息</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="模板名称" required>
                                <a-input v-model:value="baseForm.templateName" placeholder="请输入模板名称" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="有效天数" required>
                                <a-input-number v-model:value="baseForm.validityDays" :min="1" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="适用场馆(不填则为通用)">
                                <a-select
                                    v-model:value="baseForm.applicableVenues"
                                    mode="multiple"
                                    :options="venueOptions"
                                    :loading="venueLoading"
                                    :filter-option="true"
                                    placeholder="请选择可用场馆（可多选）"
                                    style="width: 100%"
                                />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="原价（元）" required>
                                <a-input-number v-model:value="baseForm.originalPriceYuan" :min="0.01" :step="0.01" :precision="2" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="售价（元）" required>
                                <a-input-number v-model:value="baseForm.sellingPriceYuan" :min="0.01" :step="0.01" :precision="2" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="新客价（元）">
                                <a-input-number v-model:value="baseForm.newCustomerPriceYuan" :min="0.01" :step="0.01" :precision="2" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="单卡类型" required>
                                <a-select v-model:value="singleForm.cardType">
                                    <a-select-option value="COURSE">课程卡 COURSE</a-select-option>
                                    <a-select-option value="VENUE">场地卡 VENUE</a-select-option>
                                </a-select>
                            </a-form-item>
                        </a-col>

                        <template v-if="isCourse">
                            <a-col :span="8">
                                <a-form-item label="课程次数" required>
                                    <a-input-number v-model:value="singleForm.courseTimes" :min="1" style="width: 100%" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="8">
                                <a-form-item label="课程时长(min)" required>
                                    <a-input-number v-model:value="singleForm.courseDuration" :min="1" style="width: 100%" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="8">
                                <a-form-item label="可指定教练">
                                    <a-switch v-model:checked="singleForm.canSpecifyCoach" checked-value="1" un-checked-value="0" />
                                </a-form-item>
                            </a-col>
                        </template>

                        <template v-if="isVenue">
                            <a-col :span="8">
                                <a-form-item label="场地权益类型" required>
                                    <a-select v-model:value="singleForm.venueBenefitType" placeholder="请选择场地权益类型">
                                        <a-select-option value="COUNT">次数卡</a-select-option>
                                        <a-select-option value="PERIOD">时段卡</a-select-option>
                                    </a-select>
                                </a-form-item>
                            </a-col>
                            <a-col :span="8" v-if="singleForm.venueBenefitType === 'COUNT'">
                                <a-form-item label="场地次数" required>
                                    <a-input-number v-model:value="singleForm.venueTimes" :min="1" style="width: 100%" />
                                </a-form-item>
                            </a-col>
                        </template>
                    </a-row>

                    <a-divider orientation="left">商品信息</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="商品名称" required>
                                <a-input v-model:value="baseForm.productName" placeholder="请输入商品名称" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="副标题">
                                <a-input v-model:value="baseForm.subtitle" placeholder="请输入副标题" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="品牌ID">
                                <a-input-number v-model:value="baseForm.brandId" placeholder="请输入品牌ID" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="24">
                            <a-form-item label="分类" required>
                                <a-cascader
                                    v-model:value="categoryValue"
                                    :options="categoryCascaderOptions"
                                    :loading="categoryLoading"
                                    placeholder="请选择分类（必须选择第三级）"
                                    :show-search="{ filter }"
                                    style="width: 100%"
                                    expand-trigger="hover"
                                    :field-names="{ label: 'label', value: 'value', children: 'children' }"
                                    @change="onCategoryChange"
                                />
                                <div v-if="selectedCategoryLabel" class="mt-2 text-sm text-gray-500">
                                    已选: {{ selectedCategoryLabel }}
                                </div>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="24">
                            <a-form-item label="商品描述">
                                <a-textarea v-model:value="baseForm.description" placeholder="请输入商品描述" :rows="3" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="12">
                            <a-form-item label="主图URL">
                                <a-input v-model:value="baseForm.mainImage" placeholder="请输入主图URL" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="12">
                            <a-form-item label="详情图URL（多张用逗号分隔）">
                                <a-input v-model:value="baseForm.detailImagesText" placeholder="请输入详情图URL，多张用逗号分隔" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">SKU信息</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="SKU名称" required>
                                <a-input v-model:value="baseForm.skuName" placeholder="请输入SKU名称" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="SKU图">
                                <a-input v-model:value="baseForm.skuImage" placeholder="请输入SKU图URL" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="库存">
                                <a-input-number v-model:value="baseForm.stockQuantity" :min="0" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="24">
                            <a-form-item label="SKU属性（键值对）">
                                <div v-for="(attr, index) in baseForm.attributesKv" :key="index" class="flex gap-2 mb-2">
                                    <a-input v-model:value="attr.key" placeholder="属性名" style="width: 200px" />
                                    <a-input v-model:value="attr.value" placeholder="属性值" style="width: 200px" />
                                    <a-button type="link" danger @click="removeAttrRow(index)">删除</a-button>
                                </div>
                                <a-button type="dashed" block @click="addAttrRow">+ 添加属性</a-button>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">销售设置</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="激活方式">
                                <a-select v-model:value="baseForm.deliveryMode">
                                    <a-select-option value="DIRECT">直接激活</a-select-option>
                                    <a-select-option value="MANUAL_ACTIVATE">手动激活</a-select-option>
                                </a-select>
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="最大同时预约">
                                <a-input-number v-model:value="baseForm.maxConcurrentBookings" :min="0" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="最大每日预约">
                                <a-input-number v-model:value="baseForm.maxDailyBookings" :min="0" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="新品">
                                <a-switch v-model:checked="baseForm.isNew" checked-value="1" un-checked-value="0" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="热卖">
                                <a-switch v-model:checked="baseForm.isHot" checked-value="1" un-checked-value="0" />
                            </a-form-item>
                        </a-col>
                    </a-row>
                </a-form>

                <!-- 组合卡表单 -->
                <a-form v-else-if="isComboCard" layout="vertical">
                    <a-divider orientation="left">模板信息</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="模板名称" required>
                                <a-input v-model:value="baseForm.templateName" placeholder="请输入模板名称" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="有效天数" required>
                                <a-input-number v-model:value="baseForm.validityDays" :min="1" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="适用场馆(不填则为通用)">
                                <a-select
                                    v-model:value="baseForm.applicableVenues"
                                    mode="multiple"
                                    :options="venueOptions"
                                    :loading="venueLoading"
                                    :filter-option="true"
                                    placeholder="请选择可用场馆（可多选）"
                                    style="width: 100%"
                                />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="原价（元）" required>
                                <a-input-number v-model:value="baseForm.originalPriceYuan" :min="0.01" :step="0.01" :precision="2" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="售价（元）" required>
                                <a-input-number v-model:value="baseForm.sellingPriceYuan" :min="0.01" :step="0.01" :precision="2" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="新客价（元）">
                                <a-input-number v-model:value="baseForm.newCustomerPriceYuan" :min="0.01" :step="0.01" :precision="2" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">商品信息</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="商品名称" required>
                                <a-input v-model:value="baseForm.productName" placeholder="请输入商品名称" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="副标题">
                                <a-input v-model:value="baseForm.subtitle" placeholder="请输入副标题" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="品牌ID">
                                <a-input-number v-model:value="baseForm.brandId" placeholder="请输入品牌ID" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="24">
                            <a-form-item label="分类" required>
                                <a-cascader
                                    v-model:value="categoryValue"
                                    :options="categoryCascaderOptions"
                                    :loading="categoryLoading"
                                    placeholder="请选择分类（必须选择第三级）"
                                    :show-search="{ filter }"
                                    style="width: 100%"
                                    expand-trigger="hover"
                                    :field-names="{ label: 'label', value: 'value', children: 'children' }"
                                    @change="onCategoryChange"
                                />
                                <div v-if="selectedCategoryLabel" class="mt-2 text-sm text-gray-500">
                                    已选: {{ selectedCategoryLabel }}
                                </div>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="24">
                            <a-form-item label="商品描述">
                                <a-textarea v-model:value="baseForm.description" placeholder="请输入商品描述" :rows="3" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="12">
                            <a-form-item label="主图URL">
                                <a-input v-model:value="baseForm.mainImage" placeholder="请输入主图URL" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="12">
                            <a-form-item label="详情图URL（多张用逗号分隔）">
                                <a-input v-model:value="baseForm.detailImagesText" placeholder="请输入详情图URL，多张用逗号分隔" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">SKU信息</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="SKU名称" required>
                                <a-input v-model:value="baseForm.skuName" placeholder="请输入SKU名称" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="SKU图">
                                <a-input v-model:value="baseForm.skuImage" placeholder="请输入SKU图URL" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="库存">
                                <a-input-number v-model:value="baseForm.stockQuantity" :min="0" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="24">
                            <a-form-item label="SKU属性（键值对）">
                                <div v-for="(attr, index) in baseForm.attributesKv" :key="index" class="flex gap-2 mb-2">
                                    <a-input v-model:value="attr.key" placeholder="属性名" style="width: 200px" />
                                    <a-input v-model:value="attr.value" placeholder="属性值" style="width: 200px" />
                                    <a-button type="link" danger @click="removeAttrRow(index)">删除</a-button>
                                </div>
                                <a-button type="dashed" block @click="addAttrRow">+ 添加属性</a-button>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-divider orientation="left">销售设置</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="激活方式">
                                <a-select v-model:value="baseForm.deliveryMode">
                                    <a-select-option value="DIRECT">直接激活</a-select-option>
                                    <a-select-option value="MANUAL_ACTIVATE">手动激活</a-select-option>
                                </a-select>
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="最大同时预约">
                                <a-input-number v-model:value="baseForm.maxConcurrentBookings" :min="0" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="最大每日预约">
                                <a-input-number v-model:value="baseForm.maxDailyBookings" :min="0" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="新品">
                                <a-switch v-model:checked="baseForm.isNew" checked-value="1" un-checked-value="0" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="热卖">
                                <a-switch v-model:checked="baseForm.isHot" checked-value="1" un-checked-value="0" />
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <!-- 组合卡专属：子卡选择 -->
                    <a-divider orientation="left">子卡配置</a-divider>
                    <a-row>
                        <a-col :span="24">
                            <a-form-item>
                                <a-button type="dashed" block @click="addChild">+ 添加子卡</a-button>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <div v-for="(child, index) in comboChildren" :key="index" class="child-card">
                        <a-row :gutter="16">
                            <a-col :span="8">
                                <a-form-item label="子卡模板" required>
                                    <a-select
                                        v-model:value="child.childTemplateId"
                                        :options="childTemplateOptions"
                                        :loading="childTemplateLoading"
                                        placeholder="请选择子卡模板"
                                        style="width: 100%"
                                    />
                                </a-form-item>
                            </a-col>
                            <a-col :span="6">
                                <a-form-item label="数量" required>
                                    <a-input-number v-model:value="child.quantity" :min="1" style="width: 100%" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="6">
                                <a-form-item label="排序">
                                    <a-input-number v-model:value="child.sortOrder" :min="0" style="width: 100%" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="4">
                                <a-form-item label="操作">
                                    <a-button type="link" danger @click="removeChild(index)">删除</a-button>
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-row :gutter="16">
                            <a-col :span="24">
                                <a-form-item label="展示名称">
                                    <a-input v-model:value="child.displayName" placeholder="留空则使用子卡默认名称" />
                                </a-form-item>
                            </a-col>
                        </a-row>
                    </div>
                </a-form>

                <!-- 无卡类型时（创建模式） -->
                <a-form v-else layout="vertical">
                    <a-divider orientation="left">模板信息</a-divider>
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="模板名称" required>
                                <a-input v-model:value="baseForm.templateName" placeholder="请输入模板名称" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="有效天数" required>
                                <a-input-number v-model:value="baseForm.validityDays" :min="1" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="适用场馆(不填则为通用)">
                                <a-select
                                    v-model:value="baseForm.applicableVenues"
                                    mode="multiple"
                                    :options="venueOptions"
                                    :loading="venueLoading"
                                    :filter-option="true"
                                    placeholder="请选择可用场馆（可多选）"
                                    style="width: 100%"
                                />
                            </a-form-item>
                        </a-col>
                    </a-row>
                </a-form>
            </a-spin>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    Cascader as ACascader,
    Col as ACol,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    InputNumber as AInputNumber,
    message,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Spin as ASpin,
    Switch as ASwitch,
    Textarea as ATextarea,
} from 'ant-design-vue';

import {
    createComboPackageProductApi,
    createSinglePackageProductApi,
    getAvailableChildTemplatesApi,
    getPackageTemplateDetailApi,
    updateComboPackageProductApi,
    updateSinglePackageProductApi,
    type PackageProductApi,
} from '#/api/template/template';
import { getAllVenuesApi, type VenueDetailDTO } from '#/api/venue/list';
import {  getCategoryTreeApi } from '#/api/products/productCategory';
import { type CategoryDTO } from '#/types/category';

type CardType = 'COURSE' | 'VENUE' | 'COMBO';

interface KvItem {
    key: string;
    value: string;
}

const route = useRoute();
const router = useRouter();

const submitting = ref(false);
const pageLoading = ref(false);
const venueLoading = ref(false);
const venueOptions = ref<Array<{ label: string; value: number }>>([]);

// 子卡模板相关
const childTemplateLoading = ref(false);
const childTemplateOptions = ref<Array<{ label: string; value: number; cardType: string }>>([]);

// 商品分类相关
const categoryLoading = ref(false);
const categoryCascaderOptions = ref<CascaderOption[]>([]);

// 用于显示已选分类的标签
const selectedCategoryLabel = ref<string>('');

// 级联选择的值（完整路径数组）
const categoryValue = ref<(string)[]>([]);

// 当前编辑的模板ID
const editingId = ref<number | null>(null);

// 当前卡类型（从 URL 参数获取，用于判断显示哪个表单）
const cardType = ref<CardType | null>(null);

// 通用表单
const baseForm = reactive({
    templateName: '',
    validityDays: 30,

    // 展示层单位：元（支持小数）
    originalPriceYuan: 100,
    sellingPriceYuan: 90,
    newCustomerPriceYuan: undefined as number | undefined,

    // 改为下拉多选
    applicableVenues: [] as number[],
    maxConcurrentBookings: 2,
    maxDailyBookings: undefined as number | undefined,

    productName: '',
    brandId: '' as number | '',
    subtitle: '',
    description: '',
    mainImage: '',
    detailImagesText: '',

    deliveryMode: 'MANUAL_ACTIVATE' as 'DIRECT' | 'MANUAL_ACTIVATE',
    isNew: '0' as '0' | '1',
    isHot: '0' as '0' | '1',

    skuName: '',
    skuImage: '',
    stockQuantity: 999999,

    // SKU属性：动态键值对
    attributesKv: [{ key: '', value: '' }] as KvItem[],
});

// 单卡专属
const singleForm = reactive({
    cardType: 'COURSE' as CardType,
    courseTimes: undefined as number | undefined,
    courseDuration: undefined as number | undefined,
    canSpecifyCoach: '0' as '0' | '1',
    venueBenefitType: undefined as 'COUNT' | 'PERIOD' | undefined,
    venueTimes: undefined as number | undefined,
});

// 组合卡专属
const comboChildren = ref<PackageProductApi.CreateComboChildItem[]>([
    { childTemplateId: 0, quantity: 1, displayName: '', sortOrder: 0 },
]);

const isCourse = computed(() => singleForm.cardType === 'COURSE');
const isVenue = computed(() => singleForm.cardType === 'VENUE');

// 判断是否为单卡（课程卡或场地卡）
const isSingleCard = computed(() => cardType.value === 'COURSE' || cardType.value === 'VENUE');

// 判断是否为组合卡
const isComboCard = computed(() => cardType.value === 'COMBO');

// 获取卡类型显示文本
function getCardTypeText(type: CardType | null): string {
    switch (type) {
        case 'COURSE':
            return '课程卡';
        case 'VENUE':
            return '场地卡';
        case 'COMBO':
            return '组合卡';
        default:
            return '';
    }
}

// 页面标题
const pageTitle = computed(() => {
    const typeText = getCardTypeText(cardType.value);
    if (editingId.value) {
        return `编辑${typeText}`;
    }
    return `创建${typeText}`;
});

/** 元 => 分（四舍五入） */
function yuanToCent(yuan: number): number {
    return Math.round(yuan * 100);
}

function parseStringArray(text: string): string[] | undefined {
    const arr = text.split(',').map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : undefined;
}

function buildAttributesFromKv(): Record<string, string> | undefined {
    const result: Record<string, string> = {};
    for (const item of baseForm.attributesKv) {
        const k = item.key.trim();
        const v = item.value.trim();
        if (!k && !v) continue;
        if (!k) throw new Error('SKU属性存在空键，请补全或删除该行');
        result[k] = v;
    }
    return Object.keys(result).length ? result : undefined;
}

function addAttrRow() {
    baseForm.attributesKv.push({ key: '', value: '' });
}

function removeAttrRow(index: number) {
    baseForm.attributesKv.splice(index, 1);
    if (!baseForm.attributesKv.length) {
        baseForm.attributesKv.push({ key: '', value: '' });
    }
}

function addChild() {
    comboChildren.value.push({
        childTemplateId: 0,
        quantity: 1,
        displayName: '',
        sortOrder: comboChildren.value.length,
    });
}

function removeChild(index: number) {
    comboChildren.value.splice(index, 1);
}

function validateCommon() {
    if (!baseForm.templateName.trim()) throw new Error('模板名称不能为空');
    if (!baseForm.productName.trim()) throw new Error('商品名称不能为空');
    if (!baseForm.skuName.trim()) throw new Error('SKU名称不能为空');
    if (!categoryValue.value || categoryValue.value.length === 0) {
        throw new Error('请选择分类');
    }
    if (categoryValue.value.length !== 3) {
        throw new Error('商品必须挂在第三级分类上，请重新选择');
    }
    if (baseForm.validityDays <= 0) throw new Error('有效天数必须大于0');

    if (baseForm.originalPriceYuan <= 0 || baseForm.sellingPriceYuan <= 0) {
        throw new Error('价格必须大于0');
    }
    if (baseForm.sellingPriceYuan > baseForm.originalPriceYuan) {
        throw new Error('售价不能高于原价');
    }
}

/**
 * 获取选中的第三级分类ID（用于提交）
 */
function getCategoryId(): string {
    return categoryValue.value[categoryValue.value.length - 1];
}

async function loadVenues() {
    try {
        venueLoading.value = true;
        const list = (await getAllVenuesApi()) as VenueDetailDTO[];
        venueOptions.value = (list || []).map((v) => ({
            label: `${v.name}${v.status ? `（${v.status}）` : ''}`,
            value: v.id,
        }));
    } catch (e: any) {
        message.error(e?.message || '加载场馆失败');
    } finally {
        venueLoading.value = false;
    }
}

async function loadChildTemplates() {
    try {
        childTemplateLoading.value = true;
        const templates = await getAvailableChildTemplatesApi();
        childTemplateOptions.value = (templates || []).map((t) => ({
            label: `${t.name}（${t.cardType} / ¥${(t.sellingPrice / 100).toFixed(2)}）`,
            value: t.id,
            cardType: t.cardType,
        }));
    } catch (e: any) {
        message.error(e?.message || '加载子模板失败');
    } finally {
        childTemplateLoading.value = false;
    }
}

async function loadCategories() {
    try {
        categoryLoading.value = true;
        const list = await getCategoryTreeApi();
        categoryCascaderOptions.value = buildCascaderOptions(list || []);
    } catch (e: any) {
        message.error(e?.message || '加载分类失败');
    } finally {
        categoryLoading.value = false;
    }
}

/**
 * 构建级联选择器选项（只显示到第三级）
 */
function buildCascaderOptions(categories: CategoryDTO[], level: number = 1): CascaderOption[] {
    if (level > 3) {
        return [];
    }

    return categories.map((cat) => {
        const option: CascaderOption = {
            value: cat.id,
            label: cat.name,
        };

        if (cat.children && cat.children.length > 0 && level < 3) {
            option.children = buildCascaderOptions(cat.children, level + 1);
        }

        return option;
    });
}

/**
 * 查找分类的完整路径标签
 */
function findCategoryPath(values: (string | number)[], options: CascaderOption[]): string {
    if (!values || values.length === 0) return '';

    const [first, ...rest] = values;
    const current = options.find((opt) => String(opt.value) === String(first));

    if (!current) return '';

    if (rest.length === 0) {
        return current.label;
    }

    if (current.children) {
        const childPath = findCategoryPath(rest, current.children);
        return childPath ? `${current.label} / ${childPath}` : current.label;
    }

    return current.label;
}

/**
 * 级联选择变化时更新显示标签
 */
function onCategoryChange(values: (string | number)[]) {
    selectedCategoryLabel.value = findCategoryPath(values, categoryCascaderOptions.value);
}

/**
 * 级联选择器搜索过滤函数
 */
function filter(inputValue: string, path: CascaderOption[]) {
    return path.some((option) => (option.label as string).toLowerCase().includes(inputValue.toLowerCase()));
}

/**
 * 加载模板详情
 */
async function loadTemplateDetail(id: number) {
    pageLoading.value = true;
    try {
        const detail = await getPackageTemplateDetailApi(id);

        // 回显基础信息
        baseForm.templateName = detail.name;
        baseForm.validityDays = detail.validityDays;
        baseForm.originalPriceYuan = (detail.originalPrice || 0) / 100;
        baseForm.sellingPriceYuan = (detail.sellingPrice || 0) / 100;

        // 根据卡类型设置表单类型
        if (detail.cardType === 'COURSE' || detail.cardType === 'VENUE') {
            cardType.value = detail.cardType;
            singleForm.cardType = detail.cardType;
            singleForm.courseTimes = detail.courseTimes || undefined;
            singleForm.courseDuration = detail.courseDuration || undefined;
            singleForm.canSpecifyCoach = (detail as any).canSpecifyCoach ? '1' : '0';
            singleForm.venueBenefitType = detail.venueBenefitType || undefined;
            singleForm.venueTimes = detail.venueTimes || undefined;
        } else if (detail.cardType === 'COMBO') {
            cardType.value = 'COMBO';
            // 加载子卡数据
            const childTemplates = (detail as any).childTemplates || (detail as any).children || [];
            comboChildren.value = childTemplates.map((child: any) => ({
                childTemplateId: child.id || child.templateId,
                quantity: child.quantity || 1,
                displayName: child.displayName || child.name || '',
                sortOrder: child.sortOrder || 0,
            }));
        }

        // 回显商品信息（如果有）
        if ((detail as any).productName) {
            baseForm.productName = (detail as any).productName;
            baseForm.subtitle = (detail as any).subtitle || '';
            baseForm.description = (detail as any).description || '';
            baseForm.mainImage = (detail as any).mainImage || '';
            baseForm.skuName = (detail as any).skuName || '';
            baseForm.skuImage = (detail as any).skuImage || '';
            baseForm.stockQuantity = (detail as any).stockQuantity || 999999;
            baseForm.brandId = (detail as any).brandId || '';

            // 回显分类
            if ((detail as any).categoryId) {
                // 需要根据categoryId查找完整的分类路径
                const categoryId = (detail as any).categoryId;
                // 这里需要根据实际情况设置 categoryValue
                // 由于级联选择需要完整路径，暂时只设置最后一级
                categoryValue.value = [String(categoryId)];
                selectedCategoryLabel.value = (detail as any).categoryName || '';
            }
        }

    } catch (e: any) {
        message.error(e?.message || '加载模板详情失败');
    } finally {
        pageLoading.value = false;
    }
}

async function submitSingle() {
    validateCommon();

    if (singleForm.cardType === 'COURSE') {
        if (!singleForm.courseTimes || singleForm.courseTimes <= 0) throw new Error('课程次数必须大于0');
        if (!singleForm.courseDuration || singleForm.courseDuration <= 0) throw new Error('课程时长必须大于0');
    }

    if (singleForm.cardType === 'VENUE') {
        if (!singleForm.venueBenefitType) throw new Error('场地权益类型必填');
        if (singleForm.venueBenefitType === 'COUNT' && (!singleForm.venueTimes || singleForm.venueTimes <= 0)) {
            throw new Error('场地次数卡必须填写 venueTimes > 0');
        }
    }

    const payload: PackageProductApi.CreateSinglePackageProductRequest = {
        templateName: baseForm.templateName.trim(),
        cardType: singleForm.cardType,

        courseTimes: isCourse.value ? singleForm.courseTimes : null,
        courseDuration: isCourse.value ? singleForm.courseDuration : null,
        canSpecifyCoach: Number(singleForm.canSpecifyCoach),

        validityDays: baseForm.validityDays,
        // 提交层单位：分
        originalPrice: yuanToCent(baseForm.originalPriceYuan),
        sellingPrice: yuanToCent(baseForm.sellingPriceYuan),
        newCustomerPrice:
            baseForm.newCustomerPriceYuan != null ? yuanToCent(baseForm.newCustomerPriceYuan) : null,

        applicableVenues: baseForm.applicableVenues.length ? baseForm.applicableVenues : null,
        maxConcurrentBookings: baseForm.maxConcurrentBookings,
        maxDailyBookings: baseForm.maxDailyBookings ?? null,

        venueBenefitType: isVenue.value ? singleForm.venueBenefitType ?? null : null,
        venueTimes: isVenue.value ? singleForm.venueTimes ?? null : null,

        productName: baseForm.productName.trim(),
        categoryId: getCategoryId(),
        brandId: baseForm.brandId || null,
        subtitle: baseForm.subtitle || null,
        description: baseForm.description || null,
        mainImage: baseForm.mainImage || null,
        detailImages: parseStringArray(baseForm.detailImagesText) ?? null,

        deliveryMode: baseForm.deliveryMode,
        isNew: Number(baseForm.isNew),
        isHot: Number(baseForm.isHot),

        skuName: baseForm.skuName.trim(),
        skuImage: baseForm.skuImage || null,
        attributes: buildAttributesFromKv() ?? null,
        stockQuantity: baseForm.stockQuantity,
    };

    if (editingId.value) {
        await updateSinglePackageProductApi(editingId.value, payload);
        message.success('单卡更新成功');
    } else {
        const res = await createSinglePackageProductApi(payload);
        message.success(`单卡创建成功：模板ID ${res.templateId}`);
    }
}

async function submitCombo() {
    validateCommon();

    if (!comboChildren.value.length) throw new Error('组合卡至少一个子项');

    const normalizedChildren = comboChildren.value.map((c, idx) => ({
        childTemplateId: c.childTemplateId,
        quantity: Number(c.quantity),
        displayName: c.displayName?.trim() || null,
        sortOrder: Number.isFinite(c.sortOrder as number) ? (c.sortOrder as number) : idx,
    }));

    normalizedChildren.forEach((c, idx) => {
        if (!c.childTemplateId || c.childTemplateId <= 0) throw new Error(`第${idx + 1}行 childTemplateId 不合法`);
        if (!c.quantity || c.quantity <= 0) throw new Error(`第${idx + 1}行 quantity 必须大于0`);
    });

    const payload: PackageProductApi.CreateComboPackageProductRequest = {
        templateName: baseForm.templateName.trim(),

        validityDays: baseForm.validityDays,
        // 提交层单位：分
        originalPrice: yuanToCent(baseForm.originalPriceYuan),
        sellingPrice: yuanToCent(baseForm.sellingPriceYuan),
        newCustomerPrice:
            baseForm.newCustomerPriceYuan != null ? yuanToCent(baseForm.newCustomerPriceYuan) : null,

        applicableVenues: baseForm.applicableVenues.length ? baseForm.applicableVenues : null,
        maxConcurrentBookings: baseForm.maxConcurrentBookings,
        maxDailyBookings: baseForm.maxDailyBookings ?? null,

        children: normalizedChildren,

        productName: baseForm.productName.trim(),
        categoryId: getCategoryId(),
        brandId: baseForm.brandId || null,
        subtitle: baseForm.subtitle || null,
        description: baseForm.description || null,
        mainImage: baseForm.mainImage || null,
        detailImages: parseStringArray(baseForm.detailImagesText) ?? null,

        deliveryMode: baseForm.deliveryMode,
        isNew: Number(baseForm.isNew),
        isHot: Number(baseForm.isHot),

        skuName: baseForm.skuName.trim(),
        skuImage: baseForm.skuImage || null,
        attributes: buildAttributesFromKv() ?? null,
        stockQuantity: baseForm.stockQuantity,
    };

    if (editingId.value) {
        await updateComboPackageProductApi(editingId.value, payload);
        message.success('组合卡更新成功');
    } else {
        const res = await createComboPackageProductApi(payload);
        message.success(`组合卡创建成功：模板ID ${res.templateId}`);
    }
}

async function handleSubmit() {
    try {
        submitting.value = true;

        // 根据 cardType 判断提交哪个
        if (cardType.value === 'COMBO') {
            await submitCombo();
        } else {
            await submitSingle();
        }

        // 成功后跳转回列表
        router.push({ name: 'PackageTemplateInfo' });
    } catch (e: any) {
        message.error(e?.message || '提交失败');
    } finally {
        submitting.value = false;
    }
}

function handleBack() {
    router.back();
}

onMounted(() => {
    // 加载基础数据
    loadVenues();
    loadChildTemplates();
    loadCategories();

    // 从 URL 参数获取卡类型
    const type = route.query.cardType as CardType;
    if (type && ['COURSE', 'VENUE', 'COMBO'].includes(type)) {
        cardType.value = type;
    }

    // 检查是否有编辑的ID
    const id = route.query.id;
    if (id) {
        editingId.value = Number(id);
        loadTemplateDetail(editingId.value);
    }
});
</script>

<style scoped>
.page-wrap {
    padding: 16px;
}

.child-card {
    background: var(--color-bg-container);
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 8px;
}

.flex {
    display: flex;
}

.gap-2 {
    gap: 8px;
}

.mb-2 {
    margin-bottom: 8px;
}

.mt-2 {
    margin-top: 8px;
}

.text-sm {
    font-size: 14px;
}

.text-gray-500 {
    color: #9ca3af;
}
</style>
