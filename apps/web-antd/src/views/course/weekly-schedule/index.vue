<template>
    <div class="schedule-overview-page">
        <a-card :bordered="false" class="filter-card">
            <a-form layout="inline">
                <a-form-item label="场馆ID">
                    <a-input-number
                        v-model:value="queryForm.venueId"
                        :min="1"
                        :precision="0"
                        style="width: 160px"
                        placeholder="请输入场馆ID"
                    />
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
                    <span>教练预约排班总览</span>

                    <a-tag v-if="overview" color="blue">
                        {{ overview.startDate }} 至 {{ overview.endDate }}
                    </a-tag>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-tag color="green">可用</a-tag>
                    <a-tag color="blue">已约</a-tag>
                    <a-tag color="orange">锁定/请假</a-tag>
                    <a-tag>休息/无排班</a-tag>
                </a-space>
            </template>

            <a-table
                bordered
                size="middle"
                row-key="coachId"
                :columns="columns"
                :data-source="tableData"
                :loading="loading"
                :pagination="false"
                :scroll="{ x: tableScrollX }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'coachName'">
                        <div class="coach-cell">
                            <a-avatar :src="record.coachAvatar">
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

                    <template v-else-if="isDayColumn(column.dataIndex)">
                        <ScheduleDayCell
                            :day="getDayByColumn(record, column.dataIndex)"
                            @click="
                handleOpenDayDetail(
                  record,
                  getDayByColumn(record, column.dataIndex),
                )
              "
                        />
                    </template>
                </template>
            </a-table>
        </a-card>

        <a-drawer
            v-model:open="detailDrawerOpen"
            width="780"
            title="排班详情"
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
                      <span class="booking-time">
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
                            :class="getSlotClass(slot.status)"
                        >
                            <div class="slot-time">
                                {{ slot.slot }}
                            </div>

                            <a-tag :color="getSlotTagColor(slot.status)">
                                {{ getSlotStatusText(slot.status) }}
                            </a-tag>

                            <div
                                v-if="slot.status === ScheduleConstants.SLOT_STATUS_BOOKED"
                                class="slot-extra"
                            >
                                <div>{{ slot.memberName || '未知会员' }}</div>
                                <div class="slot-sub-text">
                                    {{ slot.bookingNo || '-' }}
                                </div>
                            </div>

                            <div
                                v-else-if="
                  slot.status === ScheduleConstants.SLOT_STATUS_BLOCKED
                "
                                class="slot-extra"
                            >
                                不可预约
                            </div>
                        </div>
                    </div>
                </template>

                <a-empty v-else description="请选择某天查看详情"/>
            </a-spin>
        </a-drawer>
    </div>
</template>

<script setup lang="ts">
import type {TableColumnsType} from 'ant-design-vue';

import type {
    AdminScheduleOverviewVO,
    CoachDayScheduleVO,
    CoachScheduleRowVO,
} from '#/api/admin/schedule';

import {
    getAdminScheduleDayDetailApi,
    getAdminScheduleOverviewApi,
    ScheduleConstants,
} from '#/api/admin/schedule';

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
    InputNumber as AInputNumber,
    List as AList,
    Space as ASpace,
    Spin as ASpin,
    Table as ATable,
    Tag as ATag,
    message,
} from 'ant-design-vue';

import dayjs from 'dayjs';
import {computed, defineComponent, h, onMounted, reactive, ref} from 'vue';

const AFormItem = AForm.Item;
const ARangePicker = ADatePicker.RangePicker;
const ADescriptionsItem = ADescriptions.Item;
const AListItem = AList.Item;
const AListItemMeta = AList.Item.Meta;

interface ScheduleTableRow extends CoachScheduleRowVO {
    [key: string]: unknown;
}

const loading = ref(false);
const detailLoading = ref(false);
const detailDrawerOpen = ref(false);

const overview = ref<AdminScheduleOverviewVO | null>(null);

const selectedCoach = ref<CoachScheduleRowVO | null>(null);
const selectedDay = ref<CoachDayScheduleVO | null>(null);

const queryForm = reactive({
    venueId: 1,
});

const dateRange = ref<[string, string] | undefined>();

const tableData = computed<ScheduleTableRow[]>(() => {
    return overview.value?.coaches || [];
});

const dateList = computed<string[]>(() => {
    if (!overview.value?.startDate || !overview.value?.endDate) {
        return [];
    }

    const result: string[] = [];
    let current = dayjs(overview.value.startDate);
    const end = dayjs(overview.value.endDate);

    while (current.isBefore(end) || current.isSame(end, 'day')) {
        result.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
    }

    return result;
});

