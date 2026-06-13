<template>
    <div class="schedule-overview-page">
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
                            :class="[
                getSlotClass(slot.status),
                slot.status === ScheduleConstants.SLOT_STATUS_AVAILABLE ? 'slot-clickable' : ''
              ]"
                            @click="openBookingModal(slot)"
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
                            <div
                                v-else-if="slot.status === ScheduleConstants.SLOT_STATUS_AVAILABLE"
                                class="slot-extra"
                            >
                                点击预约
                            </div>
                        </div>
                    </div>
                </template>

                <a-empty v-else description="请选择某天查看详情"/>
            </a-spin>
        </a-drawer>

        <!-- 创建预约弹窗 -->
        <a-modal
            v-model:open="bookingModalOpen"
            title="创建预约"
            width="640px"
            :footer="null"
            destroy-on-close
        >
            <div class="booking-modal-content">
                <a-steps :current="bookingStep" class="mb-6">
                    <a-step title="选择会员"/>
                    <a-step title="选择课程"/>
                    <a-step title="确认预约"/>
                </a-steps>

                <!-- 步骤1：选择会员 -->
                <div v-show="bookingStep === 0" class="step-content">
                    <a-form layout="vertical">
                        <a-form-item label="搜索会员">
                            <a-select
                                v-model:value="bookingForm.memberId"
                                placeholder="输入手机号、姓名或昵称搜索会员"
                                style="width: 100%"
                                show-search
                                :filter-option="false"
                                :not-found-content="memberSearchLoading ? '搜索中...' : '未找到匹配会员'"
                                :loading="memberSearchLoading"
                                @search="handleMemberSearch"
                                @focus="handleSearchFocus"
                            >
                                <!-- ✅ 修复点：去掉 #options，直接渲染 a-select-option -->
                                <a-select-option
                                    v-for="member in memberOptions"
                                    :key="member.id"
                                    :value="member.id"
                                >
                                    <div class="member-option">
                    <span class="member-name">
                      {{ member.name || member.nickname || '未命名' }}
                    </span>
                                        <span class="member-phone">{{ member.phone }}</span>
                                        <a-tag :color="getMatchTypeColor(member.matchType)" class="match-type-tag">
                                            {{ getMatchTypeText(member.matchType) }}
                                        </a-tag>
                                    </div>
                                </a-select-option>
                                <template #emptyIcon>
                                    <SearchOutlined/>
                                </template>
                            </a-select>
                        </a-form-item>
                        <div v-if="!memberSearched && memberOptions.length === 0" class="search-hint">
                            <InfoCircleOutlined/>
                            输入手机号、姓名或昵称后自动搜索
                        </div>
                    </a-form>
                    <div class="step-actions">
                        <a-button @click="cancelBooking">取消</a-button>
                        <a-button
                            type="primary"
                            :disabled="!bookingForm.memberId"
                            @click="nextStep"
                        >
                            下一步
                        </a-button>
                    </div>
                </div>

                <!-- 步骤2：选择课程（两层列表展示） -->
                <div v-show="bookingStep === 1" class="step-content">
                    <div v-if="packageLoading" class="list-loading">
                        <a-spin tip="加载权益卡中..."/>
                    </div>

                    <div v-else-if="packagesForDisplay.length === 0" class="empty-tip">
                        该会员暂无可用的课程权益
                    </div>

                    <div v-else class="package-list">
                        <template v-for="pkg in packagesForDisplay" :key="String(pkg.id)">
                            <!-- 组合卡：可展开/收起；点击展开后展示子卡 -->
                            <div v-if="String(pkg.cardType ?? '').toUpperCase().trim() === 'COMBO'" class="package-item combo-package">
                                <div
                                    class="package-row combo-header"
                                    :class="{ expanded: expandedComboIds.has(String(pkg.id)) }"
                                    @click="toggleComboExpand(String(pkg.id))"
                                >
                                    <span class="package-expand-icon">{{ expandedComboIds.has(String(pkg.id)) ? '▼' : '▶' }}</span>
                                    <span class="package-title">{{ pkg.packageName || '组合卡' }}</span>
                                    <a-tag color="blue" class="package-tag-sm">组合卡</a-tag>
                                    <span class="package-count-hint">
                                        {{ getCourseChildrenCount(pkg) }} 张可用课程子卡
                                    </span>
                                </div>
                                <div v-if="expandedComboIds.has(String(pkg.id))" class="combo-children">
                                    <template v-if="getCourseChildrenOfCombo(pkg).length > 0">
                                        <div
                                            v-for="subPkg in getCourseChildrenOfCombo(pkg)"
                                            :key="String(subPkg.id)"
                                            class="package-row course-child-row"
                                            :class="{ selected: bookingForm.packageId === `${String(pkg.id)}_${String(subPkg.id)}` }"
                                            @click="selectComboChildPackage(pkg, subPkg)"
                                        >
                                            <span class="package-child-dot">◆</span>
                                            <span class="package-title">{{ subPkg.packageName || '课程卡' }}</span>
                                            <span class="package-times">
                                                剩余 {{ resolveCourseRemainingSafe(subPkg) }} 次
                                            </span>
                                            <template v-if="bookingForm.packageId === `${String(pkg.id)}_${String(subPkg.id)}`">
                                                <a-tag color="green" class="selected-tag">已选择</a-tag>
                                            </template>
                                        </div>
                                    </template>
                                    <div v-else class="empty-children">
                                        该组合卡下没有可用的课程子卡
                                    </div>
                                </div>
                            </div>

                            <!-- 独立课程卡：直接点击选择 -->
                            <div v-else-if="String(pkg.cardType ?? '').toUpperCase().trim() === 'COURSE'"
                                 class="package-item standalone-course"
                            >
                                <div
                                    class="package-row course-row"
                                    :class="{ selected: bookingForm.packageId === String(pkg.id) }"
                                    @click="selectStandalonePackage(pkg)"
                                >
                                    <span class="package-course-icon">📚</span>
                                    <span class="package-title">{{ pkg.packageName || '课程卡' }}</span>
                                    <a-tag class="package-tag-sm">课程卡</a-tag>
                                    <span class="package-times">
                                        剩余 {{ resolveCourseRemainingSafe(pkg) }} 次
                                    </span>
                                    <template v-if="bookingForm.packageId === String(pkg.id)">
                                        <a-tag color="green" class="selected-tag">已选择</a-tag>
                                    </template>
                                </div>
                            </div>
                        </template>
                    </div>

                    <div class="step-actions">
                        <a-button @click="prevStep">上一步</a-button>
                        <a-button
                            type="primary"
                            :disabled="!bookingForm.packageId"
                            @click="nextStep"
                        >
                            下一步
                        </a-button>
                    </div>
                </div>

                <!-- 步骤3：确认预约 -->
                <div v-show="bookingStep === 2" class="step-content">
                    <a-descriptions bordered :column="1" size="small">
                        <a-descriptions-item label="会员">
                            {{ selectedMemberName }}
                        </a-descriptions-item>
                        <a-descriptions-item label="教练">
                            {{ selectedCoach?.coachName }}
                        </a-descriptions-item>
                        <a-descriptions-item label="日期">
                            {{ selectedDay?.date }}
                        </a-descriptions-item>
                        <a-descriptions-item label="预约时间">
                            {{ bookingTimeRange }}
                        </a-descriptions-item>
                        <a-descriptions-item label="课程时长">
                            {{ selectedCourseDuration }} 分钟
                        </a-descriptions-item>
                        <a-descriptions-item label="课程/套餐">
                            {{ selectedPackageName }}
                        </a-descriptions-item>
                    </a-descriptions>
                    <div class="step-actions">
                        <a-button @click="prevStep">上一步</a-button>
                        <a-button type="primary" :loading="submitLoading" @click="submitBooking">
                            确认预约
                        </a-button>
                    </div>
                </div>
            </div>
        </a-modal>
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
    Modal as AModal,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Step as AStep,
    Steps as ASteps,
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
import { batchGetFilePreviewApi } from '#/api/file';
import {
    type MemberSearchRequest,
    type MemberSearchResultDTO,
    searchAdminMembersApi,
} from '#/api/member/member';

