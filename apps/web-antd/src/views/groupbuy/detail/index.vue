<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    PageHeader as APageHeader,
    Row as ARow,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    Popconfirm as APopconfirm,
    message,
} from 'ant-design-vue';

import {
    getAdminGroupBuyActivityDetailApi,
    activateAdminGroupBuyActivityApi,
    deactivateAdminGroupBuyActivityApi,
    deleteAdminGroupBuyActivityApi,
    type AdminGroupBuyDetailDTO,
} from '#/api/products/group-buy-admin';

defineOptions({ name: 'GroupBuyDetail' });

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<AdminGroupBuyDetailDTO | null>(null);

// 状态颜色和文本
function statusColor(status: string) {
    switch (status) {
        case 'ACTIVE':
            return 'success';
        case 'INACTIVE':
            return 'default';
        default:
            return 'default';
    }
}

function statusText(status: string) {
    switch (status) {
        case 'ACTIVE':
            return '进行中';
        case 'INACTIVE':
            return '已停用';
        default:
            return '未知';
    }
}

function lotteryTypeText(type: string) {
    switch (type) {
        case 'GROUP_PRICE':
            return '团购价模式';
        case 'LEADER_FREE':
            return '团长免费模式';
        case 'RANDOM_ONE':
            return '随机免单模式';
        default:
            return type;
    }
}

function autoGroupText(enabled: number) {
    return enabled === 1 ? '已开启' : '未开启';
}

function refundDeadlineText(type: string) {
    switch (type) {
        case 'BEFORE_GROUP':
            return '成团前可退款';
        case 'AFTER_GROUP':
            return '成团后不可退款';
        default:
            return type;
    }
}

// 格式化函数
function formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const date = dayjs(dateStr);
    if (!date.isValid()) return dateStr;
    return date.format('YYYY 年 MM 月 DD 日 HH 时 mm 分 ss 秒');
}

function formatMoney(amount: number): string {
    return `¥${(amount / 100).toFixed(2)}`;
}

async function loadDetail(id: string) {
    loading.value = true;
    try {
        const data = await getAdminGroupBuyActivityDetailApi(id);
        // 手动确保id都是字符串类型
        if (data) {
            data.id = String(data.id);
        }
        detail.value = data;
    } catch (e: any) {
        message.error(e?.message || '加载活动详情失败');
    } finally {
        loading.value = false;
    }
}

async function handleActivate() {
    if (!detail.value) return;
    try {
        await activateAdminGroupBuyActivityApi(detail.value.id);
        message.success('启用成功');
        loadDetail(detail.value.id);
    } catch (e) {
        console.error(e);
    }
}

async function handleDeactivate() {
    if (!detail.value) return;
    try {
        await deactivateAdminGroupBuyActivityApi(detail.value.id);
        message.success('停用成功');
        loadDetail(detail.value.id);
    } catch (e) {
        console.error(e);
    }
}

async function handleDelete() {
    if (!detail.value) return;
    try {
        await deleteAdminGroupBuyActivityApi(detail.value.id);
        message.success('删除成功');
        router.push({ name: 'GroupBuyList' });
    } catch (e) {
        console.error(e);
    }
}

function handleBack() {
    router.push({ name: 'GroupBuyList' });
}

onMounted(() => {
    const id = route.query.id;
    if (id) {
        loadDetail(String(id));
    } else {
        message.error('活动ID不存在');
        router.push({ name: 'GroupBuyList' });
    }
});
</script>

