<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Empty as AEmpty,
    Input as AInput,
    Pagination as APagination,
    RangePicker as ARangePicker,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    Popconfirm as APopconfirm,
    Table as ATable,
    TableColumn as ATableColumn,
    message,
} from 'ant-design-vue';
import {
    getAdminGroupBuyActivityListApi,
    activateAdminGroupBuyActivityApi,
    deactivateAdminGroupBuyActivityApi,
    deleteAdminGroupBuyActivityApi,
    type AdminGroupBuyListDTO,
    type AdminGroupBuyQueryDTO,
} from '#/api/products/group-buy-admin';
import { normalizePageResult } from '#/api/_shared/page';

defineOptions({ name: 'GroupBuyList' });

const router = useRouter();
const loading = ref(false);
const list = ref<AdminGroupBuyListDTO[]>([]);
const pagination = ref({ page: 1, pageSize: 20, total: 0 });

// 筛选条件
const keyword = ref('');
const statusFilter = ref<string>('');
const lotteryTypeFilter = ref<string>('');
const timeRangeFilter = ref<[string, string] | null>(null);

// 选项数据
const statusOptions = [
    { label: '全部', value: '' },
    { label: '进行中', value: 'ACTIVE' },
    { label: '已停用', value: 'INACTIVE' },
];

const lotteryTypeOptions = [
    { label: '团购价模式', value: 'GROUP_PRICE' },
    { label: '团长免费模式', value: 'LEADER_FREE' },
    { label: '随机免单模式', value: 'RANDOM_ONE' },
];

const filteredList = computed(() => list.value);

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
            return '团购价';
        case 'LEADER_FREE':
            return '团长免费';
        case 'RANDOM_ONE':
            return '随机免单';
        default:
            return type;
    }
}

function getRowClassName(record: AdminGroupBuyListDTO): string {
    if (record.status === 'ACTIVE') {
        return 'row-status-active';
    } else if (record.status === 'INACTIVE') {
        return 'row-status-inactive';
    }
    return '';
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

async function fetchList() {
    loading.value = true;
    try {
        const params: AdminGroupBuyQueryDTO = {
            page: pagination.value.page,
            pageSize: pagination.value.pageSize,
            sortField: 'created_at',
            sortDirection: 'DESC',
        };
        if (keyword.value) params.name = keyword.value.trim();
        if (statusFilter.value) params.status = statusFilter.value;
        if (lotteryTypeFilter.value) params.lotteryType = lotteryTypeFilter.value;
        if (timeRangeFilter.value && timeRangeFilter.value[0] && timeRangeFilter.value[1]) {
            params.startTimeStart = timeRangeFilter.value[0];
            params.startTimeEnd = timeRangeFilter.value[1];
        }

        const res = await getAdminGroupBuyActivityListApi(params);
        const normalized = normalizePageResult(res);
        list.value = normalized.list;
        pagination.value.total = normalized.total;
    } finally {
        loading.value = false;
    }
}

function handlePageChange(page: number, pageSize: number) {
    pagination.value.page = page;
    pagination.value.pageSize = pageSize;
    fetchList();
}

function goCreate() {
    router.push({ name: 'GroupBuyCreate' });
}

function goDetail(id: string) {
    router.push({
        name: 'GroupBuyDetail',
        query: { id },
    });
}

async function handleActivate(id: string) {
    try {
        await activateAdminGroupBuyActivityApi(id);
        message.success('启用成功');
        fetchList();
    } catch (e) {
        console.error(e);
    }
}

async function handleDeactivate(id: string) {
    try {
        await deactivateAdminGroupBuyActivityApi(id);
        message.success('停用成功');
        fetchList();
    } catch (e) {
        console.error(e);
    }
}

async function handleDelete(id: string) {
    try {
        await deleteAdminGroupBuyActivityApi(id);
        message.success('删除成功');
        fetchList();
    } catch (e) {
        console.error(e);
    }
}

let searchTimer: ReturnType<typeof setTimeout>;
watch([keyword, statusFilter, lotteryTypeFilter, timeRangeFilter], () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        pagination.value.page = 1;
        fetchList();
    }, 300);
});

onMounted(fetchList);
</script>