import { getAdminPackagesByMemberIdApi, type AdminMemberPackageListDTO } from '#/api/member-packages/member-packages';

import { createAdminBookingApi, type AdminCreateBookingDTO } from '#/api/booking/bookings';

import {normalizePageResult} from "#/api/_shared/page";

import {InfoCircleOutlined, SearchOutlined} from '@ant-design/icons-vue';

import dayjs from 'dayjs';
import {computed, defineComponent, h, onMounted, reactive, ref} from 'vue';

const AFormItem = AForm.Item;
const ARangePicker = ADatePicker.RangePicker;
const ADescriptionsItem = ADescriptions.Item;
const AListItem = AList.Item;
const AListItemMeta = AList.Item.Meta;
const ASelectOption = ASelect.Option;

interface ScheduleTableRow extends CoachScheduleRowVO {
    [key: string]: unknown;
}

const loading = ref(false);
const detailLoading = ref(false);
const detailDrawerOpen = ref(false);

/** ✅ 修复点：ID 改为 string，和 member.ts 一致 */
const venueOptions = ref<Array<{ id: string; name: string }>>([]);

/** 教练头像 fileId -> previewUrl */
const coachAvatarPreviewMap = reactive(new Map<string, string>());

const overview = ref<AdminScheduleOverviewVO | null>(null);