const columns = computed<TableColumnsType>(() => {
    const coachColumn: TableColumnsType[number] = {
        title: '教练',
        dataIndex: 'coachName',
        key: 'coachName',
        width: 190,
        fixed: 'left',
    };

    const dayColumns: TableColumnsType = dateList.value.map((date) => {
        const d = dayjs(date);

        return {
            title: `${d.format('MM-DD')} ${getWeekText(d.day())}`,
            dataIndex: `day_${date}`,
            key: `day_${date}`,
            width: 160,
            align: 'center',
        };
    });

    return [coachColumn, ...dayColumns];
});

const tableScrollX = computed(() => {
    return 190 + dateList.value.length * 160;
});

/**
 * 单元格组件。
 *
 * 使用内部组件可以避免模板里重复写太多判断逻辑。
 */
const ScheduleDayCell = defineComponent({
    name: 'ScheduleDayCell',
    props: {
        day: {
            type: Object as () => CoachDayScheduleVO | undefined,
            default: undefined,
        },
    },
    emits: ['click'],
    setup(props, {emit}) {
        return () => {
            const day = props.day;

            if (!day) {
                return h(
                    'div',
                    {
                        class: ['day-cell', 'day-empty'],
                        onClick: () => emit('click'),
                    },
                    '—',
                );
            }

            if (!day.hasSchedule) {
                return h(
                    'div',
                    {
                        class: ['day-cell', 'day-empty'],
                        onClick: () => emit('click'),
                    },
                    '无排班',
                );
            }

            if (day.isRestDay === ScheduleConstants.REST_DAY_YES) {
                return h(
                    'div',
                    {
                        class: ['day-cell', 'day-rest'],
                        onClick: () => emit('click'),
                    },
                    '休息',
                );
            }

            const isLeave =
                day.isLeave === ScheduleConstants.SCHEDULE_STATUS_LEAVE;

            const cls = [
                'day-cell',
                isLeave
                    ? 'day-leave'
                    : day.bookedSlots > 0
                        ? 'day-booked'
                        : 'day-normal',
            ];

            return h(
                'div',
                {
                    class: cls,
                    onClick: () => emit('click'),
                },
                [
                    h('div', {class: 'day-header'}, [
                        isLeave
                            ? h('span', {class: 'leave-label'}, '请假')
                            : h('span', {class: 'normal-label'}, '正常'),
                        h('span', {class: 'work-time'}, formatWorkTime(day)),
                    ]),

                    h('div', {class: 'day-stats'}, [
                        h(
                            'span',
                            {class: 'stat stat-available'},
                            `可 ${day.availableSlots || 0}`,
                        ),
                        h(
                            'span',
                            {class: 'stat stat-booked'},
                            `约 ${day.bookedSlots || 0}`,
                        ),
                        h(
                            'span',
                            {class: 'stat stat-blocked'},
                            `锁 ${day.blockedSlots || 0}`,
                        ),
                    ]),

                    h(
                        'div',
                        {class: 'day-booking-count'},
                        `${day.bookings?.length || 0} 个预约`,
                    ),
                ],
            );
        };
    },
});

function isDayColumn(dataIndex: unknown): dataIndex is string {
    return typeof dataIndex === 'string' && dataIndex.startsWith('day_');
}

function getDayByColumn(
    record: CoachScheduleRowVO,
    dataIndex: unknown,
): CoachDayScheduleVO | undefined {
    if (!isDayColumn(dataIndex)) {
        return undefined;
    }

    const date = dataIndex.replace('day_', '');
    return record.days?.find((item) => item.date === date);
}

function getWeekText(day: number) {
    const map: Record<number, string> = {
        0: '周日',
        1: '周一',
        2: '周二',
        3: '周三',
        4: '周四',
        5: '周五',
        6: '周六',
    };

    return map[day] || '';
}

function getCoachAvatarText(name?: string) {
    return name?.slice(0, 1) || '教';
}

function normalizeTime(value?: string) {
    if (!value) {
        return '';
    }

    return value.length >= 5 ? value.slice(0, 5) : value;
}

function formatWorkTime(day?: CoachDayScheduleVO | null) {
    if (!day?.workStartTime || !day?.workEndTime) {
        return '-';
    }

    return `${normalizeTime(day.workStartTime)}-${normalizeTime(
        day.workEndTime,
    )}`;
}

function getSlotTagColor(status?: string) {
    if (status === ScheduleConstants.SLOT_STATUS_AVAILABLE) {
        return 'green';
    }

    if (status === ScheduleConstants.SLOT_STATUS_BOOKED) {
        return 'blue';
    }

    if (status === ScheduleConstants.SLOT_STATUS_BLOCKED) {
        return 'orange';
    }

    return 'default';
}

function getSlotStatusText(status?: string) {
    const map: Record<string, string> = {
        [ScheduleConstants.SLOT_STATUS_AVAILABLE]: '可用',
        [ScheduleConstants.SLOT_STATUS_BOOKED]: '已约',
        [ScheduleConstants.SLOT_STATUS_BLOCKED]: '锁定',
    };

    return status ? map[status] || status : '-';
}

