<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    Divider as ADivider,
    Image as AImage,
    Modal as AModal,
    PageHeader as APageHeader,
    Row as ARow,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    message,
} from 'ant-design-vue';

import {
    getAdminOrderDetail,
    cancelAdminOrder,
    closeAdminOrder,
    finishAdminOrder,
    type AdminOrderDetailVO,
    type AdminOrderItemVO,
    type GroupBuyOrderInfo,
} from '#/api/order/order';

defineOptions({ name: 'OrderDetail' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const orderDetail = ref<AdminOrderDetailVO | null>(null);
const orderItems = ref<AdminOrderItemVO[]>([]);
const groupBuyInfo = ref<GroupBuyOrderInfo | null>(null);

const orderNo = computed(() => {
    return String(route.params.orderNo || '');
});

function formatMoney(amount: number | undefined): string {
    if (!amount) return '-';
    return `¥${(amount / 100).toFixed(2)}`;
}

function formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const date = dayjs(dateStr);
    return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : dateStr;
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const date = dayjs(dateStr);
    return date.isValid() ? date.format('YYYY-MM-DD') : dateStr;
}

function statusColor(status: string): string {
    switch (status) {
        case 'PENDING_PAY': return 'warning';
        case 'PAID': return 'success';
        case 'SHIPPED': return 'info';
        case 'COMPLETED': return 'success';
        case 'CANCELLED': return 'default';
        case 'CLOSED': return 'default';
        default: return 'default';
    }
}

function payStatusColor(payStatus: string): string {
    switch (payStatus) {
        case 'UNPAID': return 'warning';
        case 'PAID': return 'success';
        case 'PARTIAL_REFUNDED': return 'orange';
        case 'FULL_REFUNDED': return 'default';
        default: return 'default';
    }
}

function orderTypeText(orderType: string): string {
    switch (orderType) {
        case 'NORMAL': return '普通订单';
        case 'GROUP_BUY': return '团购订单';
        default: return orderType;
    }
}

async function loadOrderDetail(orderNo: string) {
    loading.value = true;
    try {
        const res = await getAdminOrderDetail(orderNo);
        if (res) {
            orderDetail.value = res.order;
            orderItems.value = res.items || [];
            groupBuyInfo.value = res.groupBuyInfo || null;
        }
    } catch (e: any) {
        message.error(e?.message || '加载订单详情失败');
    } finally {
        loading.value = false;
    }
}

function handleBack() {
    router.push({ name: 'OrderList' });
}

async function handleCancel() {
    if (!orderDetail.value) return;

    AModal.confirm({
        title: '确认取消订单',
        content: `确定要取消订单 ${orderDetail.value.orderNo} 吗？`,
        okText: '确认取消',
        cancelText: '取消',
        async onOk() {
            try {
                await cancelAdminOrder(orderDetail.value!.orderNo);
                message.success('订单已取消');
                loadOrderDetail(orderDetail.value!.orderNo);
            } catch (e: any) {
                message.error(e?.message || '取消订单失败');
            }
        },
    });
}

async function handleClose() {
    if (!orderDetail.value) return;

    AModal.confirm({
        title: '确认关闭订单',
        content: `确定要关闭订单 ${orderDetail.value.orderNo} 吗？`,
        okText: '确认关闭',
        cancelText: '取消',
        async onOk() {
            try {
                await closeAdminOrder(orderDetail.value!.orderNo);
                message.success('订单已关闭');
                loadOrderDetail(orderDetail.value!.orderNo);
            } catch (e: any) {
                message.error(e?.message || '关闭订单失败');
            }
        },
    });
}

async function handleFinish() {
    if (!orderDetail.value) return;

    AModal.confirm({
        title: '确认完成订单',
        content: `确定要完成订单 ${orderDetail.value.orderNo} 吗？`,
        okText: '确认完成',
        cancelText: '取消',
        async onOk() {
            try {
                await finishAdminOrder(orderDetail.value!.orderNo);
                message.success('订单已完成');
                loadOrderDetail(orderDetail.value!.orderNo);
            } catch (e: any) {
                message.error(e?.message || '完成订单失败');
            }
        },
    });
}

const canCancel = computed(() => {
    if (!orderDetail.value) return false;
    return orderDetail.value.status === 'PENDING_PAY';
});

const canClose = computed(() => {
    if (!orderDetail.value) return false;
    return orderDetail.value.status === 'PAID' || orderDetail.value.status === 'SHIPPED';
});

const canFinish = computed(() => {
    if (!orderDetail.value) return false;
    return orderDetail.value.status === 'SHIPPED';
});

const columns = computed(() => [
    {
        title: '商品名称',
        dataIndex: 'productName',
        key: 'productName',
        width: 200,
    },
    {
        title: 'SKU',
        dataIndex: 'skuName',
        key: 'skuName',
        width: 200,
        ellipsis: true,
    },
    {
        title: '规格属性',
        dataIndex: 'attributes',
        key: 'attributes',
        width: 150,
        customRender: ({ record }) => ({
            children: record.attributes
                ? Object.entries(record.attributes)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')
                : '-',
        }),
    },
    {
        title: '单价',
        dataIndex: 'unitPrice',
        key: 'unitPrice',
        width: 100,
        align: 'right',
        customRender: ({ record }) => ({
            children: formatMoney(record.unitPrice),
        }),
    },
    {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 80,
        align: 'right',
    },
    {
        title: '小计',
        dataIndex: 'subtotal',
        key: 'subtotal',
        width: 100,
        align: 'right',
        customRender: ({ record }) => ({
            children: formatMoney(record.subtotal),
        }),
    },
    {
        title: '商品类型',
        dataIndex: 'productType',
        key: 'productType',
        width: 100,
    },
    {
        title: '激活状态',
        dataIndex: 'activationStatus',
        key: 'activationStatus',
        width: 100,
        customRender: ({ record }) => ({
            children: record.activationStatus === 'ACTIVATED' ? '已激活' : '未激活',
        }),
    },
]);

onMounted(async () => {
    if (orderNo.value) {
        await loadOrderDetail(orderNo.value);
    }
});
</script>

<template>
    <div class="order-detail-page">
        <a-page-header title="订单详情" @back="handleBack">
            <template #extra>
                <a-space v-if="orderDetail">
                    <a-button
                        v-if="canCancel"
                        danger
                        @click="handleCancel"
                    >
                        取消订单
                    </a-button>
                    <a-button
                        v-if="canClose"
                        @click="handleClose"
                    >
                        关闭订单
                    </a-button>
                    <a-button
                        v-if="canFinish"
                        type="primary"
                        @click="handleFinish"
                    >
                        完成订单
                    </a-button>
                    <a-button @click="handleBack">返回列表</a-button>
                </a-space>
            </template>
        </a-page-header>

        <a-spin :spinning="loading">
            <div v-if="orderDetail" class="p-4">
                <!-- 订单基本信息 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">基本信息</span>
                    </template>
                    <a-descriptions :column="2" bordered>
                        <a-descriptions-item label="订单编号">
                            <span class="font-mono">{{ orderDetail.orderNo }}</span>
                        </a-descriptions-item>
                        <a-descriptions-item label="订单类型">
                            {{ orderTypeText(orderDetail.orderType) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="订单状态">
                            <a-tag :color="statusColor(orderDetail.status)">
                                {{ orderDetail.statusDesc || orderDetail.status }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="支付状态">
                            <a-tag :color="payStatusColor(orderDetail.payStatus)">
                                {{ orderDetail.payStatusDesc || orderDetail.payStatus }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="会员ID">
                            {{ orderDetail.memberId }}
                        </a-descriptions-item>
                        <a-descriptions-item label="会员名称">
                            {{ orderDetail.memberName || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="联系电话">
                            {{ orderDetail.phone || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="团购订单">
                            {{ orderDetail.isGroupBuy === 1 ? '是' : '否' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="订单标题">
                            {{ orderDetail.title || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="支付方式">
                            {{ orderDetail.paymentMethod || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="支付时间">
                            {{ formatDateTime(orderDetail.paymentTime) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="线下支付">
                            {{ orderDetail.isOfflinePayment === 1 ? '是' : '否' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="创建时间">
                            {{ formatDateTime(orderDetail.createdAt) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="更新时间">
                            {{ formatDateTime(orderDetail.updatedAt) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="订单备注">
                            {{ orderDetail.remark || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="过期时间">
                            {{ formatDateTime(orderDetail.expireTime) }}
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>

                <!-- 金额信息 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">金额信息</span>
                    </template>
                    <a-descriptions :column="2" bordered>
                        <a-descriptions-item label="订单总额">
                            <span class="text-lg font-semibold">{{ formatMoney(orderDetail.totalAmount) }}</span>
                        </a-descriptions-item>
                        <a-descriptions-item label="已支付金额">
                            {{ formatMoney(orderDetail.paidAmount) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="优惠金额">
                            {{ formatMoney(orderDetail.discountAmount) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="优惠券优惠">
                            {{ formatMoney(orderDetail.couponDiscountAmount) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="使用优惠券数量">
                            {{ orderDetail.usedCouponCount }} 张
                        </a-descriptions-item>
                        <a-descriptions-item label="实际支付">
                            <span class="text-lg font-semibold text-red-500">{{ formatMoney(orderDetail.finalAmount) }}</span>
                        </a-descriptions-item>
                        <a-descriptions-item label="退款状态">
                            <a-tag :color="orderDetail.refundStatus === 0 ? 'default' : 'orange'">
                                {{ orderDetail.refundStatusDesc || (orderDetail.refundStatus === 0 ? '无退款' : '已退款') }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="退款金额">
                            {{ formatMoney(orderDetail.refundedAmount) }}
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>

                <!-- 团购信息 -->
                <a-card v-if="groupBuyInfo" :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">团购信息</span>
                    </template>
                    <a-descriptions :column="2" bordered>
                        <a-descriptions-item label="活动ID">
                            {{ groupBuyInfo.activityId }}
                        </a-descriptions-item>
                        <a-descriptions-item label="活动名称">
                            {{ groupBuyInfo.activityName }}
                        </a-descriptions-item>
                        <a-descriptions-item label="活动状态">
                            <a-tag :color="groupBuyInfo.status === 'ACTIVE' ? 'success' : 'default'">
                                {{ groupBuyInfo.status === 'ACTIVE' ? '进行中' : '已结束' }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="成团人数">
                            {{ groupBuyInfo.minMembers }} 人
                        </a-descriptions-item>
                        <a-descriptions-item label="当前人数">
                            {{ groupBuyInfo.currentMembers }} 人
                        </a-descriptions-item>
                        <a-descriptions-item label="是否免费">
                            {{ groupBuyInfo.isFree ? '是' : '否' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="活动结束时间">
                            {{ formatDateTime(groupBuyInfo.endTime) }}
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>

                <!-- 订单商品列表 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">商品列表</span>
                    </template>
                    <a-table
                        :data-source="orderItems"
                        :columns="columns"
                        :pagination="false"
                        row-key="id"
                        :scroll="{ x: 1000 }"
                    />
                </a-card>
            </div>
        </a-spin>
    </div>
</template>

<style scoped>
.order-detail-page {
    width: 100%;
}

.font-mono {
    font-family: monospace;
}

.text-lg {
    font-size: 16px;
}

.font-semibold {
    font-weight: 600;
}

.text-red-500 {
    color: #ff4d4f;
}

.p-4 {
    padding: 16px;
}

.mb-4 {
    margin-bottom: 16px;
}
</style>