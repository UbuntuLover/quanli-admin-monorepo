<template>
    <Page auto-content-height>
        <div class="order-page">
            <!-- 搜索区域 -->
            <a-card class="mb-4" :bordered="false">
                <a-form
                    ref="formRef"
                    :model="searchForm"
                    layout="inline"
                    class="search-form"
                >
                    <a-form-item label="订单号" name="orderNo">
                        <a-input
                            v-model:value="searchForm.orderNo"
                            allow-clear
                            placeholder="请输入订单号"
                            style="width: 220px"
                            @press-enter="handleSearch"
                        />
                    </a-form-item>

                    <a-form-item label="手机号" name="phone">
                        <a-input
                            v-model:value="searchForm.phone"
                            allow-clear
                            placeholder="请输入手机号"
                            style="width: 180px"
                            @press-enter="handleSearch"
                        />
                    </a-form-item>

                    <a-form-item label="会员ID" name="memberId">
                        <a-input-number
                            v-model:value="searchForm.memberId"
                            :min="1"
                            placeholder="会员ID"
                            style="width: 140px"
                        />
                    </a-form-item>

                    <a-form-item label="订单状态" name="status">
                        <a-select
                            v-model:value="searchForm.status"
                            allow-clear
                            placeholder="全部状态"
                            style="width: 150px"
                        >
                            <a-select-option
                                v-for="item in orderStatusOptions"
                                :key="item.value"
                                :value="item.value"
                            >
                                {{ item.label }}
                            </a-select-option>
                        </a-select>
                    </a-form-item>

                    <a-form-item label="支付状态" name="payStatus">
                        <a-select
                            v-model:value="searchForm.payStatus"
                            allow-clear
                            placeholder="全部支付状态"
                            style="width: 150px"
                        >
                            <a-select-option
                                v-for="item in payStatusOptions"
                                :key="item.value"
                                :value="item.value"
                            >
                                {{ item.label }}
                            </a-select-option>
                        </a-select>
                    </a-form-item>

                    <a-form-item label="订单类型" name="orderType">
                        <a-select
                            v-model:value="searchForm.orderType"
                            allow-clear
                            placeholder="全部类型"
                            style="width: 150px"
                        >
                            <a-select-option
                                v-for="item in orderTypeOptions"
                                :key="item.value"
                                :value="item.value"
                            >
                                {{ item.label }}
                            </a-select-option>
                        </a-select>
                    </a-form-item>

                    <a-form-item label="下单时间" name="dateRange">
                        <a-range-picker
                            v-model:value="dateRange"
                            show-time
                            value-format="YYYY-MM-DD HH:mm:ss"
                            style="width: 360px"
                        />
                    </a-form-item>

                    <a-form-item>
                        <a-space>
                            <a-button type="primary" :loading="loading" @click="handleSearch">
                                查询
                            </a-button>
                            <a-button @click="handleReset">重置</a-button>
                        </a-space>
                    </a-form-item>
                </a-form>
            </a-card>

            <!-- 表格区域 -->
            <a-card :bordered="false">
                <template #title>
                    <div class="card-title">
                        <span>订单列表</span>
                        <a-tag color="blue">共 {{ pagination.total }} 条</a-tag>
                    </div>
                </template>

                <a-table
                    row-key="id"
                    :columns="columns"
                    :data-source="tableData"
                    :loading="loading"
                    :pagination="pagination"
                    :scroll="{ x: 1500 }"
                    @change="handleTableChange"
                >
                    <template #bodyCell="{ column, record }">
                        <!-- 订单信息 -->
                        <template v-if="column.key === 'orderInfo'">
                            <div class="order-info">
                                <a-button
                                    type="link"
                                    class="order-no"
                                    @click="handleViewDetail(record)"
                                >
                                    {{ record.orderNo }}
                                </a-button>
                                <div class="order-title">
                                    {{ record.title || '-' }}
                                </div>
                            </div>
                        </template>

                        <!-- 用户信息 -->
                        <template v-else-if="column.key === 'memberInfo'">
                            <div>
                                <div>会员ID：{{ record.memberId }}</div>
                                <div class="text-secondary">
                                    {{ record.memberName || '-' }}
                                </div>
                                <div class="text-secondary">
                                    {{ record.phone || '-' }}
                                </div>
                            </div>
                        </template>

                        <!-- 订单类型 -->
                        <template v-else-if="column.key === 'orderType'">
                            <a-tag :color="getOrderTypeColor(record.orderType)">
                                {{ record.orderTypeDesc || record.orderType || '-' }}
                            </a-tag>
                        </template>

                        <!-- 订单状态 -->
                        <template v-else-if="column.key === 'status'">
                            <a-tag :color="getOrderStatusColor(record.status)">
                                {{ record.statusDesc || record.status || '-' }}
                            </a-tag>
                        </template>

                        <!-- 支付状态 -->
                        <template v-else-if="column.key === 'payStatus'">
                            <a-tag :color="getPayStatusColor(record.payStatus)">
                                {{ record.payStatusDesc || record.payStatus || '-' }}
                            </a-tag>
                        </template>

                        <!-- 金额 -->
                        <template v-else-if="column.key === 'amount'">
                            <div class="amount">
                                ￥{{ formatAmount(record.finalAmount ?? record.paidAmount ?? record.totalAmount) }}
                            </div>
                            <div class="text-secondary">
                                原价：￥{{ formatAmount(record.totalAmount) }}
                            </div>
                        </template>

                        <!-- 拼团 -->
                        <template v-else-if="column.key === 'groupBuy'">
                            <a-tag v-if="record.isGroupBuy === 1" color="purple">
                                拼团
                            </a-tag>
                            <span v-else>-</span>
                        </template>

                        <!-- 退款状态 -->
                        <template v-else-if="column.key === 'refundStatus'">
                            <a-tag
                                v-if="record.refundStatus !== undefined && record.refundStatus !== null"
                                :color="getRefundStatusColor(record.refundStatus)"
                            >
                                {{ record.refundStatusDesc || getRefundStatusText(record.refundStatus) }}
                            </a-tag>
                            <span v-else>-</span>
                        </template>

                        <!-- 创建时间 -->
                        <template v-else-if="column.key === 'createdAt'">
                            {{ record.createdAt || '-' }}
                        </template>

                        <!-- 操作 -->
                        <template v-else-if="column.key === 'action'">
                            <a-space>
                                <a-button type="link" @click="handleViewDetail(record)">
                                    详情
                                </a-button>

                                <a-dropdown>
                                    <a-button type="link">
                                        更多
                                        <DownOutlined/>
                                    </a-button>

                                    <template #overlay>
                                        <a-menu>
                                            <a-menu-item
                                                v-if="canCancel(record)"
                                                @click="handleCancelOrder(record)"
                                            >
                                                取消订单
                                            </a-menu-item>

                                            <a-menu-item
                                                v-if="canClose(record)"
                                                @click="handleCloseOrder(record)"
                                            >
                                                关闭订单
                                            </a-menu-item>

                                            <a-menu-item
                                                v-if="canFinish(record)"
                                                @click="handleFinishOrder(record)"
                                            >
                                                完成订单
                                            </a-menu-item>

                                            <a-menu-item
                                                v-if="!canCancel(record) && !canClose(record) && !canFinish(record)"
                                                disabled
                                            >
                                                暂无可用操作
                                            </a-menu-item>
                                        </a-menu>
                                    </template>
                                </a-dropdown>
                            </a-space>
                        </template>
                    </template>
                </a-table>
            </a-card>
        </div>
    </Page>