const selectedCoach = ref<CoachScheduleRowVO | null>(null);
const selectedDay = ref<CoachDayScheduleVO | null>(null);
const selectedSlot = ref<AdminScheduleSlotVO | null>(null);

// 预约创建弹窗
const bookingModalOpen = ref(false);
// 预约选项接口（扁平化的可选项，用于选中项查找、提交时的解析）
interface BookingPackageOption {
    /** 前端唯一 key。独立卡=packageId；组合卡子卡=parentPackageId_packageId */
    id: string;
    /** 真正扣次的权益卡 id（独立课程卡=自身；组合卡=子卡） */
    packageId: string;
    /** 组合卡父卡 id；仅在组合卡子卡场景下有值 */
    parentPackageId?: string;
    /** 显示的卡名；独立卡=卡名；组合卡=子卡名 */
    packageName: string;
    /** 父卡名，仅用于 UI 拼接展示 */
    parentName?: string;
    courseRemainingTimes: number | null;
    cardType: string;
    /** ROOT/CHILD/SINGLE */
    packageRole: string;
    /** 课程时长（分钟），从权益卡模板/后端返回的 courseDuration 取 */
    courseDuration?: number;
}

const bookingStep = ref(0);
const submitLoading = ref(false);
const memberSearchLoading = ref(false);
const memberSearched = ref(false);
const memberOptions = ref<MemberSearchResultDTO[]>([]);
const packageOptions = ref<BookingPackageOption[]>([]);
const packageLoading = ref(false);

/** 用于两层列表展示：保留后端返回的原始卡结构（含 subPackages），过滤掉 VENUE */
const packagesForDisplay = ref<any[]>([]);
/** 已展开的组合卡 id 集合（用于控制列表展开状态） */
const expandedComboIds = reactive(new Set<string>());

let searchTimer: number | null = null;

const bookingForm = reactive({
    memberId: undefined as string | undefined,
    packageId: undefined as string | undefined,
});

const queryForm = reactive({
    venueId: undefined as string | undefined,
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

            const isLeave = day.isLeave === ScheduleConstants.SCHEDULE_STATUS_LEAVE;

            const cls = [
                'day-cell',
                isLeave ? 'day-leave' : day.bookedSlots > 0 ? 'day-booked' : 'day-normal',
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
                        h('span', {class: 'stat stat-available'}, `可 ${day.availableSlots || 0}`),
                        h('span', {class: 'stat stat-booked'}, `约 ${day.bookedSlots || 0}`),
                        h('span', {class: 'stat stat-blocked'}, `锁 ${day.blockedSlots || 0}`),
                    ]),
                    h('div', {class: 'day-booking-count'}, `${day.bookings?.length || 0} 个预约`),
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
    if (!isDayColumn(dataIndex)) return undefined;
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
    if (!value) return '';
    return value.length >= 5 ? value.slice(0, 5) : value;
}

function formatWorkTime(day?: CoachDayScheduleVO | null) {
    if (!day?.workStartTime || !day?.workEndTime) return '-';
    return `${normalizeTime(day.workStartTime)}-${normalizeTime(day.workEndTime)}`;
}

