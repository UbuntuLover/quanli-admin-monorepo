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
                        预约与时间片
                    </a-divider>

                    <a-empty
                        v-if="!selectedDay.slots?.length"
                        description="暂无时间片数据"
                    />

                    <template v-else>
                        <div v-if="groupedSlots.morning.length" class="slot-section">
                            <div class="slot-section-header">
                                <span class="slot-section-title">上午</span>
                                <span class="slot-section-count">
                                    {{ groupedSlots.morning.length }} 个时间片
                                </span>
                            </div>

                            <div class="slot-grid">
                                <template v-for="item in morningSlotViews" :key="item.time">
                                    <a-dropdown
                                        v-if="item.type === 'booking'"
                                        :trigger="['contextMenu']"
                                        v-model:open="contextMenuVisible"
                                    >
                                        <div
                                            class="slot-item booking-slot-piece"
                                            :class="{
                                                'booking-slot-start': item.isBookingStart,
                                                'booking-slot-end': item.isBookingEnd,
                                                'booking-slot-middle':
                                                    !item.isBookingStart && !item.isBookingEnd,
                                                'booking-dragging':
                                                    draggingBooking?.bookingNo ===
                                                    (item.booking as any)?.bookingNo,
                                            }"
                                            :style="getBookingSlotStyle(item.color)"
                                            draggable="true"
                                            @click="handleBookingClick(item.booking as any)"
                                            @dragstart="handleDragStart($event, item.booking as any)"
                                            @dragend="handleDragEnd"
                                        >
                                            <div class="booking-piece-time">
                                                <template v-if="item.isBookingStart">
                                                    {{ (item.booking as any).startTime || item.startTime }}
                                                    -
                                                    {{ (item.booking as any).endTime || item.endTime }}
                                                </template>

                                                <template v-else>
                                                    {{ item.startTime }}-{{ item.endTime }}
                                                </template>
                                            </div>

                                            <div v-if="item.isBookingStart" class="booking-piece-main">
                                                {{ (item.booking as any).memberName || '未知会员' }}
                                            </div>

                                            <div v-if="item.isBookingStart" class="booking-piece-sub">
                                                {{ (item.booking as any).packageName || '-' }}
                                            </div>

                                            <div v-else class="booking-piece-sub">
                                                占用中
                                            </div>
                                        </div>

                                        <template #overlay>
                                            <a-menu @click="closeContextMenu">
                                                <a-menu-item
                                                    key="delete"
                                                    @click="handleDeleteBooking(item.booking as any)"
                                                >
                                                    删除预约
                                                </a-menu-item>
                                            </a-menu>
                                        </template>
                                    </a-dropdown>

                                    <div
                                        v-else
                                        class="slot-item"
                                        :class="[
                                            getSlotClass((item.data as any).status),
                                            { 'slot-drop-target': dragOverSlot === item.startTime },
                                        ]"
                                        @dragover="handleDragOver($event, item.startTime)"
                                        @dragleave="handleDragLeave"
                                        @drop="handleDrop($event, item.startTime)"
                                    >
                                        <div class="slot-time">
                                            {{ item.startTime }}-{{ item.endTime }}
                                        </div>

                                        <a-tag :color="getSlotTagColor((item.data as any).status)">
                                            {{ getSlotStatusText((item.data as any).status) }}
                                        </a-tag>

                                        <div
                                            v-if="
                                                (item.data as any).status ===
                                                ScheduleConstants.SLOT_STATUS_BLOCKED
                                            "
                                            class="slot-extra"
                                        >
                                            不可预约
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>

                        <div v-if="groupedSlots.afternoon.length" class="slot-section">
                            <div class="slot-section-header">
                                <span class="slot-section-title">下午</span>
                                <span class="slot-section-count">
                                    {{ groupedSlots.afternoon.length }} 个时间片
                                </span>
                            </div>

                            <div class="slot-grid">
                                <template v-for="item in afternoonSlotViews" :key="item.time">
                                    <a-dropdown
                                        v-if="item.type === 'booking'"
                                        :trigger="['contextMenu']"
                                        v-model:open="contextMenuVisible"
                                    >
                                        <div
                                            class="slot-item booking-slot-piece"
                                            :class="{
                                                'booking-slot-start': item.isBookingStart,
                                                'booking-slot-end': item.isBookingEnd,
                                                'booking-slot-middle':
                                                    !item.isBookingStart && !item.isBookingEnd,
                                                'booking-dragging':
                                                    draggingBooking?.bookingNo ===
                                                    (item.booking as any)?.bookingNo,
                                            }"
                                            :style="getBookingSlotStyle(item.color)"
                                            draggable="true"
                                            @click="handleBookingClick(item.booking as any)"
                                            @dragstart="handleDragStart($event, item.booking as any)"
                                            @dragend="handleDragEnd"
                                        >
                                            <div class="booking-piece-time">
                                                <template v-if="item.isBookingStart">
                                                    {{ (item.booking as any).startTime || item.startTime }}
                                                    -
                                                    {{ (item.booking as any).endTime || item.endTime }}
                                                </template>

                                                <template v-else>
                                                    {{ item.startTime }}-{{ item.endTime }}
                                                </template>
                                            </div>

                                            <div v-if="item.isBookingStart" class="booking-piece-main">
                                                {{ (item.booking as any).memberName || '未知会员' }}
                                            </div>

                                            <div v-if="item.isBookingStart" class="booking-piece-sub">
                                                {{ (item.booking as any).packageName || '-' }}
                                            </div>

                                            <div v-else class="booking-piece-sub">
                                                占用中
                                            </div>
                                        </div>

                                        <template #overlay>
                                            <a-menu @click="closeContextMenu">
                                                <a-menu-item
                                                    key="delete"
                                                    @click="handleDeleteBooking(item.booking as any)"
                                                >
                                                    删除预约
                                                </a-menu-item>
                                            </a-menu>
                                        </template>
                                    </a-dropdown>

                                    <div
                                        v-else
                                        class="slot-item"
                                        :class="[
                                            getSlotClass((item.data as any).status),
                                            { 'slot-drop-target': dragOverSlot === item.startTime },
                                        ]"
                                        @dragover="handleDragOver($event, item.startTime)"
                                        @dragleave="handleDragLeave"
                                        @drop="handleDrop($event, item.startTime)"
                                    >
                                        <div class="slot-time">
                                            {{ item.startTime }}-{{ item.endTime }}
                                        </div>

                                        <a-tag :color="getSlotTagColor((item.data as any).status)">
                                            {{ getSlotStatusText((item.data as any).status) }}
                                        </a-tag>

                                        <div
                                            v-if="
                                                (item.data as any).status ===
                                                ScheduleConstants.SLOT_STATUS_BLOCKED
                                            "
                                            class="slot-extra"
                                        >
                                            不可预约
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </template>

                    <a-modal
                        v-model:open="bookingDetailVisible"
                        title="预约详情"
                        width="500px"
                        @cancel="bookingDetailVisible = false"
                    >
                        <a-descriptions
                            v-if="selectedBooking"
                            bordered
                            size="small"
                            :column="2"
                        >
                            <a-descriptions-item label="会员姓名">
                                {{ selectedBooking.memberName || '-' }}
                            </a-descriptions-item>

                            <a-descriptions-item label="预约时间">
                                {{ selectedBooking.startTime || '-' }} -
                                {{ selectedBooking.endTime || '-' }}
                            </a-descriptions-item>

                            <a-descriptions-item label="预约号">
                                {{ selectedBooking.bookingNo || '-' }}
                            </a-descriptions-item>

                            <a-descriptions-item label="课程名称">
                                {{ selectedBooking.packageName || '-' }}
                            </a-descriptions-item>

                            <a-descriptions-item label="时长">
                                {{ selectedBooking.duration || 0 }} 分钟
                            </a-descriptions-item>

                            <a-descriptions-item label="状态">
                                <a-tag color="blue">已预约</a-tag>
                            </a-descriptions-item>
                        </a-descriptions>
                    </a-modal>
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
    Dropdown as ADropdown,
    Empty as AEmpty,
    Form as AForm,
    InputNumber as AInputNumber,
    Menu as AMenu,
    Modal as AModal,
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
const AMenuItem = AMenu.Item;

