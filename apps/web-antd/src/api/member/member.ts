import { requestClient } from '#/api/request';

/** =========================
 * 通用分页（兼容你项目里 PageResult 字段名差异）
 * ========================= */
export interface PageResult<T> {
    list?: T[];
    items?: T[];
    total: number;
    page?: number;
    pageNum?: number;
    pageSize?: number;
    size?: number;
}

export interface NormalizedPageResult<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
}

export function normalizePageResult<T>(res: PageResult<T>): NormalizedPageResult<T> {
    return {
        list: res.list ?? res.items ?? [],
        total: Number(res.total ?? 0),
        page: Number(res.page ?? res.pageNum ?? 1),
        pageSize: Number(res.pageSize ?? res.size ?? 20),
    };
}

/** =========================
 * 管理后台 - 会员管理 DTO（对齐后端 admin 包）
 * ========================= */

export interface AdminMemberQueryDTO {
    memberNo?: string;
    phone?: string;
    name?: string;
    status?: number; // 1-正常 2-冻结 3-注销
    registerTimeStart?: string; // LocalDateTime -> ISO字符串
    registerTimeEnd?: string;
    page?: number;
    pageSize?: number;
}

export interface AdminMemberListDTO {
    id: number;
    memberNo: string;
    phone: string;
    name?: string | null;
    nickname?: string | null;
    avatar?: string | null;
    gender?: number | null; // 0-未知 1-男 2-女
    status: number; // 1/2/3
    totalConsumption: number; // Long
    totalCourseCount: number;
    totalVenueVisitCount: number;
    registerTime: string; // LocalDateTime
    lastVisitTime?: string | null;
}

export interface AdminMemberDetailDTO {
    id: number;
    memberNo: string;
    phone: string;
    name?: string | null;
    nickname?: string | null;
    gender?: number | null;
    birthday?: string | null; // yyyy-MM-dd
    avatar?: string | null;
    province?: string | null;
    city?: string | null;
    country?: string | null;
    registerSource: string;
    registerVenueId?: number | null;
    registerTime: string;
    status: number;
    totalConsumption: number;
    totalCourseCount: number;
    totalVenueVisitCount: number;
    lastVisitTime?: string | null;
    totalTrainingCount: number;
    totalTrainingDays: number;
    totalTrainingMinutes: number;
    lastTrainingTime?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminMemberUpdateDTO {
    name?: string | null;
    nickname?: string | null;
    gender?: number | null;
    birthday?: string | null; // yyyy-MM-dd
    province?: string | null;
    city?: string | null;
    country?: string | null;
}

export interface AdminMemberStatusUpdateDTO {
    status: number; // 1-正常 2-冻结 3-注销
    remark?: string | null;
}

export interface MemberAdminStatisticsDTO {
    totalMembers: number;
    activeMembers: number;
    frozenMembers: number;
    newMembersThisMonth: number;
    totalConsumption: number;
}

/** =========================
 * C端 - 会员统计 DTO（/api/member/stats）
 * ========================= */

export interface TotalStatsDTO {
    totalDays: number;
    totalTimes: number;
}

export interface MonthStatsDTO {
    trainTimes: number;
    trainDays: number;
    trainDuration: number;
}

export interface MemberStatsDTO {
    totalStats: TotalStatsDTO;
    monthStats: MonthStatsDTO;
}

/** =========================
 * API Functions - 管理后台
 * Base: /api/admin/members
 * ========================= */

const ADMIN_MEMBER_BASE = '/api/admin/members';

/** 获取会员列表 */
export function getAdminMemberListApi(params: AdminMemberQueryDTO) {
    return requestClient.get<PageResult<AdminMemberListDTO>>(`${ADMIN_MEMBER_BASE}/list`, { params });
}

/** 获取会员详情 */
export function getAdminMemberDetailApi(id: number) {
    return requestClient.get<AdminMemberDetailDTO>(`${ADMIN_MEMBER_BASE}/${id}`);
}

/** 编辑会员信息 */
export function updateAdminMemberApi(id: number, data: AdminMemberUpdateDTO) {
    return requestClient.put<boolean>(`${ADMIN_MEMBER_BASE}/${id}`, data);
}

/** 更新会员状态 */
export function updateAdminMemberStatusApi(id: number, data: AdminMemberStatusUpdateDTO) {
    return requestClient.put<boolean>(`${ADMIN_MEMBER_BASE}/${id}/status`, data);
}

/** 根据手机号搜索会员 */
export function searchAdminMemberByPhoneApi(phone: string) {
    return requestClient.get<AdminMemberListDTO | null>(`${ADMIN_MEMBER_BASE}/search`, {
        params: { phone },
    });
}

/** 获取会员统计（管理员视角） */
export function getAdminMemberStatisticsApi() {
    return requestClient.get<MemberAdminStatisticsDTO>(`${ADMIN_MEMBER_BASE}/statistics`);
}

/** =========================
 * API Functions - 会员端
 * Base: /api/member
 * ========================= */

/**
 * 获取当前会员统计（依赖 Authorization: Bearer xxx）
 * 如果你的 requestClient 已统一注入 token，这个函数可直接使用
 */
export function getMemberStatsApi() {
    return requestClient.get<MemberStatsDTO>('/api/member/stats');
}