function getSlotTagColor(status?: string) {
    if (status === ScheduleConstants.SLOT_STATUS_AVAILABLE) return 'green';
    if (status === ScheduleConstants.SLOT_STATUS_BOOKED) return 'blue';
    if (status === ScheduleConstants.SLOT_STATUS_BLOCKED) return 'orange';
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
    loading.value = true;
    try {
        const params: Record<string, unknown> = {includeSlots: false};
        if (queryForm.venueId !== undefined) params.venueId = queryForm.venueId;
        if (dateRange.value?.[0]) params.startDate = dateRange.value[0];
        if (dateRange.value?.[1]) params.endDate = dateRange.value[1];
        overview.value = await getAdminScheduleOverviewApi(params);

        // 教练头像 fileId -> previewUrl
        const coaches = overview.value?.coaches || [];
        const fileIds: string[] = [];
        coaches.forEach((coach) => {
            const avatar = coach.coachAvatar;
            if (avatar && /^\d+$/.test(String(avatar))) {
                fileIds.push(String(avatar));
            }
        });

        if (fileIds.length > 0) {
            try {
                const results = await batchGetFilePreviewApi({fileIds});
                coachAvatarPreviewMap.clear();
                results.forEach((item) => {
                    coachAvatarPreviewMap.set(String(item.fileId), item.previewUrl);
                });
            } catch (e) {
                console.error('批量获取教练头像失败:', e);
            }
        }
    } finally {
        loading.value = false;
    }
}

function handleReset() {
    queryForm.venueId = undefined;
    dateRange.value = undefined;
    overview.value = null;
}

async function loadVenueOptions() {
    try {
        venueOptions.value = await getVenueOptionsApi();

        // 默认选择第一个场馆（用户未主动选择时）
        if (
            (queryForm.venueId === undefined || queryForm.venueId === null || queryForm.venueId === '') &&
            venueOptions.value.length > 0
        ) {
            queryForm.venueId = venueOptions.value[0].id;
        }
    } catch (e) {
        console.error('加载场馆列表失败:', e);
    }
}

async function handleOpenDayDetail(coach: CoachScheduleRowVO, day?: CoachDayScheduleVO) {
    if (!day) return;
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
        if (detailCoach) selectedCoach.value = detailCoach;
        if (detailDay) selectedDay.value = detailDay;
    } finally {
        detailLoading.value = false;
    }
}

// ==================== 预约创建相关 ====================

const selectedMemberName = computed(() => {
    const member = memberOptions.value.find((m) => String(m.id) === String(bookingForm.memberId));
    return member?.name || member?.nickname || '-';
});

const selectedPackageName = computed(() => {
    const pkg = packageOptions.value.find((p) => String(p.id) === String(bookingForm.packageId));
    if (!pkg) return '-';
    return pkg.parentName ? `${pkg.parentName} - ${pkg.packageName}` : pkg.packageName;
});

/**
 * 选中的课程时长（分钟）：
 * - 优先使用权益卡模板返回的 courseDuration
 * - 若未返回，则用当前 slot 的 endTime - startTime 兜底
 */
const selectedCourseDuration = computed(() => {
    const pkg = packageOptions.value.find((p) => String(p.id) === String(bookingForm.packageId));
    if (pkg && typeof pkg.courseDuration === 'number' && pkg.courseDuration > 0) {
        return pkg.courseDuration;
    }
    if (selectedSlot.value) {
        const start = dayjs(selectedSlot.value.startTime, 'HH:mm');
        const end = dayjs(selectedSlot.value.endTime, 'HH:mm');
        return end.diff(start, 'minute');
    }
    return 0;
});

/**
 * 预约时间范围：startTime + courseDuration -> 结束时间
 * 例：10:00 + 45分钟 -> "10:00 - 10:45"
 */
const bookingTimeRange = computed(() => {
    if (!selectedSlot.value) return '-';
    const startTime = selectedSlot.value.startTime;
    const start = dayjs(startTime, 'HH:mm');
    const end = start.add(selectedCourseDuration.value, 'minute');
    const endTime = end.format('HH:mm');
    return `${startTime} - ${endTime}`;
});