function getSlotClass(status?: string) {
    return {
        'slot-available': status === ScheduleConstants.SLOT_STATUS_AVAILABLE,
        'slot-booked': status === ScheduleConstants.SLOT_STATUS_BOOKED,
        'slot-blocked': status === ScheduleConstants.SLOT_STATUS_BLOCKED,
    };
}

async function handleSearch() {
    if (!queryForm.venueId) {
        message.warning('请输入场馆ID');
        return;
    }

    loading.value = true;

    try {
        const params = {
            venueId: queryForm.venueId,
            includeSlots: false,
            startDate: dateRange.value?.[0],
            endDate: dateRange.value?.[1],
        };

        overview.value = await getAdminScheduleOverviewApi(params);
    } finally {
        loading.value = false;
    }
}

function handleReset() {
    queryForm.venueId = 1;
    dateRange.value = undefined;
    handleSearch();
}

async function handleOpenDayDetail(
    coach: CoachScheduleRowVO,
    day?: CoachDayScheduleVO,
) {
    if (!day) {
        return;
    }

    if (!coach.coachId) {
        message.warning('教练ID不能为空');
        return;
    }

    selectedCoach.value = coach;
    selectedDay.value = day;
    detailDrawerOpen.value = true;

    detailLoading.value = true;

    try {
        const result = await getAdminScheduleDayDetailApi({
            venueId: queryForm.venueId,
            coachId: coach.coachId,
            startDate: day.date,
            includeSlots: true,
        });

        const detailCoach = result.coaches?.[0];
        const detailDay = detailCoach?.days?.[0];

        if (detailCoach) {
            selectedCoach.value = detailCoach;
        }

        if (detailDay) {
            selectedDay.value = detailDay;
        }
    } finally {
        detailLoading.value = false;
    }
}

onMounted(() => {
    handleSearch();
});
</script>

<style scoped>
.schedule-overview-page {
    min-height: 100%;
    padding: 16px;
    color: hsl(var(--foreground));
    background: hsl(var(--background));

    --sv-bg-card: hsl(var(--card));
    --sv-bg-soft: hsl(var(--accent));
    --sv-text: hsl(var(--foreground));
    --sv-text-secondary: hsl(var(--muted-foreground));
    --sv-border: hsl(var(--border));
    --sv-border-strong: hsl(var(--border));

    --sv-shadow-hover: 0 4px 12px rgb(0 0 0 / 10%);

    --sv-empty-bg: color-mix(in srgb, var(--sv-bg-card) 90%, var(--sv-text-secondary) 10%);
    --sv-empty-border: var(--sv-border-strong);
    --sv-empty-text: var(--sv-text-secondary);

    --sv-ok-bg: color-mix(in srgb, #52c41a 14%, var(--sv-bg-card));
    --sv-ok-border: color-mix(in srgb, #52c41a 40%, var(--sv-border));
    --sv-ok-text: #52c41a;

    --sv-book-bg: color-mix(in srgb, #1677ff 14%, var(--sv-bg-card));
    --sv-book-border: color-mix(in srgb, #1677ff 40%, var(--sv-border));
    --sv-book-text: #1677ff;

    --sv-warn-bg: color-mix(in srgb, #faad14 14%, var(--sv-bg-card));
    --sv-warn-border: color-mix(in srgb, #faad14 40%, var(--sv-border));
    --sv-warn-text: #fa8c16;
}

.filter-card {
    margin-bottom: 16px;
    background: var(--sv-bg-card);
}

.table-card {
    background: var(--sv-bg-card);
}

/* Card */
.filter-card :deep(.ant-card-head),
.table-card :deep(.ant-card-head) {
    color: var(--sv-text);
    background: var(--sv-bg-card);
    border-bottom-color: var(--sv-border);
}

.filter-card :deep(.ant-card-body),
.table-card :deep(.ant-card-body) {
    background: var(--sv-bg-card);
}

/* 表单输入 */
:deep(.ant-form-item-label > label) {
    color: var(--sv-text-secondary);
}

:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-picker),
:deep(.ant-btn:not(.ant-btn-primary)) {
    color: var(--sv-text);
    background: var(--sv-bg-card);
    border-color: var(--sv-border-strong);
}

:deep(.ant-input::placeholder) {
    color: var(--sv-text-secondary);
}

/* Table */
.table-card :deep(.ant-table) {
    color: var(--sv-text);
    background: var(--sv-bg-card);
}

.table-card :deep(.ant-table-container) {
    border-color: var(--sv-border);
}

.table-card :deep(.ant-table-cell) {
    padding: 8px;
    color: var(--sv-text);
    background: var(--sv-bg-card);
    border-color: var(--sv-border);
}

.table-card :deep(.ant-table-thead > tr > th) {
    color: var(--sv-text);
    background: var(--sv-bg-soft);
    border-color: var(--sv-border);
}

.table-card :deep(.ant-table-tbody > tr > td) {
    border-color: var(--sv-border);
}

.table-card :deep(.ant-table-tbody > tr:hover > td) {
    background: color-mix(in srgb, var(--sv-bg-card) 92%, var(--sv-text) 8%);
}

.card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--sv-text);
}

/* Coach cell */
.coach-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.coach-meta {
    min-width: 0;
}

.coach-name {
    font-weight: 600;
    color: var(--sv-text);
}

.coach-id {
    margin-top: 2px;
    font-size: 12px;
    color: var(--sv-text-secondary);
}

/* Day cell */
.day-cell {
    min-height: 88px;
    padding: 8px;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease,
        background-color 0.18s ease;
}

.day-cell:hover {
    transform: translateY(-1px);
    box-shadow: var(--sv-shadow-hover);
}

.day-empty,
.day-rest {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sv-empty-text);
    background: var(--sv-empty-bg);
    border-color: var(--sv-empty-border);
}

.day-normal {
    color: var(--sv-text);
    background: var(--sv-ok-bg);
    border-color: var(--sv-ok-border);
}

.day-booked {
    color: var(--sv-text);
    background: var(--sv-book-bg);
    border-color: var(--sv-book-border);
}

.day-leave {
    color: var(--sv-text);
    background: var(--sv-warn-bg);
    border-color: var(--sv-warn-border);
}

.day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.normal-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--sv-ok-text);
}

