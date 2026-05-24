import { requestClient } from '#/api/request';

/** =========================
 * 通用分页（兼容后端 PageResult 字段差异）
 * ========================= */
export interface PageResult<T> {
    list?: T[];
    items?: T[];
    records?: T[];
    total: number;
    page?: number;
    pageNum?: number;
    current?: number;
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
        list: res.list ?? res.items ?? res.records ?? [],
        total: Number(res.total ?? 0),
        page: Number(res.page ?? res.pageNum ?? res.current ?? 1),
        pageSize: Number(res.pageSize ?? res.size ?? 20),
    };
}

/** =========================
 * 管理后台 - 会员管理 DTO
 * ========================= */

export interface AdminMemberQueryDTO {
    memberNo?: string;
    phone?: string;
    name?: string;
    status?: number; // 1-正常 2-冻结 3-注销
    registerTimeStart?: string; // LocalDateTime 字符串
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
    status: number;
    totalConsumption: number;
    totalCourseCount: number;
    totalVenueVisitCount: number;
    registerTime: string;
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
 * 综合搜索 DTO（对齐 MemberSearchRequest/ResultDTO）
 * ========================= */

export interface MemberSearchRequest {
    phone?: string;
    name?: string;
    nickname?: string;
    page?: number; // 默认 1
    pageSize?: number; // 默认 10
}

export interface MemberSearchResultDTO {
    id: number;
    memberNo: string;
    phone: string; // 已脱敏
    name?: string | null;
    nickname?: string | null;
    avatar?: string | null;
    gender?: number | null;
    status: number;
    registerTime: string;
    totalConsumption: number;
    matchType: 'PHONE' | 'NAME' | 'NICKNAME' | string;
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

/** 获取会员统计（管理员视角） */
export function getAdminMemberStatisticsApi() {
    return requestClient.get<MemberAdminStatisticsDTO>(`${ADMIN_MEMBER_BASE}/statistics`);
}

/**
 * 综合搜索会员（支持 phone / name / nickname）
 * 对齐后端：GET /api/admin/members/search
 */
export function searchAdminMembersApi(params: MemberSearchRequest) {
    return requestClient.get<PageResult<MemberSearchResultDTO>>(`${ADMIN_MEMBER_BASE}/search`, {
        params,
    });
}

/**
 * 兼容旧调用名：按手机号搜索（本质走综合搜索）
 * 返回分页结果，调用方可取第一条
 */
export function searchAdminMemberByPhoneApi(phone: string, page = 1, pageSize = 10) {
    return searchAdminMembersApi({ phone, page, pageSize });
}

/** =========================
 * API Functions - 会员端
 * Base: /api/member
 * ========================= */

/** 获取当前会员统计（依赖 Authorization: Bearer xxx） */
export function getMemberStatsApi() {
    return requestClient.get<MemberStatsDTO>('/api/member/stats');
}