</template>

<script setup lang="ts">
import type {TablePaginationConfig} from 'ant-design-vue';
import {
    Button as AButton,
    Card as ACard,
    Dropdown as ADropdown,
    Form as AForm,
    Input as AInput,
    InputNumber as AInputNumber,
    Menu as AMenu,
    message,
    Modal,
    RangePicker as ARangePicker,
    Select as ASelect,
    Space as ASpace,
    Table as ATable,
    Tag as ATag,
} from 'ant-design-vue';
import type {AdminOrderListItem, AdminOrderListRequest,} from '#/api/order/order';
import {
    cancelAdminOrder,
    closeAdminOrder,
    finishAdminOrder,
    getAdminOrderPage,
} from '#/api/order/order';

import {computed, reactive, ref} from 'vue';
import { useRouter } from 'vue-router';

import {Page} from '@vben/common-ui';

import {DownOutlined} from '@ant-design/icons-vue';

const AFormItem = AForm.Item;
const ASelectOption = ASelect.Option;
const AMenuItem = AMenu.Item;

const router = useRouter();

/**
 * 如果你的 order.ts 不在 #/api/order，
 * 请改成你的实际路径，例如：
 * import { xxx } from '#/api/system/order';
 */

defineOptions({
    name: 'AdminOrderList',
});

/** ===================== 搜索表单 ===================== */

interface SearchFormState {
    orderNo?: string;
    memberId?: number;
    phone?: string;
    status?: string;
    payStatus?: string;
    orderType?: string;
}