.leave-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--sv-warn-text);
}

.work-time {
    font-size: 12px;
    color: var(--sv-text-secondary);
}

.day-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
}

.stat {
    font-size: 12px;
    font-weight: 600;
}

.stat-available {
    color: var(--sv-ok-text);
}

.stat-booked {
    color: var(--sv-book-text);
}

.stat-blocked {
    color: var(--sv-warn-text);
}

.day-booking-count {
    margin-top: 8px;
    font-size: 12px;
    color: var(--sv-text-secondary);
    text-align: center;
}

/* Drawer */
:deep(.ant-drawer-content),
:deep(.ant-drawer-header),
:deep(.ant-drawer-body) {
    color: var(--sv-text);
    background: var(--sv-bg-card);
}

:deep(.ant-drawer-header) {
    border-bottom-color: var(--sv-border);
}

:deep(.ant-drawer-title) {
    color: var(--sv-text);
}

/* Descriptions */
:deep(.ant-descriptions-view) {
    border-color: var(--sv-border);
}

:deep(.ant-descriptions-item-label) {
    color: var(--sv-text-secondary);
    background: var(--sv-bg-soft);
}

:deep(.ant-descriptions-item-content) {
    color: var(--sv-text);
    background: var(--sv-bg-card);
}

:deep(.ant-descriptions-bordered .ant-descriptions-item-label),
:deep(.ant-descriptions-bordered .ant-descriptions-item-content) {
    border-color: var(--sv-border);
}

/* Divider / List / Empty */
:deep(.ant-divider) {
    border-color: var(--sv-border);
}

:deep(.ant-divider-inner-text) {
    color: var(--sv-text);
}

:deep(.ant-list) {
    color: var(--sv-text);
    background: var(--sv-bg-card);
    border-color: var(--sv-border);
}

:deep(.ant-list-item) {
    border-color: var(--sv-border);
}

:deep(.ant-list-item-meta-title) {
    color: var(--sv-text);
}

:deep(.ant-list-item-meta-description),
:deep(.ant-empty-description) {
    color: var(--sv-text-secondary);
}

/* Booking */
.booking-time {
    font-weight: 600;
    color: var(--sv-text);
}

.booking-desc {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: var(--sv-text-secondary);
}

/* Slot */
.slot-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
}

.slot-item {
    min-height: 92px;
    padding: 10px;
    color: var(--sv-text);
    background: var(--sv-bg-card);
    border: 1px solid var(--sv-border);
    border-radius: 8px;
}

.slot-available {
    background: var(--sv-ok-bg);
    border-color: var(--sv-ok-border);
}

.slot-booked {
    background: var(--sv-book-bg);
    border-color: var(--sv-book-border);
}

.slot-blocked {
    background: var(--sv-warn-bg);
    border-color: var(--sv-warn-border);
}

.slot-time {
    margin-bottom: 6px;
    font-weight: 600;
    color: var(--sv-text);
}

.slot-extra {
    margin-top: 6px;
    font-size: 12px;
    color: var(--sv-text);
}

.slot-sub-text {
    margin-top: 2px;
    color: var(--sv-text-secondary);
}

@media (max-width: 1200px) {
    .slot-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .schedule-overview-page {
        padding: 12px;
    }

    .slot-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>