<template>
    <div class="p-4 groupbuy-list-page">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">团购活动列表</div>
                        <div class="mt-1 text-xs text-gray-400">管理后台团购活动管理</div>
                    </div>
                    <a-space>
                        <a-button :loading="loading" @click="fetchList">刷新</a-button>
                        <a-button type="primary" @click="goCreate">创建活动</a-button>
                    </a-space>
                </div>
            </template>

            <div class="mb-4">
                <a-row :gutter="[12, 12]">
                    <a-col :xs="24" :md="6">
                        <a-input
                            v-model:value="keyword"
                            allow-clear
                            placeholder="搜索活动名称"
                        />
                    </a-col>
                    <a-col :xs="24" :md="5">
                        <a-select
                            v-model:value="statusFilter"
                            placeholder="按状态筛选"
                            style="width: 100%"
                            :options="statusOptions"
                        />
                    </a-col>
                    <a-col :xs="24" :md="5">
                        <a-select
                            v-model:value="lotteryTypeFilter"
                            allow-clear
                            placeholder="按模式筛选"
                            style="width: 100%"
                            :options="lotteryTypeOptions"
                        />
                    </a-col>
                    <a-col :xs="24" :md="8">
                        <a-range-picker
                            v-model:value="timeRangeFilter"
                            style="width: 100%"
                            :placeholder="['活动开始时间', '活动结束时间']"
                        />
                    </a-col>
                </a-row>
            </div>

            <a-spin :spinning="loading">
                <a-table
                    v-if="filteredList.length > 0"
                    :dataSource="filteredList"
                    :pagination="false"
                    :scroll="{ x: 1800 }"
                    :row-class-name="getRowClassName"
                    row-key="id"
                >
                    <a-table-column title="活动名称" data-index="name" min-width="180">
                        <template #default="{ record }">
                            <a @click="goDetail(record.id)" class="name-link">
                                {{ record.name }}
                            </a>
                        </template>
                    </a-table-column>
                    <a-table-column title="商品名称" data-index="productName" min-width="150" />
                    <a-table-column title="原价" data-index="originalPrice" width="100">
                        <template #default="{ record }">
                            {{ formatMoney(record.originalPrice) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="团购价" data-index="groupPrice" width="100">
                        <template #default="{ record }">
                            {{ formatMoney(record.groupPrice) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="成团人数" width="120">
                        <template #default="{ record }">
                            {{ record.minPeople }} - {{ record.maxPeople }}
                        </template>
                    </a-table-column>
                    <a-table-column title="活动模式" data-index="lotteryType" width="120">
                        <template #default="{ record }">
                            {{ lotteryTypeText(record.lotteryType) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="报名人数" data-index="signupCount" width="100" />
                    <a-table-column title="成团数" data-index="groupCount" width="80" />
                    <a-table-column title="状态" data-index="status" width="100">
                        <template #default="{ record }">
                            <a-tag :color="statusColor(record.status)">
                                {{ statusText(record.status) }}
                            </a-tag>
                        </template>
                    </a-table-column>
                    <a-table-column title="活动开始时间" data-index="startTime" width="240">
                        <template #default="{ record }">
                            {{ formatDateTime(record.startTime) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="活动结束时间" data-index="endTime" width="240">
                        <template #default="{ record }">
                            {{ formatDateTime(record.endTime) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="创建时间" data-index="createdAt" width="240">
                        <template #default="{ record }">
                            {{ formatDateTime(record.createdAt) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="操作" width="200" fixed="right">
                        <template #default="{ record }">
                            <a-space>
                                <a @click="goDetail(record.id)">详情</a>
                                <a
                                    v-if="record.status === 'INACTIVE'"
                                    @click="handleActivate(record.id)"
                                    class="text-green-500"
                                >
                                    启用
                                </a>
                                <a
                                    v-if="record.status === 'ACTIVE'"
                                    @click="handleDeactivate(record.id)"
                                    class="text-yellow-500"
                                >
                                    停用
                                </a>
                                <a-popconfirm
                                    title="确认删除该活动？"
                                    @confirm="handleDelete(record.id)"
                                >
                                    <a class="text-red-500">删除</a>
                                </a-popconfirm>
                            </a-space>
                        </template>
                    </a-table-column>
                </a-table>

                <div v-else class="empty-wrap">
                    <a-empty description="暂无团购活动数据" />
                </div>

                <div v-if="pagination.total > 0" class="mt-4 flex justify-end">
                    <a-pagination
                        v-model:current="pagination.page"
                        v-model:page-size="pagination.pageSize"
                        :total="pagination.total"
                        :show-size-changer="true"
                        :show-quick-jumper="true"
                        :show-total="(total: number) => `共 ${total} 条`"
                        @change="handlePageChange"
                    />
                </div>
            </a-spin>
        </a-card>
    </div>
</template>

<style scoped>
.name-link {
    color: #1890ff;
    cursor: pointer;
}
.name-link:hover {
    text-decoration: underline;
}
.empty-wrap {
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 不同状态的行背景色 */
:deep(.row-status-active) {
    background-color: rgba(82, 196, 26, 0.08) !important;
}

:deep(.row-status-active:hover) {
    background-color: rgba(82, 196, 26, 0.15) !important;
}

:deep(.row-status-inactive) {
    background-color: rgba(140, 140, 140, 0.08) !important;
}

:deep(.row-status-inactive:hover) {
    background-color: rgba(140, 140, 140, 0.15) !important;
}
</style>