interface ScheduleTableRow extends CoachScheduleRowVO {
    [key: string]: unknown;
}

interface SlotViewItem {
    type: 'booking' | 'slot';
    time: string;
    startTime: string;
    endTime: string;
    data: Record<string, unknown>;
    booking?: Record<string, unknown>;
    bookingId?: string;
    color?: string;
    isBookingStart?: boolean;
    isBookingEnd?: boolean;
}

const BOOKING_COLORS = [
    '#1677ff',
    '#722ed1',
    '#eb2f96',
    '#fa8c16',
    '#13c2c2',
    '#52c41a',
    '#2f54eb',
    '#fa541c',
];

const loading = ref(false);
const detailLoading = ref(false);
const detailDrawerOpen = ref(false);

const overview = ref<AdminScheduleOverviewVO | null>(null);

const selectedCoach = ref<CoachScheduleRowVO | null>(null);
const selectedDay = ref<CoachDayScheduleVO | null>(null);
const selectedBooking = ref<Record<string, unknown> | null>(null);
const bookingDetailVisible = ref(false);
const contextMenuVisible = ref(false);
const draggingBooking = ref<Record<string, unknown> | null>(null);
const dragOverSlot = ref<string | null>(null);

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

const groupedSlots = computed(() => {
    if (!selectedDay.value?.slots?.length) {
        return {morning: [], afternoon: []};
    }

    const morning: typeof selectedDay.value.slots = [];
    const afternoon: typeof selectedDay.value.slots = [];

    for (const slot of selectedDay.value.slots) {
        const startTime = getSlotStartTime(slot as Record<string, unknown>);
        const hourStr = startTime.split(':')[0];
        const hour = parseInt(hourStr, 10);

        if (!isNaN(hour) && hour < 12) {
            morning.push(slot);
        } else {
            afternoon.push(slot);
        }
    }

    return {morning, afternoon};
});

