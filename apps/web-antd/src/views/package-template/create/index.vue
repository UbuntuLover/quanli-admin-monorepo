<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    InputNumber as AInputNumber,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Switch as ASwitch,
    Tabs as ATabs,
    TabPane as ATabPane,
    message,
} from 'ant-design-vue';

import {
    createComboPackageProductApi,
    createSinglePackageProductApi,
    type PackageProductApi,
} from '#/api/template/template';
import { getAllVenuesApi, type VenueDetailDTO } from '#/api/venue/list';

type CardType = 'COURSE' | 'VENUE';
type PackageMode = 'SINGLE' | 'COMBO';

interface KvItem {
    key: string;
    value: string;
}

const activeTab = ref<PackageMode>('SINGLE');
const submitting = ref(false);
const venueLoading = ref(false);
const venueOptions = ref<Array<{ label: string; value: number }>>([]);

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
    categoryId: undefined as number | undefined,
    brandId: undefined as number | undefined,
    subtitle: '',
    description: '',
    mainImage: '',
    detailImagesText: '',

    deliveryMode: 'MANUAL_ACTIVATE' as 'DIRECT' | 'MANUAL_ACTIVATE',
    isNew: 0,
    isHot: 0,

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
    canSpecifyCoach: 0,
    venueBenefitType: undefined as 'COUNT' | 'PERIOD' | undefined,
    venueTimes: undefined as number | undefined,
});

// 组合卡专属
const comboChildren = ref<PackageProductApi.CreateComboChildItem[]>([
    { childTemplateId: 0, quantity: 1, displayName: '', sortOrder: 0 },
]);

const isCourse = computed(() => singleForm.cardType === 'COURSE');
const isVenue = computed(() => singleForm.cardType === 'VENUE');

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
    if (!baseForm.categoryId) throw new Error('分类ID不能为空');
    if (baseForm.validityDays <= 0) throw new Error('有效天数必须大于0');

    if (baseForm.originalPriceYuan <= 0 || baseForm.sellingPriceYuan <= 0) {
        throw new Error('价格必须大于0');
    }
    if (baseForm.sellingPriceYuan > baseForm.originalPriceYuan) {
        throw new Error('售价不能高于原价');
    }
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
        canSpecifyCoach: singleForm.canSpecifyCoach,

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
        categoryId: baseForm.categoryId!,
        brandId: baseForm.brandId ?? null,
        subtitle: baseForm.subtitle || null,
        description: baseForm.description || null,
        mainImage: baseForm.mainImage || null,
        detailImages: parseStringArray(baseForm.detailImagesText) ?? null,

        deliveryMode: baseForm.deliveryMode,
        isNew: baseForm.isNew,
        isHot: baseForm.isHot,

        skuName: baseForm.skuName.trim(),
        skuImage: baseForm.skuImage || null,
        attributes: buildAttributesFromKv() ?? null,
        stockQuantity: baseForm.stockQuantity,
    };

    const res = await createSinglePackageProductApi(payload);
    message.success(`单卡创建成功：模板ID ${res.templateId}`);
}

