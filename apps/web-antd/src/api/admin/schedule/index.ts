import {requestClient} from '#/api/request';

/**
 * 后台排班查询参数
 */
export interface AdminScheduleQueryDTO {
    venueId: string;
    coachId?: string;
    startDate?: string;
    endDate?: string;
    includeSlots?: boolean;
}

/**
 * 后台排班总览
 */
export interface AdminScheduleOverviewVO {
    venueId: string;
    startDate: string;
    endDate: string;
    coaches: CoachScheduleRowVO[];
}

/**
 * 教练排班行
 */
export interface CoachScheduleRowVO {
    coachId?: string;
    coachName?: string;
    coachAvatar?: string;
    days: CoachDayScheduleVO[];
}

/**
 * 某教练某天排班
 */
export interface CoachDayScheduleVO {
    date: string;
    hasSchedule: boolean;

    scheduleId?: number;
    workStartTime?: string;
    workEndTime?: string;

    slotIntervalMinutes?: number;

    isRestDay?: number;

    /**
     * 排班状态：
     * 1-正常，2-请假，3-取消
     */
    isLeave?: number;

    /**
     * 请假类型：
     * 1-全天，2-上午，3-下午
     */
    leaveType?: number;

    leaveReason?: string;

    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    blockedSlots: number;

    bookings?: AdminScheduleBookingVO[];
    slots?: AdminScheduleSlotVO[];
}

/**
 * 时间片
 */
export interface AdminScheduleSlotVO {
    slot?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    bookingId?: number;
    bookingNo?: string;
    memberId?: string;
    memberName?: string;
    packageName?: string;
}

/**
 * 排班中的预约信息
 */
export interface AdminScheduleBookingVO {
    bookingId?: number;
    bookingNo?: string;
    memberId?: string;
    memberName?: string;
    packageId?: number;
    packageName?: string;
    status?: number;
    startTime?: string;
    endTime?: string;
    duration?: number;
}

/**
 * 排班相关常量
 */
export const ScheduleConstants = {
    REST_DAY_NO: 0,
    REST_DAY_YES: 1,

    SCHEDULE_STATUS_NORMAL: 1,
    SCHEDULE_STATUS_LEAVE: 2,
    SCHEDULE_STATUS_CANCELLED: 3,

    LEAVE_TYPE_FULL_DAY: 1,
    LEAVE_TYPE_MORNING: 2,
    LEAVE_TYPE_AFTERNOON: 3,

    SLOT_STATUS_AVAILABLE: 'available',
    SLOT_STATUS_BOOKED: 'booked',
    SLOT_STATUS_BLOCKED: 'blocked',
} as const;

/**
 * 后端 Controller:
 * @RequestMapping("/api/admin/schedules")
 */
const ADMIN_SCHEDULE_API_PREFIX = '/api/admin/schedules';

/**
 * 查询排班总览
 *
 * 通常用于页面初始化：
 * includeSlots=false
 */
export function getAdminScheduleOverviewApi(data: AdminScheduleQueryDTO) {
    return requestClient.post<AdminScheduleOverviewVO>(
        `${ADMIN_SCHEDULE_API_PREFIX}/overview`,
        data,
    );
}

/**
 * 查询某教练某天排班详情
 *
 * 通常用于点击单元格后打开抽屉：
 * includeSlots=true
 */
export function getAdminScheduleDayDetailApi(data: AdminScheduleQueryDTO) {
    return requestClient.post<AdminScheduleOverviewVO>(
        `${ADMIN_SCHEDULE_API_PREFIX}/day-detail`,
        data,
    );
}