const morningSlotViews = computed<SlotViewItem[]>(() => {
    return buildSlotViews(
        groupedSlots.value.morning as Record<string, unknown>[],
    );
});

const afternoonSlotViews = computed<SlotViewItem[]>(() => {
    return buildSlotViews(
        groupedSlots.value.afternoon as Record<string, unknown>[],
    );
});

/**
 * 单元格组件。
 *
 * 当前展示内容：
 * 1. 当日预约数量
 * 2. 当日工作时间
 *
 * 状态不再通过“正常 / 可 / 约 / 锁”等文案表达，
 * 而是通过 day-normal / day-booked / day-leave / day-rest / day-empty 的颜色区分。
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
                    [
                        h('div', {class: 'day-booking-count'}, '0 个预约'),
                        h('div', {class: 'work-time'}, '-'),
                    ],
                );
            }

            if (!day.hasSchedule) {
                return h(
                    'div',
                    {
                        class: ['day-cell', 'day-empty'],
                        onClick: () => emit('click'),
                    },
                    [
                        h('div', {class: 'day-booking-count'}, '0 个预约'),
                        h('div', {class: 'work-time'}, '-'),
                    ],
                );
            }

            const isRestDay = day.isRestDay === ScheduleConstants.REST_DAY_YES;

            const isLeave =
                day.isLeave === ScheduleConstants.SCHEDULE_STATUS_LEAVE;

            const cls = [
                'day-cell',
                isRestDay
                    ? 'day-rest'
                    : isLeave
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
                    h(
                        'div',
                        {class: 'day-booking-count'},
                        `${day.bookings?.length || 0} 个预约`,
                    ),

                    h(
                        'div',
                        {class: 'work-time'},
                        formatWorkTime(day),
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

function parseSlotRange(slot?: string) {
    if (!slot) {
        return {
            startTime: '',
            endTime: '',
        };
    }

    const [startTime = '', endTime = ''] = slot.split('-');

    return {
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
    };
}

function getSlotStartTime(slot: Record<string, unknown>) {
    const startTime = normalizeTime(slot.startTime as string | undefined);

    if (startTime) {
        return startTime;
    }

    return parseSlotRange(slot.slot as string | undefined).startTime;
}

function getSlotEndTime(slot: Record<string, unknown>) {
    const endTime = normalizeTime(slot.endTime as string | undefined);

    if (endTime) {
        return endTime;
    }

    return parseSlotRange(slot.slot as string | undefined).endTime;
}

function getSlotDisplayTime(slot: Record<string, unknown>) {
    const startTime = getSlotStartTime(slot);
    const endTime = getSlotEndTime(slot);

    if (startTime && endTime) {
        return `${startTime}-${endTime}`;
    }

    return String(slot.slot || '');
}

function buildBookingMap() {
    const bookings = (selectedDay.value?.bookings || []) as Record<
        string,
        unknown
    >[];

    const map = new Map<string, Record<string, unknown>>();

    for (const booking of bookings) {
        const bookingId = booking.bookingId ? String(booking.bookingId) : '';
        const bookingNo = booking.bookingNo ? String(booking.bookingNo) : '';

        if (bookingId) {
            map.set(bookingId, booking);
        }

        if (bookingNo) {
            map.set(bookingNo, booking);
        }
    }

    return map;
}

function getBookingColor(index: number) {
    return BOOKING_COLORS[index % BOOKING_COLORS.length];
}

function getBookingSlotStyle(color?: string) {
    return {
        '--booking-color': color || BOOKING_COLORS[0],
    };
}

function buildSlotViews(slots: Record<string, unknown>[]): SlotViewItem[] {
    const bookingMap = buildBookingMap();

    const bookingIds = Array.from(
        new Set(
            slots
                .filter((slot) => {
                    return (
                        slot.status === ScheduleConstants.SLOT_STATUS_BOOKED &&
                        (slot.bookingId || slot.bookingNo)
                    );
                })
                .map((slot) => String(slot.bookingId || slot.bookingNo)),
        ),
    );

    const bookingColorMap = new Map<string, string>();

    bookingIds.forEach((bookingId, index) => {
        bookingColorMap.set(bookingId, getBookingColor(index));
    });

    const result: SlotViewItem[] = slots.map((slot) => {
        const startTime = getSlotStartTime(slot);
        const endTime = getSlotEndTime(slot);
        const time = getSlotDisplayTime(slot);

        const rawBookingId = slot.bookingId || slot.bookingNo;
        const bookingId = rawBookingId ? String(rawBookingId) : '';

        const isBooked =
            slot.status === ScheduleConstants.SLOT_STATUS_BOOKED && bookingId;

        if (!isBooked) {
            return {
                type: 'slot',
                time,
                startTime,
                endTime,
                data: slot,
            };
        }

        const booking =
            bookingMap.get(bookingId) ||
            ({
                bookingId: slot.bookingId,
                bookingNo: slot.bookingNo,
                memberId: slot.memberId,
                memberName: slot.memberName,
                packageName: slot.packageName,
                startTime,
                endTime,
            } as Record<string, unknown>);

        return {
            type: 'booking',
            time,
            startTime,
            endTime,
            data: slot,
            booking,
            bookingId,
            color: bookingColorMap.get(bookingId),
        };
    });

    const bookingSlotMap = new Map<string, SlotViewItem[]>();

    for (const item of result) {
        if (item.type !== 'booking' || !item.bookingId) {
            continue;
        }

        const list = bookingSlotMap.get(item.bookingId) || [];
        list.push(item);
        bookingSlotMap.set(item.bookingId, list);
    }

    for (const [, items] of bookingSlotMap) {
        items.sort((a, b) => a.startTime.localeCompare(b.startTime));

        items.forEach((item, index) => {
            item.isBookingStart = index === 0;
            item.isBookingEnd = index === items.length - 1;
        });
    }

    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
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

function handleBookingClick(booking: Record<string, unknown>) {
    selectedBooking.value = booking;
    bookingDetailVisible.value = true;
}

function closeContextMenu() {
    contextMenuVisible.value = false;
}

async function handleDeleteBooking(booking: Record<string, unknown>) {
    if (!booking) return;

    const bookingNo = booking.bookingNo as string | undefined;

    if (!bookingNo) {
        message.warning('预约号为空');
        return;
    }

    contextMenuVisible.value = false;

    message.warning({
        content: `删除预约功能需后端接口支持，预约号: ${bookingNo}`,
        duration: 3,
    });
}

function handleDragStart(e: DragEvent, booking: Record<string, unknown>) {
    draggingBooking.value = booking;

    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
    }
}

function handleDragEnd() {
    draggingBooking.value = null;
    dragOverSlot.value = null;
}

function handleDragOver(e: DragEvent, slotTime: string) {
    e.preventDefault();
    dragOverSlot.value = slotTime;
}

function handleDragLeave() {
    dragOverSlot.value = null;
}

function handleDrop(e: DragEvent, targetSlotTime: string) {
    e.preventDefault();

    if (!draggingBooking.value) return;

    const originalTime = draggingBooking.value.startTime;

    if (originalTime === targetSlotTime) {
        draggingBooking.value = null;
        dragOverSlot.value = null;
        return;
    }

    message.warning({
        content: `拖动修改时间功能需后端接口支持，从 ${originalTime} 移动到 ${targetSlotTime}`,
        duration: 3,
    });

    draggingBooking.value = null;
    dragOverSlot.value = null;
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
    display: flex;
    min-height: 72px;
    padding: 10px 8px;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: transform 0.18s ease,
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

.day-booking-count {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--sv-text);
    text-align: center;
}

.work-time {
    font-size: 12px;
    line-height: 1.2;
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
    gap: 8px;
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

.slot-section {
    margin-bottom: 20px;
}

.slot-section:last-child {
    margin-bottom: 0;
}

.slot-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 8px 12px;
    color: var(--sv-text);
    background: var(--sv-bg-soft);
    border-radius: 6px;
}

.slot-section-title {
    font-size: 14px;
    font-weight: 600;
}

.slot-section-count {
    font-size: 12px;
    color: var(--sv-text-secondary);
}

.slot-item {
    min-height: 92px;
    padding: 10px;
    color: var(--sv-text);
    background: var(--sv-bg-card);
    border: 1px solid var(--sv-border);
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.slot-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--sv-shadow-hover);
}

.slot-drop-target {
    border-color: #1677ff;
    border-width: 2px;
    border-style: dashed;
    background: color-mix(in srgb, #1677ff 8%, var(--sv-bg-card));
}

/* Booking occupied slot pieces */
.booking-slot-piece {
    position: relative;
    overflow: hidden;
    color: var(--sv-text);
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--booking-color) 28%, var(--sv-bg-card)) 0%,
        color-mix(in srgb, var(--booking-color) 14%, var(--sv-bg-card)) 100%
    );
    border-color: color-mix(in srgb, var(--booking-color) 60%, var(--sv-border));
    box-shadow: inset 4px 0 0 var(--booking-color);
}