const formRef = ref();

const searchForm = reactive<SearchFormState>({
    orderNo: undefined,
    memberId: undefined,
    phone: undefined,
    status: undefined,
    payStatus: undefined,
    orderType: undefined,
});

const dateRange = ref<string[]>([]);

/** ===================== 表格数据 ===================== */

const loading = ref(false);
const tableData = ref<AdminOrderListItem[]>([]);

const pagination = reactive<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
});

/** ===================== 选项配置 ===================== */

/**
 * 这里的 value 需要与你后端枚举保持一致。
 * 如果后端使用 PENDING/PAID/CANCELLED 这类字符串，可以直接用。
 * 如果后端使用数字状态，请把 value 改成对应数字或字符串。
 */
const orderStatusOptions = [
    {label: '待支付', value: 'PENDING'},
    {label: '已支付', value: 'PAID'},
    {label: '已完成', value: 'FINISHED'},
    {label: '已取消', value: 'CANCELLED'},
    {label: '已关闭', value: 'CLOSED'},
];

const payStatusOptions = [
    {label: '未支付', value: 'UNPAID'},
    {label: '已支付', value: 'PAID'},
    {label: '已退款', value: 'REFUNDED'},
    {label: '部分退款', value: 'PARTIAL_REFUNDED'},
];

const orderTypeOptions = [
    {label: '普通订单', value: 'NORMAL'},
    {label: '商品订单', value: 'PRODUCT'},
    {label: '课程订单', value: 'COURSE'},
    {label: '活动订单', value: 'ACTIVITY'},
    {label: '会员订单', value: 'MEMBER'},
];

/** ===================== 表格列 ===================== */

const columns = computed(() => [
    {
        title: '订单信息',
        key: 'orderInfo',
        width: 260,
        fixed: 'left',
    },
    {
        title: '用户信息',
        key: 'memberInfo',
        width: 180,
    },
    {
        title: '订单类型',
        key: 'orderType',
        width: 120,
    },
    {
        title: '订单状态',
        key: 'status',
        width: 120,
    },
    {
        title: '支付状态',
        key: 'payStatus',
        width: 120,
    },
    {
        title: '金额',
        key: 'amount',
        width: 140,
    },
    {
        title: '拼团',
        key: 'groupBuy',
        width: 100,
    },
    {
        title: '退款状态',
        key: 'refundStatus',
        width: 120,
    },
    {
        title: '创建时间',
        key: 'createdAt',
        width: 180,
    },
    {
        title: '操作',
        key: 'action',
        width: 160,
        fixed: 'right',
    },
]);

/** ===================== 数据加载 ===================== */