<template>
    <div class="groupbuy-detail-page">
        <a-spin :spinning="loading">
            <a-page-header title="团购活动详情" @back="handleBack">
                <template #extra>
                    <a-space>
                        <a-button
                            v-if="detail && detail.status === 'INACTIVE'"
                            type="primary"
                            @click="handleActivate"
                        >
                            启用活动
                        </a-button>
                        <a-button
                            v-if="detail && detail.status === 'ACTIVE'"
                            @click="handleDeactivate"
                        >
                            停用活动
                        </a-button>
                        <a-popconfirm
                            title="确认删除该活动？"
                            @confirm="handleDelete"
                        >
                            <a-button danger>删除活动</a-button>
                        </a-popconfirm>
                        <a-button @click="handleBack">返回列表</a-button>
                    </a-space>
                </template>
            </a-page-header>

            <div v-if="detail" class="p-4">
                <!-- 基本信息卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">基本信息</span>
                    </template>

                    <a-row :gutter="24">
                        <a-col :xs="24" :md="18">
                            <a-descriptions :column="2" bordered>
                                <a-descriptions-item label="活动名称" :span="2">
                                    <div class="flex items-center gap-2">
                                        {{ detail.name }}
                                        <a-tag :color="statusColor(detail.status)">
                                            {{ statusText(detail.status) }}
                                        </a-tag>
                                    </div>
                                </a-descriptions-item>
                                <a-descriptions-item label="活动ID">
                                    {{ detail.id }}
                                </a-descriptions-item>
                                <a-descriptions-item label="活动模式">
                                    {{ lotteryTypeText(detail.lotteryType) }}
                                </a-descriptions-item>
                                <a-descriptions-item label="商品名称">
                                    {{ detail.productName }}
                                </a-descriptions-item>
                                <a-descriptions-item label="SKU">
                                    {{ detail.skuName || '无规格' }}
                                </a-descriptions-item>
                            </a-descriptions>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div v-if="detail.productImage" class="product-image-wrap">
                                <img :src="detail.productImage" alt="商品图片" class="product-image" />
                            </div>
                            <div v-else class="product-image-wrap product-image-placeholder">
                                暂无图片
                            </div>
                        </a-col>
                    </a-row>
                </a-card>

                <!-- 价格信息卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">价格设置</span>
                    </template>

                    <a-row :gutter="16">
                        <a-col :xs="24" :md="8">
                            <div class="stat-item">
                                <div class="stat-label">原价</div>
                                <div class="stat-value text-gray-500">
                                    {{ formatMoney(detail.originalPrice) }}
                                </div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="8">
                            <div class="stat-item">
                                <div class="stat-label">团购价</div>
                                <div class="stat-value text-blue-500">
                                    {{ formatMoney(detail.groupPrice) }}
                                </div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="8">
                            <div class="stat-item">
                                <div class="stat-label">优惠金额</div>
                                <div class="stat-value text-red-500">
                                    -{{ formatMoney(detail.originalPrice - detail.groupPrice) }}
                                </div>
                            </div>
                        </a-col>
                    </a-row>
                </a-card>

                <!-- 成团设置卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">成团设置</span>
                    </template>

                    <a-descriptions :column="3" bordered>
                        <a-descriptions-item label="最小成团人数">
                            {{ detail.minPeople }} 人
                        </a-descriptions-item>
                        <a-descriptions-item label="最大成团人数">
                            {{ detail.maxPeople }} 人
                        </a-descriptions-item>
                        <a-descriptions-item label="成团过期时间">
                            {{ detail.expireHours }} 小时
                        </a-descriptions-item>
                        <a-descriptions-item label="自动成团">
                            <a-tag :color="detail.autoGroupEnabled === 1 ? 'success' : 'default'">
                                {{ autoGroupText(detail.autoGroupEnabled) }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="退款截止" :span="2">
                            {{ refundDeadlineText(detail.refundDeadLineType) }}
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>

                <!-- 统计数据卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">活动数据</span>
                    </template>

                    <a-row :gutter="16">
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">报名人数</div>
                                <div class="stat-value">{{ detail.signupCount }}</div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">成团数</div>
                                <div class="stat-value text-green-500">{{ detail.groupCount }}</div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">失败团数</div>
                                <div class="stat-value text-red-500">{{ detail.failGroupCount }}</div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">成功率</div>
                                <div class="stat-value">
                                    {{ detail.groupCount + detail.failGroupCount > 0
                                        ? `${Math.round((detail.groupCount / (detail.groupCount + detail.failGroupCount)) * 100)}%`
                                        : '-' }}
                                </div>
                            </div>
                        </a-col>
                    </a-row>
                </a-card>

                <!-- 时间信息卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">时间信息</span>
                    </template>

                    <a-descriptions :column="2" bordered>
                        <a-descriptions-item label="活动开始时间">
                            {{ formatDateTime(detail.startTime) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="活动结束时间">
                            {{ formatDateTime(detail.endTime) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="创建时间">
                            {{ formatDateTime(detail.createdAt) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="更新时间">
                            {{ formatDateTime(detail.updatedAt) }}
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>
            </div>
        </a-spin>
    </div>
</template>

<style scoped>
.groupbuy-detail-page {
    width: 100%;
}

.product-image-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 160px;
    background: var(--color-bg-container);
    border-radius: 8px;
    border: 1px solid var(--ant-color-border-secondary, rgba(120, 120, 120, 0.25));
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
}

.product-image-placeholder {
    color: var(--color-text-secondary);
}

.stat-item {
    padding: 16px;
    text-align: center;
    background: var(--color-bg-container);
    border-radius: 8px;
    border: 1px solid var(--ant-color-border-secondary, rgba(120, 120, 120, 0.25));
}

.stat-label {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
}

.stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text);
}

.text-gray-500 {
    color: #8c8c8c;
}

.text-blue-500 {
    color: #1890ff;
}

.text-red-500 {
    color: #ff4d4f;
}

.text-green-500 {
    color: #52c41a;
}
</style>
