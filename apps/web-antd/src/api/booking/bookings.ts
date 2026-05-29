import {requestClient} from '#/api/request';
import type {NormalizedPageResult, PageResult} from '#/api/_shared/page';
import {normalizePageResult} from '#/api/_shared/page';

/** =========================
 * 管理后台 - 预约管理 DTO
 * Base: /api/admin/bookings
 * ========================= */

/**
 * 预约状态兼容：
 * - 管理列表常见：1/2/3/9
 * - 详情VO注释里可能出现：1/2/3/4/5/6
 */
export type BookingStatus = 1 | 2 | 3 | 4 | 5 | 6 | 9;

export interface AdminBookingQueryDTO {
    page?: number;
    pageSize?: number;
    memberId?: string;
    coachId?: string;
    venueId?: string;
    packageId?: string;
    status?: BookingStatus | number;
    startDate?: string; // yyyy-MM-dd
    endDate?: string; // yyyy-MM-dd
    keyword?: string;
}

/** 列表项（前端展示友好结构） */
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

    // 兼容你的页面里偶尔用到 record.member.name 的写法
    member?: {
        id?: string | null;
        name?: string | null;
        phone?: string | null;
    };
}

export interface AdminBookingPageVO extends PageResult<AdminBookingListItemVO> {
}


interface MemberInfo {
    id: string;
    name: string | null;
    phone: string | null;
    avatar: string | null;
}

interface PackageInfo {
    id: string;
    name: string | null;
    type: string | null;
}

interface CoachInfo {
    id: string;
    name: string | null;
    avatar: string | null;
}

interface VenueInfo {
    id: string;
    name: string | null;
    address: string | null;
    phone: string | null;
}

/** 详情VO（前端标准化后） */
export interface BookingDetailVO {
    id: string;
    bookingNo?: string;

    member: MemberInfo;
    packageInfo: PackageInfo;
    coach: CoachInfo;
    venue: VenueInfo;

    bookingDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    duration?: number | null;
    status?: BookingStatus | number;