async function handleMemberSearch(value: string) {
    if (!value || value.length < 1) {
        memberOptions.value = [];
        memberSearched.value = false;
        return;
    }

    if (searchTimer) clearTimeout(searchTimer);

    searchTimer = window.setTimeout(async () => {
        memberSearchLoading.value = true;
        try {
            const params: MemberSearchRequest = {
                phone: value,
                name: value,
                nickname: value,
                page: 1,
                pageSize: 20,
            };

            const res = await searchAdminMembersApi(params);
            const data = (res as any).data || res;
            const normalized = normalizePageResult(data);

            memberOptions.value = normalized.list || [];
            memberSearched.value = true;

            if (memberOptions.value.length === 0) {
                message.info('未找到匹配的会员');
            }
        } catch {
            message.error('搜索会员失败');
        } finally {
            memberSearchLoading.value = false;
        }
    }, 300);
}

function handleSearchFocus() {
    if (memberOptions.value.length > 0) return;
    memberSearched.value = false;
}

function getMatchTypeColor(matchType: string) {
    switch (matchType) {
        case 'PHONE':
            return 'blue';
        case 'NAME':
            return 'green';
        case 'NICKNAME':
            return 'orange';
        default:
            return 'default';
    }
}

function getMatchTypeText(matchType: string) {
    switch (matchType) {
        case 'PHONE':
            return '手机号匹配';
        case 'NAME':
            return '姓名匹配';
        case 'NICKNAME':
            return '昵称匹配';
        default:
            return '匹配';
    }
}

/**
 * 安全获取「课程剩余次数」
 * - 优先取 courseRemainingTimes
 * - 若缺失/null，则用 courseTotalTimes - courseUsedTimes 兜底
 */
function resolveCourseRemaining(pkg: {
    courseRemainingTimes?: number | null;
    courseTotalTimes?: number | null;
    courseUsedTimes?: number;
}): number {
    if (typeof pkg.courseRemainingTimes === 'number' && Number.isFinite(pkg.courseRemainingTimes)) {
        return pkg.courseRemainingTimes;
    }
    const total = typeof pkg.courseTotalTimes === 'number' ? pkg.courseTotalTimes : 0;
    const used = typeof pkg.courseUsedTimes === 'number' ? pkg.courseUsedTimes : 0;
    return Math.max(0, total - used);
}

/** 模板中使用：返回剩余次数的字符串；和 resolveCourseRemaining 逻辑一致 */
function resolveCourseRemainingSafe(pkg: any): number {
    return resolveCourseRemaining(pkg || {});
}

/** 获取组合卡下的 COURSE 类型子卡数组（仅剩余次数 > 0 的） */
function getCourseChildrenOfCombo(comboPkg: any): any[] {
    const subPackages = Array.isArray((comboPkg as any)?.subPackages)
        ? (comboPkg as any).subPackages
        : [];
    return subPackages.filter((sub: any) => {
        const cardType = String((sub as any).cardType ?? '').toUpperCase().trim();
        if (cardType !== 'COURSE') return false;
        const remaining = resolveCourseRemainingSafe(sub);
        return remaining > 0;
    });
}

/** 组合卡：返回可用子卡数量 */
function getCourseChildrenCount(comboPkg: any): number {
    return getCourseChildrenOfCombo(comboPkg).length;
}

/** 切换组合卡展开/收起状态 */
function toggleComboExpand(comboId: string) {
    if (expandedComboIds.has(comboId)) {
        expandedComboIds.delete(comboId);
    } else {
        expandedComboIds.add(comboId);
    }
}

/** 选择独立课程卡：设置 packageId 为其自身 id */
function selectStandalonePackage(pkg: any) {
    bookingForm.packageId = String(pkg.id);
    console.log(`[选择课程卡] id=${bookingForm.packageId}, name=${pkg.packageName}`);
}

/** 选择组合卡子卡：设置 packageId 为 `${父卡id}_${子卡id}` */
function selectComboChildPackage(comboPkg: any, subPkg: any) {
    bookingForm.packageId = `${String(comboPkg.id)}_${String(subPkg.id)}`;
    console.log(`[选择组合卡子卡] id=${bookingForm.packageId}, parent=${comboPkg.packageName}, child=${subPkg.packageName}`);
}

/**
 * 处理会员权益卡数据，转换为预约选项格式（精确匹配 cardType 枚举）
 *  - VENUE：场地卡，不用于约课，直接跳过
 *  - COMBO：组合卡，必须展开子卡，只取 COURSE 类型的子卡
 *  - COURSE：独立课程卡，直接加入选项
 *  - courseRemainingTimes 为 null/undefined 时，使用 courseTotalTimes - courseUsedTimes 兜底
 */