async function submitCombo() {
    validateCommon();

    if (!comboChildren.value.length) throw new Error('组合卡至少一个子项');

    const normalizedChildren = comboChildren.value.map((c, idx) => ({
        childTemplateId: Number(c.childTemplateId),
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
        categoryId: baseForm.categoryId!,
        brandId: baseForm.brandId ?? null,
        subtitle: baseForm.subtitle || null,
        description: baseForm.description || null,
        mainImage: baseForm.mainImage || null,
        detailImages: parseStringArray(baseForm.detailImagesText) ?? null,

        deliveryMode: baseForm.deliveryMode,
        isNew: baseForm.isNew,
        isHot: baseForm.isHot,

        skuName: baseForm.skuName.trim(),
        skuImage: baseForm.skuImage || null,
        attributes: buildAttributesFromKv() ?? null,
        stockQuantity: baseForm.stockQuantity,
    };

    const res = await createComboPackageProductApi(payload);
    message.success(`组合卡创建成功：模板ID ${res.templateId}`);
}

async function handleSubmit() {
    try {
        submitting.value = true;
        if (activeTab.value === 'SINGLE') {
            await submitSingle();
        } else {
            await submitCombo();
        }
    } catch (e: any) {
        message.error(e?.message || '提交失败');
    } finally {
        submitting.value = false;
    }
}

onMounted(() => {
    loadVenues();
});
</script>

<template>
    <div class="page-wrap">
        <a-card title="创建权益卡模板商品" :bordered="false">
            <a-tabs v-model:activeKey="activeTab">
                <a-tab-pane key="SINGLE" tab="单卡（SINGLE）" />
                <a-tab-pane key="COMBO" tab="组合卡（COMBO）" />
            </a-tabs>

            <a-form layout="vertical">
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
                        <a-form-item label="适用场馆">
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

                <a-row v-if="activeTab === 'SINGLE'" :gutter="16">
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
                    </template>

                    <template v-if="isVenue">
                        <a-col :span="8">
                            <a-form-item label="场地权益类型" required>
                                <a-select v-model:value="singleForm.venueBenefitType">
                                    <a-select-option value="COUNT">次数卡 COUNT</a-select-option>
                                    <a-select-option value="PERIOD">时效卡 PERIOD</a-select-option>
                                </a-select>
                            </a-form-item>
                        </a-col>
                        <a-col :span="8" v-if="singleForm.venueBenefitType === 'COUNT'">
                            <a-form-item label="场地总次数" required>
                                <a-input-number v-model:value="singleForm.venueTimes" :min="1" style="width: 100%" />
                            </a-form-item>
                        </a-col>
                    </template>

                    <a-col :span="8">
                        <a-form-item label="可选教练">
                            <a-switch :checked="singleForm.canSpecifyCoach === 1" @change="(checked:boolean)=>singleForm.canSpecifyCoach = checked ? 1 : 0" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <div v-if="activeTab === 'COMBO'">
                    <a-divider orientation="left">组合子卡配置</a-divider>
                    <a-space direction="vertical" style="width: 100%">
                        <a-card v-for="(child, index) in comboChildren" :key="index" size="small">
                            <a-row :gutter="12">
                                <a-col :span="6">
                                    <a-form-item :label="`子模板ID #${index + 1}`" required>
                                        <a-input-number v-model:value="child.childTemplateId" :min="1" style="width: 100%" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="4">
                                    <a-form-item label="数量" required>
                                        <a-input-number v-model:value="child.quantity" :min="1" style="width: 100%" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="8">
                                    <a-form-item label="显示名">
                                        <a-input v-model:value="child.displayName" placeholder="可为空，默认模板名" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="4">
                                    <a-form-item label="排序">
                                        <a-input-number v-model:value="child.sortOrder" :min="0" style="width: 100%" />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="2" style="display: flex; align-items: end">
                                    <a-button danger @click="removeChild(index)" :disabled="comboChildren.length <= 1">删除</a-button>
                                </a-col>
                            </a-row>
                        </a-card>
                        <a-button type="dashed" block @click="addChild">+ 新增子项</a-button>
                    </a-space>
                </div>

                <a-divider orientation="left">商品信息</a-divider>
                <a-row :gutter="16">
                    <a-col :span="8">
                        <a-form-item label="商品名称" required>
                            <a-input v-model:value="baseForm.productName" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="分类ID" required>
                            <a-input-number v-model:value="baseForm.categoryId" :min="1" style="width: 100%" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="品牌ID">
                            <a-input-number v-model:value="baseForm.brandId" :min="1" style="width: 100%" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="16">
                    <a-col :span="8">
                        <a-form-item label="主图URL">
                            <a-input v-model:value="baseForm.mainImage" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="详情图URLs(逗号分隔)">
                            <a-input v-model:value="baseForm.detailImagesText" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="配送方式">
                            <a-select v-model:value="baseForm.deliveryMode">
                                <a-select-option value="DIRECT">DIRECT 自动发放</a-select-option>
                                <a-select-option value="MANUAL_ACTIVATE">MANUAL_ACTIVATE 人工激活</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-divider orientation="left">SKU信息</a-divider>
                <a-row :gutter="16">
                    <a-col :span="8">
                        <a-form-item label="SKU名称" required>
                            <a-input v-model:value="baseForm.skuName" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="SKU图片URL">
                            <a-input v-model:value="baseForm.skuImage" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="库存">
                            <a-input-number v-model:value="baseForm.stockQuantity" :min="0" style="width: 100%" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-divider orientation="left">SKU属性（键值对）</a-divider>
                <a-space direction="vertical" style="width: 100%">
                    <a-row v-for="(item, index) in baseForm.attributesKv" :key="index" :gutter="12">
                        <a-col :span="10">
                            <a-input v-model:value="item.key" placeholder="属性名，如 color" />
                        </a-col>
                        <a-col :span="10">
                            <a-input v-model:value="item.value" placeholder="属性值，如 red" />
                        </a-col>
                        <a-col :span="4">
                            <a-space>
                                <a-button danger @click="removeAttrRow(index)" :disabled="baseForm.attributesKv.length <= 1">删除</a-button>
                                <a-button type="dashed" @click="addAttrRow" v-if="index === baseForm.attributesKv.length - 1">新增</a-button>
                            </a-space>
                        </a-col>
                    </a-row>
                </a-space>

                <a-row :gutter="16" style="margin-top: 12px">
                    <a-col :span="6">
                        <a-form-item label="是否新品">
                            <a-switch :checked="baseForm.isNew === 1" @change="(v:boolean)=>baseForm.isNew=v?1:0" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="是否热门">
                            <a-switch :checked="baseForm.isHot === 1" @change="(v:boolean)=>baseForm.isHot=v?1:0" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item>
                    <a-space>
                        <a-button type="primary" :loading="submitting" @click="handleSubmit">
                            {{ activeTab === 'SINGLE' ? '创建单卡商品' : '创建组合卡商品' }}
                        </a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>
    </div>
</template>

<style scoped>
.page-wrap {
    padding: 16px;
}
</style>
