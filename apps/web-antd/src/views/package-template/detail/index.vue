<template>
    <div class="package-template-detail">
        <a-page-header title="权益卡详情" @back="handleBack">
            <template #extra>
                <a-space>
                    <a-button v-if="templateDetail" @click="handleToggleStatus">
                        {{ templateDetail.isOnSale === 1 ? '下架' : '上架' }}
                    </a-button>
                    <a-button @click="handleCopy">复制模板</a-button>
                    <a-button @click="handleEdit">编辑</a-button>
                    <a-popconfirm
                        title="确定删除该模板吗？"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="handleDelete"
                    >
                        <a-button danger>删除</a-button>
                    </a-popconfirm>
                </a-space>
            </template>
        </a-page-header>

        <a-spin :spinning="loading">
            <a-card v-if="templateDetail" :bordered="false" class="detail-card">
                <template #title>
                    <div class="card-header">
                        <div class="card-title">
                            <a-tag :color="getCardTypeColor(templateDetail.cardType)">
                                {{ getCardTypeText(templateDetail.cardType) }}
                            </a-tag>
                            <span class="name">{{ templateDetail.name }}</span>
                            <a-tag v-if="templateDetail.isOnSale === 1" color="success">上架中</a-tag>
                            <a-tag v-else color="default">已下架</a-tag>
                        </div>
                    </div>
                </template>

                <a-descriptions :column="2" bordered>
                    <a-descriptions-item label="模板编号">
                        {{ templateDetail.templateNo }}
                    </a-descriptions-item>
                    <a-descriptions-item label="卡类型">
                        {{ getCardTypeText(templateDetail.cardType) }}
                    </a-descriptions-item>
                    <a-descriptions-item label="有效期">
                        {{ templateDetail.validityDays }}天
                    </a-descriptions-item>
                    <a-descriptions-item label="限购次数">
                        {{ (templateDetail as any).limitPerUser || '不限购' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="原价">
                        <span class="original-price">¥{{ formatMoney(templateDetail.originalPrice) }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="售价">
                        <span class="selling-price">¥{{ formatMoney(templateDetail.sellingPrice) }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item v-if="templateDetail.courseTimes" label="课程次数">
                        {{ templateDetail.courseTimes }}次
                    </a-descriptions-item>
                    <a-descriptions-item v-if="templateDetail.venueTimes" label="场地次数">
                        {{ templateDetail.venueTimes }}次
                    </a-descriptions-item>
                    <a-descriptions-item label="是否支持在线购买">
                        {{ (templateDetail as any).canOnlinePurchase === 1 ? '是' : '否' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="库存">
                        {{ (templateDetail as any).stock === -1 ? '无限' : ((templateDetail as any).stock ?? '-') }}
                    </a-descriptions-item>
                    <a-descriptions-item label="创建时间" :span="2">
                        {{ formatDateTime(templateDetail.createdAt) }}
                    </a-descriptions-item>
                    <a-descriptions-item v-if="(templateDetail as any).updatedAt" label="更新时间" :span="2">
                        {{ formatDateTime((templateDetail as any).updatedAt) }}
                    </a-descriptions-item>
                </a-descriptions>

                <a-divider/>

                <div class="price-summary">
                    <div class="price-card">
                        <div class="price-label">原价</div>
                        <div class="price-value original">¥{{ formatMoney(templateDetail.originalPrice) }}</div>
                    </div>
                    <div class="price-card">
                        <div class="price-label">售价</div>
                        <div class="price-value selling">¥{{ formatMoney(templateDetail.sellingPrice) }}</div>
                    </div>
                    <div class="price-card">
                        <div class="price-label">优惠金额</div>
                        <div class="price-value discount">
                            ¥{{ formatMoney((templateDetail.originalPrice || 0) - (templateDetail.sellingPrice || 0)) }}
                        </div>
                    </div>
                    <div v-if="templateDetail.originalPrice && templateDetail.sellingPrice" class="price-card">
                        <div class="price-label">折扣</div>
                        <div class="price-value discount">
                            {{ Math.round((templateDetail.sellingPrice / templateDetail.originalPrice) * 100) / 10 }}折
                        </div>
                    </div>
                </div>

                <a-divider/>

                <template v-if="templateDetail.description">
                    <h3 class="section-title">模板描述</h3>
                    <div class="description">
                        {{ templateDetail.description }}
                    </div>
                    <a-divider/>
                </template>

                <template v-if="getAssociatedCards().length">
                    <h3 class="section-title">
                        {{ templateDetail.cardType === 'COMBO' ? '包含子卡' : '关联权益' }}
                        ({{ getAssociatedCards().length }})
                    </h3>
                    <a-collapse class="card-collapse">
                        <a-collapse-panel
                            v-for="item in getAssociatedCards()"
                            :key="String(item.id || item.childTemplateId)"
                            :header="getCardHeader(item)"
                        >
                            <a-descriptions :column="2" bordered size="small">
                                <a-descriptions-item v-if="item.templateNo || item.childTemplateId" label="模板ID">
                                    {{ item.templateNo || item.childTemplateId }}
                                </a-descriptions-item>
                                <a-descriptions-item label="卡类型">
                                    {{ getCardTypeText(item.cardType || item.childType) }}
                                </a-descriptions-item>
                                <a-descriptions-item v-if="item.validityDays" label="有效期">
                                    {{ item.validityDays }}天
                                </a-descriptions-item>
                                <a-descriptions-item v-if="item.quantity" label="数量">
                                    {{ item.quantity }}
                                </a-descriptions-item>
                                <a-descriptions-item v-if="item.originalPrice != null" label="原价">
                                    <span class="original-price">¥{{ formatMoney(item.originalPrice) }}</span>
                                </a-descriptions-item>
                                <a-descriptions-item v-if="item.sellingPrice != null" label="售价">
                                    <span class="selling-price">¥{{ formatMoney(item.sellingPrice) }}</span>
                                </a-descriptions-item>
                                <a-descriptions-item v-if="item.courseTimes" label="课程次数">
                                    {{ item.courseTimes }}次
                                </a-descriptions-item>
                                <a-descriptions-item v-if="item.venueTimes" label="场地次数">
                                    {{ item.venueTimes }}次
                                </a-descriptions-item>
                            </a-descriptions>
                            <div style="margin-top: 16px;">
                                <a-button
                                    type="link"
                                    size="small"
                                    @click.stop="handleViewChild(item.id || item.childTemplateId)"
                                >
                                    查看完整详情 →
                                </a-button>
                            </div>
                        </a-collapse-panel>
                    </a-collapse>
                    <a-divider/>
                </template>
            </a-card>
        </a-spin>
    </div>
</template>

<script setup lang="ts">
import {h, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    Collapse as ACollapse,
    Descriptions as ADescriptions,
    Divider as ADivider,
    message,
    PageHeader as APageHeader,
    Popconfirm as APopconfirm,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
} from 'ant-design-vue';

const ADescriptionsItem = ADescriptions.Item;
const ACollapsePanel = ACollapse.Panel;

import {
    deletePackageTemplateApi,
    getChildrenOfComboApi,
    getPackageTemplateDetailApi,
    updatePackageTemplateStatusApi,
    type PackageTemplateDetailDTO, getPackageTemplateDetailRawApi, getChildrenOfComboRawApi,
} from '#/api/template/template';
import type { PackageTemplateCompositionDTO } from '#/api/template/template';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const templateDetail = ref<PackageTemplateDetailDTO | null>(null);
const childTemplates = ref<PackageTemplateCompositionDTO[]>([]);

function getCurrentRouteId(): string | null {
    const id = route.query.id;
    return id == null ? null : String(id);
}

async function fetchDetail(id: string) {
    loading.value = true;
    try {
        const res = await getPackageTemplateDetailApi(id);

        // 手动确保id都是字符串类型
        if (res) {
            if (res.id) {
                res.id = String(res.id);
            }
            // 处理可能存在的子卡数据
            if (Array.isArray((res as any).children)) {
                (res as any).children = (res as any).children.map((child: any) => ({
                    ...child,
                    id: child.id ? String(child.id) : child.id,
                    childTemplateId: child.childTemplateId ? String(child.childTemplateId) : child.childTemplateId,
                }));
            }
        }
        templateDetail.value = res || null;

        if (templateDetail.value?.cardType === 'COMBO') {
            const childrenRes = await getChildrenOfComboApi(id);
            // 确保子卡数据中的id都是字符串类型
            childTemplates.value = (childrenRes || []).map((child: any) => ({
                ...child,
                id: child.id ? String(child.id) : child.id,
                childTemplateId: child.childTemplateId ? String(child.childTemplateId) : child.childTemplateId,
            }));
        } else {
            childTemplates.value = [];
        }
    } catch (e: any) {
        message.error(e?.message || '获取详情失败');
        templateDetail.value = null;
        childTemplates.value = [];
    } finally {
        loading.value = false;
    }
}

function loadByRoute() {
    const id = getCurrentRouteId();
    if (!id) {
        templateDetail.value = null;
        childTemplates.value = [];
        return;
    }
    fetchDetail(id);
}

onMounted(loadByRoute);

watch(
    () => route.query.id,
    (newId, oldId) => {
        if (newId !== oldId && newId != null) {
            fetchDetail(String(newId));
        }
    },
);

function getAssociatedCards() {
    if (templateDetail.value?.cardType === 'COMBO' && childTemplates.value.length > 0) {
        return childTemplates.value;
    }
    return [];
}

function handleBack() {
    router.back();
}

function handleEdit() {
    if (!templateDetail.value) return;
    router.push({
        name: 'PackageTemplateEdit',
        query: {id: String(templateDetail.value.id), cardType: templateDetail.value.cardType},
    });
}

async function handleDelete() {
    if (!templateDetail.value) return;
    await deletePackageTemplateApi(String(templateDetail.value.id));
    message.success('删除成功');
    router.push({name: 'PackageTemplateInfo'});
}

async function handleToggleStatus() {
    if (!templateDetail.value) return;
    const newStatus = templateDetail.value.isOnSale === 1 ? 0 : 1;
    await updatePackageTemplateStatusApi(String(templateDetail.value.id), newStatus);
    templateDetail.value.isOnSale = newStatus;
    message.success(newStatus === 1 ? '模板已上架' : '模板已下架');
}

function handleCopy() {
    if (!templateDetail.value) return;
    router.push({
        name: 'PackageTemplateTemplate',
        query: {copyId: String(templateDetail.value.id), cardType: templateDetail.value.cardType},
    });
}

function handleViewChild(id: string) {
    router.push({
        name: 'PackageTemplateDetail',
        query: {id},
    });
}

function getCardHeader(item: any) {
    const cardType = item.cardType || item.childType || '-';
    const name = item.name || item.childTemplateName || item.displayName || '-';
    const quantityRaw = item.quantity;
    const quantityText = quantityRaw == null ? '' : String(quantityRaw);
    const showQuantity = quantityText !== '' && quantityText !== '0' && quantityText !== '1';
    const sellingPrice = item.sellingPrice;

    return h('div', {class: 'card-header-title'}, [
        h(ATag, {color: getCardTypeColor(cardType)}, {default: () => getCardTypeText(cardType)}),
        h('span', {class: 'card-name'}, name),
        showQuantity ? h('span', {class: 'card-quantity'}, ` ×${quantityText}`) : null,
        h('span', {class: 'card-price'}, sellingPrice != null ? `¥${formatMoney(sellingPrice)}` : ''),
    ]);
}

function formatMoney(value?: number | null): string {
    if (value == null) return '0.00';
    return (value / 100).toFixed(2);
}

function formatDateTime(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function getCardTypeColor(cardType: string): string {
    if (cardType === 'COURSE') return 'blue';
    if (cardType === 'VENUE') return 'green';
    if (cardType === 'COMBO') return 'purple';
    return 'default';
}

function getCardTypeText(cardType: string): string {
    if (cardType === 'COURSE') return '课程卡';
    if (cardType === 'VENUE') return '场地卡';
    if (cardType === 'COMBO') return '组合卡';
    return cardType || '-';
}
</script>

<style scoped>
.package-template-detail {
    padding: 16px;
}

.detail-card {
    margin-top: 16px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.card-title .name {
    font-size: 20px;
    font-weight: 600;
}

.price-summary {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.price-card {
    flex: 1;
    min-width: 140px;
    padding: 16px;
    background: var(--color-bg-container);
    border-radius: 8px;
    text-align: center;
}

.price-label {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
}

.price-value {
    font-size: 20px;
    font-weight: 600;
}

.price-value.original {
    color: var(--color-text-secondary);
    text-decoration: line-through;
}

.price-value.selling {
    color: #ff4d4f;
}

.price-value.discount {
    color: #52c41a;
}

.original-price {
    color: var(--color-text-secondary);
    text-decoration: line-through;
}

.selling-price {
    color: #ff4d4f;
    font-weight: 600;
    font-size: 16px;
}

.section-title {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 500;
}

.description {
    padding: 16px;
    background: var(--color-bg-container);
    border-radius: 8px;
    line-height: 1.8;
}

.card-collapse {
    margin-bottom: 8px;
}

.card-header-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.card-name {
    flex: 1;
    font-weight: 500;
}

.card-price {
    color: #ff4d4f;
    font-weight: 600;
}
</style>