function processPackagesToBookingOptions(packages: AdminMemberPackageListDTO[]): BookingPackageOption[] {
    const options: BookingPackageOption[] = [];

    for (const pkg of packages) {
        // 精确匹配：cardType 应为 'VENUE' | 'COMBO' | 'COURSE'
        const cardType = String(pkg.cardType ?? '').toUpperCase().trim();

        if (cardType === 'VENUE') {
            // VENUE 场地卡 — 不用于约课，跳过
            continue;
        }

        if (cardType === 'COMBO') {
            // COMBO 组合卡 — 必须展开子卡，只取 COURSE 类型的子卡
            const subPackages =
                (Array.isArray((pkg as any)?.subPackages) && (pkg as any).subPackages.length > 0)
                    ? (pkg as any).subPackages
                    : (Array.isArray((pkg as any)?.children) && (pkg as any).children.length > 0)
                        ? (pkg as any).children
                        : (Array.isArray((pkg as any)?.childPackages) && (pkg as any).childPackages.length > 0)
                            ? (pkg as any).childPackages
                            : [];

            if (subPackages.length === 0) {
                console.warn(
                    `[booking] 组合卡「${pkg.packageName ?? pkg.id}」(cardType=COMBO) 没有返回子卡(subPackages)，` +
                        `无法确定扣次目标，已跳过。建议后端返回组合卡的子卡数组。`,
                );
                continue;
            }

            for (const subPkg of subPackages) {
                const subCardType = String((subPkg as any).cardType ?? '').toUpperCase().trim();

                // 子卡必须是 COURSE 类型才加入（VENUE 子卡也跳过）
                if (subCardType !== 'COURSE') continue;

                const remaining = resolveCourseRemaining({
                    courseRemainingTimes: (subPkg as any).courseRemainingTimes,
                    courseTotalTimes: (subPkg as any).courseTotalTimes,
                    courseUsedTimes: (subPkg as any).courseUsedTimes,
                });
                if (remaining <= 0) continue;

                options.push({
                    id: `${String(pkg.id)}_${String(subPkg.id)}`,
                    packageId: String(subPkg.id),        // 扣次目标 = 子卡 ID
                    parentPackageId: String(pkg.id),     // 组合卡父卡 ID = 虚拟容器 ID
                    packageName: subPkg.packageName || '子卡',
                    parentName: pkg.packageName,
                    courseRemainingTimes: remaining,
                    cardType: subCardType,
                    packageRole: String((subPkg as any).packageRole ?? 'CHILD'),
                    courseDuration: (subPkg as any).courseDuration,
                });
            }
            continue;
        }

        if (cardType === 'COURSE') {
            // COURSE 独立课程卡 — 直接加入选项
            const remaining = resolveCourseRemaining(pkg);
            if (remaining <= 0) continue;

            options.push({
                id: String(pkg.id),
                packageId: String(pkg.id),
                packageName: pkg.packageName,
                courseRemainingTimes: remaining,
                cardType: cardType,
                packageRole: String((pkg as any).packageRole ?? 'SINGLE'),
                courseDuration: (pkg as any).courseDuration,
            });
            continue;
        }

        // 未知 cardType — 打印警告并跳过
        console.warn(
            `[booking] 未知 cardType="${cardType}"，权益卡「${pkg.packageName ?? pkg.id}」已跳过。` +
                `期望的值为: VENUE, COMBO, COURSE`,
        );
    }

    return options;
}