.booking-slot-piece::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: '';
    background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--booking-color) 10%, transparent),
        transparent 58%
    );
}

.booking-slot-piece:hover {
    border-color: var(--booking-color);
    box-shadow: inset 4px 0 0 var(--booking-color),
    0 6px 18px color-mix(in srgb, var(--booking-color) 28%, transparent);
}

.booking-slot-start {
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

.booking-slot-middle {
    opacity: 0.92;
}

.booking-slot-end {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
}

.booking-piece-time {
    position: relative;
    z-index: 1;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--sv-text);
}

.booking-piece-main {
    position: relative;
    z-index: 1;
    font-size: 13px;
    font-weight: 700;
    color: var(--sv-text);
}

.booking-piece-sub {
    position: relative;
    z-index: 1;
    margin-top: 4px;
    font-size: 12px;
    color: var(--sv-text-secondary);
}

.booking-slot-piece.booking-dragging {
    opacity: 0.7;
    transform: scale(1.04);
    box-shadow: inset 4px 0 0 var(--booking-color),
    0 8px 24px color-mix(in srgb, var(--booking-color) 36%, transparent);
}

/* Legacy booking block styles: retained for compatibility */
.booking-block {
    min-height: 92px;
    padding: 10px;
    color: var(--sv-text);
    background: linear-gradient(
        135deg,
        var(--sv-book-bg) 0%,
        color-mix(in srgb, #1677ff 20%, var(--sv-bg-card)) 100%
    );
    border: 2px solid var(--sv-book-border);
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.booking-block:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgb(22 119 255 / 30%);
    border-color: #40a9ff;
}

.booking-block.dragging,
.booking-block.booking-dragging {
    opacity: 0.7;
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgb(22 119 255 / 40%);
}

.booking-block .booking-time {
    margin-bottom: 6px;
    font-weight: 600;
}

.booking-block .booking-info {
    margin-top: 6px;
    font-size: 12px;
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
