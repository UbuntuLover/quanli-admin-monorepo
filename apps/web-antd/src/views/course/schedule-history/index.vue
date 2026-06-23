<template>
    <div class="schedule-history-page">
        <a-card :bordered="false" class="filter-card">
            <a-form layout="inline">
                <a-form-item label="场馆">
                    <a-select
                        v-model:value="queryForm.venueId"
                        style="width: 200px"
                        placeholder="请选择场馆"
                    >
                        <a-select-option
                            v-for="venue in venueOptions"
                            :key="venue.id"
                            :value="venue.id"
                        >
                            {{ venue.name }} (ID: {{ venue.id }})
                        </a-select-option>
                    </a-select>
                </a-form-item>

                <a-form-item label="教练">
                    <a-select
                        v-model:value="queryForm.coachId"
                        style="width: 200px"
                        placeholder="请选择教练"
                        allowClear
                        show-search
                        option-filter-prop="children"
                    >
                        <a-select-option
                            v-for="coach in coachOptions"
                            :key="coach.coachId"
                            :value="coach.coachId"
                        >
                            {{ coach.coachName }}
                        </a-select-option>
                    </a-select>
                </a-form-item>

                <a-form-item label="日期范围">
                    <a-range-picker
                        v-model:value="dateRange"
                        value-format="YYYY-MM-DD"
                        style="width: 280px"
                    />
                </a-form-item>

                <a-form-item>
                    <a-space>
                        <a-button type="primary" :loading="loading" @click="handleSearch">
                            查询
                        </a-button>

                        <a-button @click="handleReset">
                            重置
                        </a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>

        <a-card :bordered="false" class="table-card">
            <template #title>
                <div class="card-title">
                    <span>历史排班记录</span>

                    <a-tag v-if="overview" color="blue">
                        {{ overview.startDate }} 至 {{ overview.endDate }}
                    </a-tag>

                    <a-tag v-if="overview" color="default">
                        共 {{ overview.coaches?.length || 0 }} 位教练
                    </a-tag>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-tag color="green">正常</a-tag>
                    <a-tag color="orange">请假</a-tag>
                    <a-tag color="red">已取消</a-tag>
                    <a-tag>休息/无排班</a-tag>
                </a-space>
            </template>

            <a-table
                bordered
                size="middle"
                row-key="rowKey"
                :columns="columns"
                :data-source="tableData"
                :loading="loading"
                :pagination="false"
                :scroll="{ x: 1600, y: tableScrollY }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'date'">
                        <div class="date-cell">
                            <div class="date-main">
                                {{ record.date }}
                            </div>
                            <div class="date-sub">
                                {{ formatWeekday(record.date) }}
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.dataIndex === 'coachName'">
                        <div class="coach-cell">
                            <a-avatar
                                :src="
                                    coachAvatarPreviewMap.get(String(record.coachAvatar || '')) ||
                                    (/^https?:\/\//.test(String(record.coachAvatar || ''))
                                        ? record.coachAvatar
                                        : undefined)
                                "
                            >
                                {{ getCoachAvatarText(record.coachName) }}
                            </a-avatar>

                            <div class="coach-meta">
                                <div class="coach-name">
                                    {{ record.coachName || '-' }}
                                </div>
                                <div class="coach-id">
                                    ID：{{ record.coachId || '-' }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.dataIndex === 'workTime'">
                        <span v-if="record.workTime">{{ record.workTime }}</span>
                        <span v-else class="text-muted">—</span>
                    </template>

                    <template v-else-if="column.dataIndex === 'status'">
                        <a-space>
                            <a-tag
                                v-if="record.isRestDay === ScheduleConstants.REST_DAY_YES"
                            >
                                休息
                            </a-tag>

                            <a-tag
                                v-else-if="
                                    record.isLeave ===
                                    ScheduleConstants.SCHEDULE_STATUS_LEAVE
                                "
                                color="orange"
                            >
                                请假
                            </a-tag>

                            <a-tag v-else-if="record.isCancel === true" color="red">
                                已取消
                            </a-tag>

                            <a-tag v-else color="green">
                                正常
                            </a-tag>
                        </a-space>
                    </template>

                    <template v-else-if="column.dataIndex === 'totalSlots'">
                        <span>{{ record.totalSlots }}</span>
                    </template>

                    <template v-else-if="column.dataIndex === 'availableSlots'">
                        <a-tag color="green">
                            可用 {{ record.availableSlots }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.dataIndex === 'bookedSlots'">
                        <a-tag color="blue">
                            已约 {{ record.bookedSlots }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.dataIndex === 'blockedSlots'">
                        <a-tag color="orange">
                            锁定 {{ record.blockedSlots }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.dataIndex === 'action'">
                        <a-space>
                            <a-button size="small" type="link" @click="handleOpenDayDetail(record)">
                                查看详情
                            </a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <a-empty
                v-if="!loading && tableData.length === 0"
                description="暂无历史排班记录"
                style="margin-top: 32px"
            />
        </a-card>

        <!-- 历史排班详情抽屉 -->
        <a-drawer
            v-model:open="detailDrawerOpen"
            width="780"
            title="历史排班详情"
            placement="right"
            destroy-on-close
        >
            <a-spin :spinning="detailLoading">
                <template v-if="selectedCoach && selectedDay">
                    <a-descriptions bordered size="small" :column="2">
                        <a-descriptions-item label="教练">
                            {{ selectedCoach.coachName || '-' }}
                        </a-descriptions-item>

                        <a-descriptions-item label="日期">
                            {{ selectedDay.date }}
                        </a-descriptions-item>

                        <a-descriptions-item label="工作时间">
                            {{ formatWorkTime(selectedDay) }}
                        </a-descriptions-item>

                        <a-descriptions-item label="排班状态">
                            <a-space>
                                <a-tag
                                    v-if="
                                        selectedDay.isRestDay === ScheduleConstants.REST_DAY_YES
                                    "
                                >
                                    休息
                                </a-tag>

                                <a-tag
                                    v-else-if="
                                        selectedDay.isLeave ===
                                        ScheduleConstants.SCHEDULE_STATUS_LEAVE
                                    "
                                    color="orange"
                                >
                                    请假
                                </a-tag>

                                <a-tag v-else color="green">
                                    正常
                                </a-tag>
                            </a-space>
                        </a-descriptions-item>

                        <a-descriptions-item label="总时间片">
                            {{ selectedDay.totalSlots }}
                        </a-descriptions-item>

                        <a-descriptions-item label="可用 / 已约 / 锁定">
                            <a-space>
                                <a-tag color="green">
                                    可用 {{ selectedDay.availableSlots }}
                                </a-tag>
                                <a-tag color="blue">
                                    已约 {{ selectedDay.bookedSlots }}
                                </a-tag>
                                <a-tag color="orange">
                                    锁定 {{ selectedDay.blockedSlots }}
                                </a-tag>
                            </a-space>
                        </a-descriptions-item>

                        <a-descriptions-item
                            v-if="selectedDay.leaveReason"
                            label="请假原因"
                            :span="2"
                        >
                            {{ selectedDay.leaveReason }}
                        </a-descriptions-item>
                    </a-descriptions>

                    <a-divider orientation="left">
                        当天预约
                    </a-divider>

                    <a-empty
                        v-if="!selectedDay.bookings?.length"
                        description="当天暂无预约"
                    />

                    <a-list
                        v-else
                        bordered
                        size="small"
                        :data-source="selectedDay.bookings"
                    >
                        <template #renderItem="{ item }">
                            <a-list-item>
                                <a-list-item-meta>
                                    <template #title>
                                        <a-space>
                                            <span>
                                                {{ item.startTime || '-' }} - {{ item.endTime || '-' }}
                                            </span>
                                            <a-tag color="blue">
                                                {{ item.memberName || '未知会员' }}
                                            </a-tag>
                                        </a-space>
                                    </template>

                                    <template #description>
                                        <div class="booking-desc">
                                            <span>预约号：{{ item.bookingNo || '-' }}</span>
                                            <span>课程：{{ item.packageName || '-' }}</span>
                                            <span>时长：{{ item.duration || 0 }} 分钟</span>
                                        </div>
                                    </template>
                                </a-list-item-meta>
                            </a-list-item>
                        </template>
                    </a-list>

                    <a-divider orientation="left">
                        时间片详情
                    </a-divider>

                    <a-empty
                        v-if="!selectedDay.slots?.length"
                        description="暂无时间片数据"
                    />

                    <div v-else class="slot-grid">
                        <div
                            v-for="slot in selectedDay.slots"
                            :key="slot.slot"
                            class="slot-item"
                            :class="[getSlotClass(slot.status)]"
                        >
                            <div class="slot-time">
                                {{ slot.slot }}
                            </div>
                            <div class="slot-status">
                                <span v-if="slot.status === ScheduleConstants.SLOT_STATUS_AVAILABLE">
                                    可用
                                </span>
                                <span v-else-if="slot.status === ScheduleConstants.SLOT_STATUS_BOOKED">
                                    已约
                                </span>
                                <span v-else-if="slot.status === ScheduleConstants.SLOT_STATUS_BLOCKED">
                                    锁定
                                </span>
                                <span v-else>—</span>
                            </div>
                            <div
                                v-if="slot.status === ScheduleConstants.SLOT_STATUS_BOOKED && slot.memberName"
                                class="slot-member"
                            >
                                {{ slot.memberName }}
                            </div>
                        </div>
                    </div>
                </template>
            </a-spin>
        </a-drawer>
    </div>
</template>

<script setup lang="ts">
import type {TableColumnsType} from 'ant-design-vue';
import {
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    DatePicker as ADatePicker,
    Descriptions as ADescriptions,
    Divider as ADivider,
    Drawer as ADrawer,
    Empty as AEmpty,
    Form as AForm,
    List as AList,
    message,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Table as ATable,
    Tag as ATag,
} from 'ant-design-vue';
import type {
    AdminScheduleOverviewVO,
    AdminScheduleSlotVO,
    CoachDayScheduleVO,
    CoachScheduleRowVO,
} from '#/api/admin/schedule';
import {getAdminScheduleDayDetailApi, getAdminScheduleOverviewApi, ScheduleConstants,} from '#/api/admin/schedule';

import {getVenueOptionsApi} from '#/api/venue/create';

import dayjs from 'dayjs';
import {computed, onMounted, reactive, ref} from 'vue';

const AFormItem = AForm.Item;
const ARangePicker = ADatePicker.RangePicker;
const ADescriptionsItem = ADescriptions.Item;
const AListItem = AList.Item;
const AListItemMeta = AList.Item.Meta;
const ASelectOption = ASelect.Option;

defineOptions({ name: 'ScheduleHistory' });

/** 历史排班表格行 */
interface HistoryScheduleRow {
    rowKey: string;
    coachId: string;
    coachName: string;
    coachAvatar?: string;
    date: string;
    workTime: string;
    isRestDay: number;
    isLeave: number;
    isCancel: boolean;
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    blockedSlots: number;
    /** 原始 day 数据，用于点击打开详情 */
    originalDay: CoachDayScheduleVO;
    /** 原始 coach 数据，用于点击打开详情 */
    originalCoach: CoachScheduleRowVO;
}

const loading = ref(false);
const detailLoading = ref(false);
const detailDrawerOpen = ref(false);

const venueOptions = ref<Array<{ id: string; name: string }>>([]);
const coachOptions = ref<Array<{ coachId: string; coachName: string }>>([]);
const coachAvatarPreviewMap = reactive(new Map<string, string>());

const overview = ref<AdminScheduleOverviewVO | null>(null);
const selectedCoach = ref<CoachScheduleRowVO | null>(null);
const selectedDay = ref<CoachDayScheduleVO | null>(null);

const queryForm = reactive({
    venueId: undefined as string | undefined,
    coachId: undefined as string | undefined,
});

/** 默认日期范围：过去 30 天 -> 今天 */
const dateRange = ref<[string, string] | undefined>([
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
]);

/** 把总览数据展开为"教练-日期"的扁平行 */
const tableData = computed<HistoryScheduleRow[]>(() => {
    const rows: HistoryScheduleRow[] = [];
    const coaches = overview.value?.coaches || [];

    coaches.forEach((coach) => {
        if (!coach.days?.length) return;
        coach.days.forEach((day) => {
            rows.push({
                rowKey: `${coach.coachId}_${day.date}`,
                coachId: String(coach.coachId ?? ''),
                coachName: coach.coachName ?? '',
                coachAvatar: (coach as any).coachAvatar ?? undefined,
                date: day.date,
                workTime: formatWorkTime(day),
                isRestDay: day.isRestDay ?? 0,
                isLeave: day.isLeave ?? 1,
                isCancel: day.isLeave === ScheduleConstants.SCHEDULE_STATUS_CANCELLED,
                totalSlots: day.totalSlots ?? 0,
                availableSlots: day.availableSlots ?? 0,
                bookedSlots: day.bookedSlots ?? 0,
                blockedSlots: day.blockedSlots ?? 0,
                originalDay: day,
                originalCoach: coach,
            });
        });
    });

    return rows;
});

const columns = computed<TableColumnsType>(() => [
    {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        width: 130,
        fixed: 'left',
    },
    {
        title: '教练',
        dataIndex: 'coachName',
        key: 'coachName',
        width: 190,
        fixed: 'left',
    },
    {
        title: '工作时间',
        dataIndex: 'workTime',
        key: 'workTime',
        width: 140,
    },
    {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
    },
    {
        title: '总时间片',
        dataIndex: 'totalSlots',
        key: 'totalSlots',
        width: 100,
        align: 'center',
    },
    {
        title: '可用',
        dataIndex: 'availableSlots',
        key: 'availableSlots',
        width: 100,
        align: 'center',
    },
    {
        title: '已约',
        dataIndex: 'bookedSlots',
        key: 'bookedSlots',
        width: 100,
        align: 'center',
    },
    {
        title: '锁定',
        dataIndex: 'blockedSlots',
        key: 'blockedSlots',
        width: 100,
        align: 'center',
    },
    {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        width: 120,
        fixed: 'right',
        align: 'center',
    },
]);

const tableScrollY = computed(() => {
    return Math.min(tableData.value.length * 62, 600);
});

/** 工具函数：格式化工作时间 */
function formatWorkTime(day: CoachDayScheduleVO): string {
    if (!day.workStartTime && !day.workEndTime) return '';
    return `${day.workStartTime ?? ''} - ${day.workEndTime ?? ''}`;
}

/** 工具函数：格式化星期 */
function formatWeekday(dateStr: string): string {
    const d = dayjs(dateStr);
    if (!d.isValid()) return '';
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[d.day()];
}

/** 工具函数：头像文字 */
function getCoachAvatarText(name: string | undefined): string {
    if (!name) return '教';
    return name.slice(0, 1);
}

/** 时间片状态对应的样式 */
function getSlotClass(status: string | undefined): string {
    switch (status) {
        case ScheduleConstants.SLOT_STATUS_AVAILABLE:
            return 'slot-available';
        case ScheduleConstants.SLOT_STATUS_BOOKED:
            return 'slot-booked';
        case ScheduleConstants.SLOT_STATUS_BLOCKED:
            return 'slot-blocked';
        default:
            return 'slot-empty';
    }
}

/** 搜索 */
async function handleSearch() {
    if (!queryForm.venueId) {
        message.warning('请先选择场馆');
        return;
    }

    loading.value = true;
    try {
        const [startDate, endDate] = dateRange.value || [undefined, undefined];

        const res = await getAdminScheduleOverviewApi({
            venueId: String(queryForm.venueId),
            coachId: queryForm.coachId ? String(queryForm.coachId) : undefined,
            startDate,
            endDate,
            includeSlots: false,
        });

        overview.value = res;

        /** 收集教练选项 */
        if (res?.coaches?.length && !coachOptions.value.length) {
            coachOptions.value = res.coaches
                .filter((c) => c.coachId && c.coachName)
                .map((c) => ({
                    coachId: String(c.coachId!),
                    coachName: c.coachName || '',
                }));
        }
    } catch (e) {
        console.error('[schedule-history] search error:', e);
        message.error('查询历史排班失败');
    } finally {
        loading.value = false;
    }
}

/** 重置 */
function handleReset() {
    queryForm.venueId = undefined;
    queryForm.coachId = undefined;
    dateRange.value = [
        dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        dayjs().format('YYYY-MM-DD'),
    ];
    overview.value = null;
}

/** 点击某行打开详情抽屉 */
async function handleOpenDayDetail(row: HistoryScheduleRow) {
    if (!row.originalCoach || !row.originalDay) return;

    selectedCoach.value = row.originalCoach;
    selectedDay.value = row.originalDay;
    detailDrawerOpen.value = true;
    detailLoading.value = true;

    try {
        const [startDate] = dateRange.value || [row.originalDay.date];
        const res = await getAdminScheduleDayDetailApi({
            venueId: String(queryForm.venueId || row.originalCoach.coachId || ''),
            coachId: String(row.originalCoach.coachId || ''),
            startDate: row.originalDay.date,
            endDate: row.originalDay.date,
            includeSlots: true,
        });

        const coach = res?.coaches?.[0];
        if (coach?.days?.[0]) {
            selectedDay.value = coach.days[0];
        }
    } catch (e) {
        console.error('[schedule-history] detail error:', e);
        message.error('获取排班详情失败');
    } finally {
        detailLoading.value = false;
    }
}

/** 加载场馆选项 */
async function loadVenueOptions() {
    try {
        const venues = await getVenueOptionsApi();
        venueOptions.value = venues.map((v: any) => ({
            id: String(v.id || v.venueId || ''),
            name: v.name || v.venueName || '未命名场馆',
        }));
        if (venueOptions.value.length && !queryForm.venueId) {
            queryForm.venueId = venueOptions.value[0].id;
        }
    } catch (e) {
        console.error('[schedule-history] load venue error:', e);
    }
}

onMounted(async () => {
    await loadVenueOptions();
    if (queryForm.venueId) {
        handleSearch();
    }
});
</script>

<style scoped>
.schedule-history-page {
    min-height: 100%;
    padding: 16px;
    color: hsl(var(--foreground));
    background: hsl(var(--background));
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.filter-card {
    margin-bottom: 0;
}

.table-card {
    flex: 1;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 500;
}

.date-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.date-main {
    font-weight: 500;
    font-size: 14px;
}

.date-sub {
    font-size: 12px;
    color: var(--ant-color-text-secondary, #999);
}

.coach-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.coach-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.coach-name {
    font-size: 14px;
    font-weight: 500;
}

.coach-id {
    font-size: 12px;
    color: var(--ant-color-text-secondary, #999);
}

.booking-desc {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--ant-color-text-secondary, #999);
}

.text-muted {
    color: var(--ant-color-text-secondary, #999);
}

/* 时间片网格 */
.slot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
}

.slot-item {
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid var(--ant-color-border-secondary, #e0e0e0);
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    transition: border-color 0.15s ease;
}

.slot-time {
    font-weight: 500;
    font-size: 12px;
}

.slot-status {
    font-size: 11px;
}

.slot-member {
    font-size: 11px;
    color: var(--ant-color-text-secondary, #999);
}

.slot-available {
    border-color: #52c41a;
}

.slot-available .slot-status {
    color: #52c41a;
}

.slot-booked {
    border-color: #1677ff;
}

.slot-booked .slot-status {
    color: #1677ff;
}

.slot-blocked {
    border-color: #faad14;
}

.slot-blocked .slot-status {
    color: #faad14;
}

.slot-empty {
    opacity: 0.6;
}
</style>