async function nextStep() {
    if (bookingStep.value === 0 && bookingForm.memberId) {
        packageLoading.value = true;
        bookingForm.packageId = undefined;

        // 🔍 关键诊断：打印会员 ID 的类型和值
        console.log('%c[booking-nextStep] === 开始获取权益卡 ===', 'background:#1976d2;color:#fff;font-weight:bold;padding:4px 8px;');
        console.log(`[booking-nextStep] 当前会员 ID 值:`, bookingForm.memberId);
        console.log(`[booking-nextStep] 当前会员 ID 类型:`, typeof bookingForm.memberId);
        console.log(`[booking-nextStep] String(会员ID) =`, String(bookingForm.memberId));

        // 查找当前会员名称
        const currentMember = memberOptions.value.find((m) => String(m.id) === String(bookingForm.memberId));
        console.log(`[booking-nextStep] 当前匹配到的会员:`, currentMember);

        try {
            const packages = await getAdminPackagesByMemberIdApi(String(bookingForm.memberId));

            // 处理权益卡数据
            // 1. packagesForDisplay：保留原始层级，仅过滤 VENUE（用于两层列表展示）
            packagesForDisplay.value = (packages || []).filter(
                (pkg: any) => String(pkg.cardType ?? '').toUpperCase().trim() !== 'VENUE',
            );
            // 2. packageOptions：扁平化选项（独立卡 + 组合卡子卡），用于 selectedPackageName 和 submitBooking 查找
            packageOptions.value = processPackagesToBookingOptions(packages || []);

            // 重置展开状态和选择
            expandedComboIds.clear();
            bookingForm.packageId = undefined;

            if (packageOptions.value.length === 0) {
                message.warning('该会员暂无可用的课程权益');
            }
        } catch (e) {
            console.error('[booking-nextStep] 获取会员权益异常:', e);
            message.error('获取会员权益失败');
            packageOptions.value = [];
            packagesForDisplay.value = [];
        } finally {
            packageLoading.value = false;
        }

        bookingStep.value = 1;
    } else if (bookingStep.value === 1 && bookingForm.packageId) {
        console.log('[booking-nextStep] 选择的课程 ID:', bookingForm.packageId, '类型:', typeof bookingForm.packageId);
        bookingStep.value = 2;
    }
}


function prevStep() {
    if (bookingStep.value > 0) bookingStep.value--;
}

function openBookingModal(slot: AdminScheduleSlotVO) {
    if (slot.status !== ScheduleConstants.SLOT_STATUS_AVAILABLE) return;

    selectedSlot.value = slot;
    bookingForm.memberId = undefined;
    bookingForm.packageId = undefined;
    bookingStep.value = 0;
    packageOptions.value = [];
    packagesForDisplay.value = [];
    expandedComboIds.clear();
    memberSearched.value = false;
    memberOptions.value = [];
    bookingModalOpen.value = true;
}

function cancelBooking() {
    bookingModalOpen.value = false;
    bookingStep.value = 0;
}

async function submitBooking() {
    if (!selectedSlot.value || !bookingForm.memberId || !bookingForm.packageId) {
        message.warning('请完成所有必填项');
        return;
    }

    // 解析选择的权益卡信息（String 化比较，防止 number/string 类型漂移）
    const selectedPkg = packageOptions.value.find((p) => String(p.id) === String(bookingForm.packageId));
    if (!selectedPkg) {
        message.warning('请选择有效的权益卡');
        return;
    }

    // 获取会员信息
    const selectedMember = memberOptions.value.find((m) => String(m.id) === String(bookingForm.memberId));

    // 课程时长（分钟）：优先使用权益卡模板返回的 courseDuration；与步骤3展示保持一致
    const courseDuration: number = selectedCourseDuration.value;

    submitLoading.value = true;
    try {
        // 构建预约请求参数
        // - 独立课程卡：packageId = 自身 id；parentPackageId = undefined
        // - 组合卡子卡：packageId = 子卡 id（扣次目标）；parentPackageId = 父卡 id（虚拟容器）
        const bookingData: AdminCreateBookingDTO = {
            memberId: bookingForm.memberId,
            memberName: selectedMember?.name || selectedMember?.nickname || undefined,
            venueId: queryForm.venueId || undefined,
            coachId: selectedCoach.value?.coachId || undefined,
            bookingDate: selectedDay.value?.date || undefined,
            startTime: selectedSlot.value.startTime,
            courseDuration: courseDuration,
            packageId: selectedPkg.packageId,
            packageName: selectedPkg.parentName
                ? `${selectedPkg.parentName} - ${selectedPkg.packageName}`
                : selectedPkg.packageName,
            parentPackageId: selectedPkg.parentPackageId, // 仅组合卡场景有值
            status: 2, // 管理后台一般默认为已确认
        };

        console.log('[booking-submit] payload:', bookingData);

        // 调用创建预约API
        await createAdminBookingApi(bookingData);

        message.success('预约创建成功');
        bookingModalOpen.value = false;

        if (selectedCoach.value && selectedDay.value) {
            await handleOpenDayDetail(selectedCoach.value, selectedDay.value);
        }
    } catch (e) {
        console.error('[booking-submit] error:', e);
        message.error('预约创建失败');
    } finally {
        submitLoading.value = false;
    }
}