async function loadData() {
    loading.value = true;

    try {
        const params: AdminOrderListRequest = {
            pageNum: pagination.current || 1,
            pageSize: pagination.pageSize || 10,
            orderNo: searchForm.orderNo,
            memberId: searchForm.memberId,
            phone: searchForm.phone,
            status: searchForm.status,
            payStatus: searchForm.payStatus,
            orderType: searchForm.orderType,
            startTime: dateRange.value?.[0],
            endTime: dateRange.value?.[1],
        };

        /**
         * 兼容你的 ApiResponse<T>：
         * {
         *   code: number;
         *   message: string;
         *   data: {
         *     total: number;
         *     records: AdminOrderListItem[];
         *   }
         * }
         */
        const pageData = await getAdminOrderPage(clearEmptyParams(params));
        console.log(pageData);

        tableData.value = pageData?.orders || [];
        pagination.total = pageData?.total || 0;
    } catch (error) {
        console.error(error);
        message.error('订单列表加载失败');
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    pagination.current = 1;
    loadData();
}

function handleReset() {
    searchForm.orderNo = undefined;
    searchForm.memberId = undefined;
    searchForm.phone = undefined;
    searchForm.status = undefined;
    searchForm.payStatus = undefined;
    searchForm.orderType = undefined;
    dateRange.value = [];

    pagination.current = 1;
    loadData();
}

function handleTableChange(page: TablePaginationConfig) {
    pagination.current = page.current || 1;
    pagination.pageSize = page.pageSize || 10;
    loadData();
}

/** ===================== 订单详情 ===================== */

async function handleViewDetail(record: AdminOrderListItem) {
    router.push({
        name: 'OrderDetail',
        params: { orderNo: record.orderNo },
    });
}

/** ===================== 订单操作 ===================== */

function canCancel(record: AdminOrderListItem) {
    return (
        record.payStatus === 'UNPAID' &&
        !['CANCELLED', 'CLOSED', 'FINISHED'].includes(record.status)
    );
}

function canClose(record: AdminOrderListItem) {
    return !['CANCELLED', 'CLOSED', 'FINISHED'].includes(record.status);
}

function canFinish(record: AdminOrderListItem) {
    return (
        record.payStatus === 'PAID' &&
        !['CANCELLED', 'CLOSED', 'FINISHED'].includes(record.status)
    );
}

function handleCancelOrder(record: AdminOrderListItem) {
    Modal.confirm({
        title: '确认取消订单？',
        content: `订单号：${record.orderNo}`,
        okText: '确认取消',
        cancelText: '再想想',
        async onOk() {
            try {
                await cancelAdminOrder(record.orderNo);
                message.success('订单已取消');
                loadData();
            } catch (error) {
                console.error(error);
                message.error('取消订单失败');
            }
        },
    });
}

function handleCloseOrder(record: AdminOrderListItem) {
    Modal.confirm({
        title: '确认关闭订单？',
        content: `订单号：${record.orderNo}`,
        okText: '确认关闭',
        cancelText: '再想想',
        async onOk() {
            try {
                await closeAdminOrder(record.orderNo);
                message.success('订单已关闭');
                loadData();
            } catch (error) {
                console.error(error);
                message.error('关闭订单失败');
            }
        },
    });
}

function handleFinishOrder(record: AdminOrderListItem) {
    Modal.confirm({
        title: '确认完成订单？',
        content: `订单号：${record.orderNo}`,
        okText: '确认完成',
        cancelText: '再想想',
        async onOk() {
            try {
                await finishAdminOrder(record.orderNo);
                message.success('订单已完成');
                loadData();
            } catch (error) {
                console.error(error);
                message.error('完成订单失败');
            }
        },
    });
}

/** ===================== 展示工具函数 ===================== */

function formatAmount(value?: number) {
    if (value === undefined || value === null) {
        return '0.00';
    }

    return Number(value).toFixed(2);
}

function getOrderStatusColor(status?: string) {
    const map: Record<string, string> = {
        PENDING: 'orange',
        PAID: 'blue',
        FINISHED: 'green',
        CANCELLED: 'default',
        CLOSED: 'default',
    };

    return status ? map[status] || 'default' : 'default';
}

function getPayStatusColor(status?: string) {
    const map: Record<string, string> = {
        UNPAID: 'orange',
        PAID: 'green',
        REFUNDED: 'red',
        PARTIAL_REFUNDED: 'purple',
    };

    return status ? map[status] || 'default' : 'default';
}

function getOrderTypeColor(type?: string) {
    const map: Record<string, string> = {
        NORMAL: 'blue',
        PRODUCT: 'cyan',
        COURSE: 'purple',
        ACTIVITY: 'magenta',
        MEMBER: 'gold',
    };

    return type ? map[type] || 'blue' : 'blue';
}

function getRefundStatusColor(status?: number) {
    const map: Record<number, string> = {
        0: 'default',
        1: 'orange',
        2: 'green',
        3: 'red',
    };

    return status !== undefined ? map[status] || 'default' : 'default';
}

function getRefundStatusText(status?: number) {
    const map: Record<number, string> = {
        0: '未退款',
        1: '退款中',
        2: '已退款',
        3: '退款失败',
    };

    return status !== undefined ? map[status] || '-' : '-';
}

function clearEmptyParams<T extends Record<string, any>>(params: T): T {
    const result: Record<string, any> = {};

    Object.keys(params).forEach((key) => {
        const value = params[key];

        if (value !== undefined && value !== null && value !== '') {
            result[key] = value;
        }
    });

    return result as T;
}

/** 首次加载 */
loadData();
</script>

<style scoped>
.order-page {
    padding: 16px;
}

.mb-4 {
    margin-bottom: 16px;
}

.search-form {
    row-gap: 16px;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.order-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.order-no {
    height: auto;
    padding: 0;
    font-weight: 500;
    line-height: 1.5;
    text-align: left;
}

.order-title {
    margin-top: 4px;
    color: var(--color-text-secondary);
    font-size: 12px;
    line-height: 1.5;
}

.text-secondary {
    color: var(--color-text-secondary);
    font-size: 12px;
}

.amount {
    color: var(--color-text);
    font-weight: 600;
}

.detail-section-title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
}

.product-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.sku-image {
    flex-shrink: 0;
    object-fit: cover;
    border-radius: 4px;
}
</style>
