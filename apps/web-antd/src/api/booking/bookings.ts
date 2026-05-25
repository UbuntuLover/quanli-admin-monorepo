import { requestClient } from '#/api/request';
import type { NormalizedPageResult, PageResult } from '#/api/_shared/page';
import { normalizePageResult } from '#/api/_shared/page';

/** =========================
 * 管理后台 - 预约管理 DTO
 * Base: /api/admin/bookings
 * ========================= */

/**
 * 预约状态（按你后端注释）
 * 1-已预约/待确认
 * 2-已确认
 * 3-进行中
 * 9-已取消
 */
export type BookingStatus = 1 | 2 | 3 | 9;

export interface AdminBookingQueryDTO {
    page?: number; // 后端是 Long
    pageSize?: number; // 后端是 Long
    memberId?: string;
    coachId?: string;
    venueId?: string;
    packageId?: string;
    status?: BookingStatus | number;
    startDate?: string; // yyyy-MM-dd
    endDate?: string; // yyyy-MM-dd
    keyword?: string;
}

/**
 * 预约列表项（根据常见字段 + 你的业务场景定义）
 * 如果后端字段略有差异，可按实际返回补充/删减。
 */
export interface AdminBookingListItemVO {
    bookingId: string;
    bookingNo?: string;
    memberId?: string;
    memberName?: string | null;
    memberPhone?: string | null;
    venueId?: string;
    venueName?: string | null;
    coachId?: string;
    coachName?: string | null;
    packageId?: string | null;
    packageName?: string | null;
    bookingDate?: string | null; // yyyy-MM-dd
    startTime?: string | null; // HH:mm:ss or HH:mm
    endTime?: string | null; // HH:mm:ss or HH:mm
    courseDuration?: number | null;
    status?: BookingStatus | number;
    statusText?: string | null;
    remark?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

/**
 * 分页VO（你的后端是 AdminBookingPageVO，文件内容没完整给出）
 * 这里做兼容建模：优先适配 records/list/items + total/page/pageSize。
 */
export interface AdminBookingPageVO extends PageResult<AdminBookingListItemVO> {
    // 可按后端真实字段继续扩展
}

/** 预约详情（后端 BookingDetailVO 未完整提供，这里给通用版） */
export interface BookingDetailVO {
    bookingId: string;
    bookingNo?: string;
    memberId?: string;
    memberName?: string | null;
    memberPhone?: string | null;
    venueId?: string;
    venueName?: string | null;
    coachId?: string;
    coachName?: string | null;
    packageId?: string | null;
    packageName?: string | null;
    bookingDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    courseDuration?: number | null;
    status?: BookingStatus | number;
    statusText?: string | null;
    remark?: string | null;
    cancelReason?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

/** 管理员创建预约 */
export interface AdminCreateBookingDTO {
    memberId?: string | null;
    memberName?: string | null;
    venueId?: string | null;
    coachId?: string | null;
    bookingDate?: string | null; // yyyy-MM-dd
    startTime?: string | null; // HH:mm:ss / HH:mm
    courseDuration?: number | null;
    packageId?: string | null;
    packageName?: string | null;
    status?: BookingStatus | number | null;
    remark?: string | null;
    operatorId?: string | null;
    operatorName?: string | null;
}

/** 管理员调整预约 */
export interface AdminRescheduleBookingDTO {
    bookingId?: string | null;
    newVenueId?: string | null;
    newCoachId?: string | null;
    newBookingDate?: string | null; // yyyy-MM-dd
    newStartTime?: string | null; // HH:mm:ss / HH:mm
    newCourseDuration?: number | null;
    reason?: string | null;
    operatorId?: string | null;
    operatorName?: string | null;
}

/** 管理员取消预约 */
export interface AdminCancelBookingDTO {
    bookingId?: string | null;
    reason?: string | null;
    operatorId?: string | null;
    operatorName?: string | null;
}

/** 管理员更新预约状态 */
export interface AdminUpdateBookingStatusDTO {
    bookingId?: string | null;
    status?: BookingStatus | number | null;
    reason?: string | null;
    operatorId?: string | null;
    operatorName?: string | null;
}

/** =========================
 * API Functions
 * ========================= */

const ADMIN_BOOKINGS_BASE = '/api/admin/bookings';

/** 分页查询预约列表 */
export function pageAdminBookingsApi(data: AdminBookingQueryDTO) {
    const payload = {
        ...data,
        memberId: data.memberId ? String(data.memberId) : undefined,
        coachId: data.coachId ? String(data.coachId) : undefined,
        venueId: data.venueId ? String(data.venueId) : undefined,
        packageId: data.packageId ? String(data.packageId) : undefined,
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 10,
    };

    return requestClient.post<AdminBookingPageVO>(`${ADMIN_BOOKINGS_BASE}/page`, payload);
}

/** 分页结果标准化（页面侧直接用） */
export async function pageAdminBookingsNormalizedApi(
    data: AdminBookingQueryDTO,
): Promise<NormalizedPageResult<AdminBookingListItemVO>> {
    const res = await pageAdminBookingsApi(data);
    return normalizePageResult<AdminBookingListItemVO>(res);
}

/** 查询预约详情 */
export function getAdminBookingDetailApi(bookingId: string) {
    return requestClient.get<BookingDetailVO>(`${ADMIN_BOOKINGS_BASE}/${bookingId}`);
}

/** 管理员手动创建预约 */
export function createAdminBookingApi(data: AdminCreateBookingDTO) {
    const payload = {
        ...data,
        memberId: data.memberId ? String(data.memberId) : undefined,
        venueId: data.venueId ? String(data.venueId) : undefined,
        coachId: data.coachId ? String(data.coachId) : undefined,
        packageId: data.packageId ? String(data.packageId) : undefined,
        operatorId: data.operatorId ? String(data.operatorId) : undefined,
    };

    return requestClient.post<BookingDetailVO>(`${ADMIN_BOOKINGS_BASE}/create-manual`, payload);
}

/** 管理员调整预约 */
export function rescheduleAdminBookingApi(data: AdminRescheduleBookingDTO) {
    const payload = {
        ...data,
        bookingId: data.bookingId ? String(data.bookingId) : undefined,
        newVenueId: data.newVenueId ? String(data.newVenueId) : undefined,
        newCoachId: data.newCoachId ? String(data.newCoachId) : undefined,
        operatorId: data.operatorId ? String(data.operatorId) : undefined,
    };

    return requestClient.post<BookingDetailVO>(`${ADMIN_BOOKINGS_BASE}/reschedule`, payload);
}

/** 管理员取消预约 */
export function cancelAdminBookingApi(data: AdminCancelBookingDTO) {
    const payload = {
        ...data,
        bookingId: data.bookingId ? String(data.bookingId) : undefined,
        operatorId: data.operatorId ? String(data.operatorId) : undefined,
    };

    return requestClient.post<BookingDetailVO>(`${ADMIN_BOOKINGS_BASE}/cancel`, payload);
}

/** 管理员更新预约状态 */
export function updateAdminBookingStatusApi(data: AdminUpdateBookingStatusDTO) {
    const payload = {
        ...data,
        bookingId: data.bookingId ? String(data.bookingId) : undefined,
        operatorId: data.operatorId ? String(data.operatorId) : undefined,
    };

    return requestClient.post<BookingDetailVO>(`${ADMIN_BOOKINGS_BASE}/status`, payload);
}