onMounted(async () => {
    await loadVenueOptions();
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

/* 预约弹窗 */
.slot-clickable {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.slot-clickable:hover {
    transform: translateY(-2px);
    box-shadow: var(--sv-shadow-hover);
}

.booking-modal-content {
    padding: 16px 0;
}

.step-content {
    min-height: 240px;
}

.step-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--ant-color-border-secondary, rgba(120, 120, 120, 0.25));
}

.member-option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    /* 不强制设置文字颜色，让 a-select 自己管理（其下拉项在明/暗主题下自动适配） */
}

.package-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.package-name {
    font-weight: 500;
    flex: 1;
    /* 不强制设置文字颜色 */
}

.package-tag {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    /* 让 a-tag 的默认主题色生效，不再硬编码 */
}

.package-tag.sub-package {
    background: var(--ant-color-warning-bg, rgba(250, 140, 22, 0.08));
    color: var(--ant-color-warning, #fa8c16);
}

.package-times {
    color: var(--ant-color-text-secondary, #999);
    font-size: 12px;
    flex: 0 0 auto;
}

.member-name {
    font-weight: 500;
    flex: 0 0 auto;
    /* 不强制设置颜色，继承 a-select 的主题色 */
}

.member-phone {
    font-size: 12px;
    flex: 1;
    /* 不强制设置颜色 */
}

.match-type-tag {
    margin-left: auto;
}

.search-hint {
    font-size: 12px;
    margin-top: 8px;
    /* 不强制设置颜色，继承页面次级文字色 */
    color: var(--ant-color-text-secondary);
}

.search-hint :deep(svg) {
    margin-right: 4px;
}

.mb-6 {
    margin-bottom: 24px;
}

/* ============ 权益卡两层列表样式（适配黑/白主题） ============ */
.list-loading {
    padding: 24px 0;
    text-align: center;
}

.empty-tip {
    padding: 24px 0;
    text-align: center;
    color: var(--ant-color-text-secondary);
    font-size: 13px;
}

.package-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.package-item {
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--ant-color-border-secondary);
    background: transparent;
    transition: border-color 0.15s ease;
}

.package-item:hover {
    border-color: var(--ant-color-primary);
}

.package-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background 0.15s ease;
}

.package-row:hover {
    background: rgba(22, 119, 255, 0.06);
}

.package-row.selected {
    background: transparent;
    border-left: 3px solid var(--ant-color-primary);
    padding-left: 9px;
    font-weight: 500;
}

.package-expand-icon {
    font-size: 12px;
    color: var(--ant-color-text-secondary);
    width: 16px;
    flex: 0 0 16px;
    text-align: center;
    transition: transform 0.2s ease;
}

.package-course-icon {
    font-size: 16px;
    width: 18px;
    flex: 0 0 18px;
    text-align: center;
}

.package-child-dot {
    font-size: 10px;
    color: var(--ant-color-primary);
    width: 14px;
    flex: 0 0 14px;
    text-align: center;
}

.package-title {
    flex: 1;
    font-weight: 500;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.package-tag-sm {
    flex: 0 0 auto;
    font-size: 11px !important;
}

.package-count-hint {
    flex: 0 0 auto;
    font-size: 12px;
    color: var(--ant-color-text-secondary);
}

.package-times {
    flex: 0 0 auto;
    color: var(--ant-color-text-secondary);
    font-size: 12px;
}

.selected-tag {
    flex: 0 0 auto;
    font-size: 11px !important;
    margin-left: 4px;
}

.combo-header {
    font-weight: 500;
    background: transparent;
}

.combo-header.expanded {
    background: transparent;
}

.combo-header.expanded .package-expand-icon {
    transform: rotate(90deg);
}

.combo-children {
    border-top: 1px dashed var(--ant-color-border-secondary);
    background: transparent;
}

.course-child-row {
    padding-left: 36px;
}

.course-child-row:hover {
    background: rgba(22, 119, 255, 0.06);
}

.course-row {
    background: transparent;
}

.empty-children {
    padding: 10px 36px;
    font-size: 12px;
    color: var(--ant-color-text-secondary);
    font-style: italic;
}
</style>