    cancelReason?: string | null;
    checkinTime?: string | null;
    checkoutTime?: string | null;
    remark?: string | null;
    createdAt?: string | null;

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
    newBookingDate?: string | null;
    newStartTime?: string | null;
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

/** 通用：后端数据 -> 前端详情结构 */
function normalizeBookingDetail(raw: any): BookingDetailVO {
    const member = raw?.member ?? {};
    const coach = raw?.coach ?? {};
    const venue = raw?.venue ?? {};
    const packageInfo = raw?.packageInfo ?? {};

    return {
        bookingId: String(raw?.bookingId ?? raw?.id ?? ''),
        bookingNo: raw?.bookingNo ?? undefined,

        memberId: raw?.memberId != null ? String(raw.memberId) : member?.id != null ? String(member.id) : undefined,
        memberName: raw?.memberName ?? member?.name ?? null,
        memberPhone: raw?.memberPhone ?? member?.phone ?? null,

        venueId: raw?.venueId != null ? String(raw.venueId) : venue?.id != null ? String(venue.id) : undefined,
        venueName: raw?.venueName ?? venue?.name ?? null,

        coachId: raw?.coachId != null ? String(raw.coachId) : coach?.id != null ? String(coach.id) : undefined,
        coachName: raw?.coachName ?? coach?.name ?? null,

        packageId:
            raw?.packageId != null
                ? String(raw.packageId)
                : packageInfo?.id != null
                    ? String(packageInfo.id)
                    : null,
        packageName: raw?.packageName ?? packageInfo?.name ?? null,

        bookingDate: raw?.bookingDate ?? null,
        startTime: raw?.startTime ?? null,
        endTime: raw?.endTime ?? null,
        courseDuration: raw?.courseDuration ?? raw?.duration ?? null,
        status: raw?.status,
        statusText: raw?.statusText ?? null,

        cancelReason: raw?.cancelReason ?? null,
        checkinTime: raw?.checkinTime ?? null,
        checkoutTime: raw?.checkoutTime ?? null,
        remark: raw?.remark ?? null,

        createdAt: raw?.createdAt ?? null,
        updatedAt: raw?.updatedAt ?? null,

        member: {
            id: member?.id != null ? String(member.id) : null,
            name: member?.name ?? null,
            phone: member?.phone ?? null,
        },
        coach: {
            id: coach?.id != null ? String(coach.id) : null,
            name: coach?.name ?? null,
        },
        venue: {
            id: venue?.id != null ? String(venue.id) : null,
            name: venue?.name ?? null,
        },
        packageInfo: {
            id: packageInfo?.id != null ? String(packageInfo.id) : null,
            name: packageInfo?.name ?? null,
        },
    };
}

/** 通用：后端列表项 -> 前端列表项结构 */
function normalizeBookingListItem(raw: any): AdminBookingListItemVO {
    const d = normalizeBookingDetail(raw);
    return {
        bookingId: d.bookingId,
        bookingNo: d.bookingNo,
        memberId: d.memberId,
        memberName: d.memberName,
        memberPhone: d.memberPhone,
        venueId: d.venueId,
        venueName: d.venueName,
        coachId: d.coachId,
        coachName: d.coachName,
        packageId: d.packageId,
        packageName: d.packageName,
        bookingDate: d.bookingDate,
        startTime: d.startTime,
        endTime: d.endTime,
        courseDuration: d.courseDuration,
        status: d.status,
        statusText: d.statusText,
        remark: d.remark,
        cancelReason: d.cancelReason,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        member: d.member,
    };
}

/** 分页查询预约列表（原始） */
export function pageAdminBookingsApi(data: AdminBookingQueryDTO) {
    const payload = {
        ...data,
        memberId: data.memberId ? Number(data.memberId) : undefined,
        coachId: data.coachId ? Number(data.coachId) : undefined,
        venueId: data.venueId ? Number(data.venueId) : undefined,
        packageId: data.packageId ? Number(data.packageId) : undefined,
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 10,
    };
    return requestClient.post<AdminBookingPageVO>(`${ADMIN_BOOKINGS_BASE}/page`, payload);
}

/** 分页结果标准化（页面推荐用这个） */
export async function pageAdminBookingsNormalizedApi(
    data: AdminBookingQueryDTO,
): Promise<NormalizedPageResult<AdminBookingListItemVO>> {
    const res = await pageAdminBookingsApi(data);
    const normalized = normalizePageResult<any>(res);
    return {
        ...normalized,
        list: (normalized.list || []).map(normalizeBookingListItem),
    };
}

/** 查询预约详情 */
export async function getAdminBookingDetailApi(bookingId: string): Promise<BookingDetailVO> {
    const res = await requestClient.get(`${ADMIN_BOOKINGS_BASE}/${bookingId}`);
    return normalizeBookingDetail(res);
}

/** 管理员手动创建预约 */
export async function createAdminBookingApi(data: AdminCreateBookingDTO): Promise<BookingDetailVO> {
    const payload = {
        ...data,
        memberId: data.memberId ? Number(data.memberId) : undefined,
        venueId: data.venueId ? Number(data.venueId) : undefined,
        coachId: data.coachId ? Number(data.coachId) : undefined,
        packageId: data.packageId ? Number(data.packageId) : undefined,
        operatorId: data.operatorId ? Number(data.operatorId) : undefined,
    };
    const res = await requestClient.post<any>(`${ADMIN_BOOKINGS_BASE}/create-manual`, payload);
    return normalizeBookingDetail(res);
}

/** 管理员调整预约 */
export async function rescheduleAdminBookingApi(data: AdminRescheduleBookingDTO): Promise<BookingDetailVO> {
    const payload = {
        ...data,
        bookingId: data.bookingId ? Number(data.bookingId) : undefined,
        newVenueId: data.newVenueId ? Number(data.newVenueId) : undefined,
        newCoachId: data.newCoachId ? Number(data.newCoachId) : undefined,
        operatorId: data.operatorId ? Number(data.operatorId) : undefined,
    };
    const res = await requestClient.post<any>(`${ADMIN_BOOKINGS_BASE}/reschedule`, payload);
    return normalizeBookingDetail(res);
}

/** 管理员取消预约 */
export function cancelAdminBookingApi(data: AdminCancelBookingDTO) {
    const payload = {
        ...data,
        bookingId: data.bookingId ? Number(data.bookingId) : undefined,
        operatorId: data.operatorId ? Number(data.operatorId) : undefined,
    };
    return requestClient.post(`${ADMIN_BOOKINGS_BASE}/cancel`, payload);
}

/** 管理员更新预约状态 */
export function updateAdminBookingStatusApi(data: AdminUpdateBookingStatusDTO) {
    const payload = {
        ...data,
        bookingId: data.bookingId ? Number(data.bookingId) : undefined,
        operatorId: data.operatorId ? Number(data.operatorId) : undefined,
    };
    return requestClient.post(`${ADMIN_BOOKINGS_BASE}/update-status`, payload);
}
