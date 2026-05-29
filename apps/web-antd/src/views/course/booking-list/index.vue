<template>
    <div class="booking-list-page">
        <a-card :bordered="false">
            <template #title>
                <div class="page-title">
                    <span>预约管理</span>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="fetchBookingList">刷新</a-button>
                </a-space>
            </template>

            <a-form class="filter-form" layout="vertical" :model="queryForm">
                <a-row :gutter="16">
                    <a-col :xs="24" :sm="12" :md="8" :lg="6">
                        <a-form-item label="预约编号/会员">
                            <a-input
                                v-model:value="queryForm.keyword"
                                allow-clear
                                placeholder="请输入预约编号/会员姓名/手机号"
                                @press-enter="handleSearch"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="状态">
                            <a-select v-model:value="queryForm.status" allow-clear placeholder="全部">
                                <a-select-option :value="1">已预约/待确认</a-select-option>
                                <a-select-option :value="2">已确认</a-select-option>
                                <a-select-option :value="3">进行中</a-select-option>
                                <a-select-option :value="9">已取消</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="场馆">
                            <a-select v-model:value="queryForm.venueId" allow-clear placeholder="全部">
                                <a-select-option v-for="venue in venueOptions" :key="venue.value" :value="venue.value">
                                    {{ venue.label }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="6">
                        <a-form-item label="日期范围">
                            <a-range-picker
                                v-model:value="dateRange"
                                format="YYYY-MM-DD"
                                :placeholder="['开始日期', '结束日期']"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="24" :md="24" :lg="8">
                        <a-form-item label=" ">
                            <a-space>
                                <a-button type="primary" @click="handleSearch">查询</a-button>
                                <a-button @click="handleReset">重置</a-button>
                            </a-space>
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>

            <a-table
                row-key="bookingId"
                :loading="loading"
                :columns="columns"
                :data-source="bookingList"
                :pagination="pagination"
                :scroll="{ x: 1400 }"
                @change="handleTableChange"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'bookingNo'">
                        <a-button type="link" @click="handleDetail(record)">
                            {{ record.bookingNo }}
                        </a-button>
                    </template>

                    <template v-else-if="column.key === 'member'">
                        <div class="member-cell">
                            <a-avatar size="small">
                                {{ (record.member.name || record.memberPhone || '用')[0] }}
                            </a-avatar>
                            <div class="member-info">
                                <div class="member-name">{{ record.member.name || '-' }}</div>
                                <div class="member-phone">{{ record.memberPhone || '-' }}</div>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'bookingTime'">
                        <div class="time-cell">
                            <div>{{ record.bookingDate || '-' }}</div>
                            <div>{{ record.startTime?.substring(0, 5) || '-' }} -
                                {{ record.endTime?.substring(0, 5) || '-' }}
                            </div>
                        </div>
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
                        </a-space>
                    </template>
                </template>
            </a-table>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue';
import {useRouter} from 'vue-router';
import dayjs, {type Dayjs} from 'dayjs';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    DatePicker as ADatePicker,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Table as ATable,
    Tag as ATag,
    Avatar as AAvatar,
} from 'ant-design-vue';

import {
    pageAdminBookingsNormalizedApi,
    type AdminBookingQueryDTO,
    type AdminBookingListItemVO,
    type BookingStatus,
} from '#/api/booking/bookings';
import {getAllVenuesApi, type VenueDetailDTO} from '#/api/venue/list';
import type {NormalizedPageResult} from '#/api/_shared/page';

const ARangePicker = ADatePicker.RangePicker;
const router = useRouter();

const loading = ref(false);
const bookingList = ref<AdminBookingListItemVO[]>([]);
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
});

const queryForm = reactive<AdminBookingQueryDTO>({
    page: 1,
    pageSize: 10,
    keyword: '',
    status: undefined,
    venueId: undefined,
    startDate: undefined,
    endDate: undefined,
});

const dateRange = ref<[Dayjs, Dayjs] | []>([]);
const venueOptions = ref<Array<{ label: string; value: string }>>([]);

const columns = [
    {title: '预约编号', key: 'bookingNo', width: 160},
    {title: '会员信息', key: 'member', width: 200},
    {title: '场馆', dataIndex: 'venueName', key: 'venueName', width: 150},
    {title: '教练', dataIndex: 'coachName', key: 'coachName', width: 100},
    {title: '权益卡', dataIndex: 'packageName', key: 'packageName', width: 150},
    {title: '预约时间', key: 'bookingTime', width: 180},
    {title: '状态', key: 'status', width: 120},
    {title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150},
    {title: '操作', key: 'actions', width: 100},
];

function getStatusText(status: BookingStatus | number | undefined): string {
    if (!status) return '-';
    const statusMap: Record<number, string> = {
        1: '已预约/待确认',
        2: '已确认',
        3: '进行中',
        9: '已取消',
    };
    return statusMap[status] || '-';
}

function getStatusColor(status: BookingStatus | number | undefined): string {
    if (!status) return 'default';
    const colorMap: Record<number, string> = {
        1: 'orange',
        2: 'blue',
        3: 'green',
        9: 'red',
    };
    return colorMap[status] || 'default';
}

function formatDate(date?: Dayjs): string | undefined {
    return date ? date.format('YYYY-MM-DD') : undefined;
}

async function fetchBookingList() {
    loading.value = true;
    try {
        const params: AdminBookingQueryDTO = {
            ...queryForm,
            page: pagination.current,
            pageSize: pagination.pageSize,
        };

        if (dateRange.value.length === 2) {
            params.startDate = formatDate(dateRange.value[0]);
            params.endDate = formatDate(dateRange.value[1]);
        } else {
            params.startDate = undefined;
            params.endDate = undefined;
        }

        const res: NormalizedPageResult<AdminBookingListItemVO> = await pageAdminBookingsNormalizedApi(params);
        bookingList.value = res.list;
        pagination.total = res.total;
    } catch (e: any) {
        console.error('查询预约列表失败:', e);
    } finally {
        loading.value = false;
    }
}

async function loadVenues() {
    try {
        const venues = await getAllVenuesApi();
        venueOptions.value = (venues || []).map((v: VenueDetailDTO) => ({
            label: v.name,
            value: String(v.id),
        }));
    } catch (e: any) {
        console.error('加载场馆失败:', e);
    }
}

function handleSearch() {
    pagination.current = 1;
    fetchBookingList();
}

function handleReset() {
    queryForm.keyword = '';
    queryForm.status = undefined;
    queryForm.venueId = undefined;
    queryForm.startDate = undefined;
    queryForm.endDate = undefined;
    dateRange.value = [];
    pagination.current = 1;
    fetchBookingList();
}

function handleTableChange(paginationInfo: { current: number; pageSize: number }) {
    pagination.current = paginationInfo.current;
    pagination.pageSize = paginationInfo.pageSize;
    fetchBookingList();
}

function handleDetail(record: AdminBookingListItemVO) {
    debugger
    router.push({
        name: 'CourseBookingDetail',
        params: { id: record.bookingId },
    });
}

onMounted(() => {
    loadVenues();
    fetchBookingList();
});
</script>

<style scoped>
.booking-list-page {
    padding: 16px;
}

.page-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-form {
    margin-bottom: 16px;
}

.member-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.member-info {
    display: flex;
    flex-direction: column;
}

.member-name {
    font-size: 14px;
    font-weight: 500;
}

.member-phone {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.time-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
</style>
