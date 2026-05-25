import { requestClient } from '#/api/request';
import type { PageResult } from '#/api/_shared/page';

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
    id: string;
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
    id: string;
    memberNo: string;
    phone: string;
    name?: string | null;
    nickname?: string | null;
    gender?: number | null;
    birthday?: string | null;
    avatar?: string | null;
    province?: string | null;
    city?: string | null;
    country?: string | null;
    registerSource: string;
    registerVenueId?: string | null;
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
    birthday?: string | null;
    province?: string | null;
    city?: string | null;
    country?: string | null;
}

export interface AdminMemberStatusUpdateDTO {
    status: number;
    remark?: string | null;
}

export interface MemberAdminStatisticsDTO {
    totalMembers: number;
    activeMembers: number;
    frozenMembers: number;
    newMembersThisMonth: number;
    totalConsumption: number;
}

export interface MemberSearchRequest {
    phone?: string;
    name?: string;
    nickname?: string;
    page?: number;
    pageSize?: number;
}

export interface MemberSearchResultDTO {
    id: string;
    memberNo: string;
    phone: string;
    name?: string | null;
    nickname?: string | null;
    avatar?: string | null;
    gender?: number | null;
    status: number;
    registerTime: string;
    totalConsumption: number;
    matchType: 'PHONE' | 'NAME' | 'NICKNAME' | string;
}

/** C端统计 */
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

const ADMIN_MEMBER_BASE = '/api/admin/members';

export function getAdminMemberListApi(params: AdminMemberQueryDTO) {
    return requestClient.get<PageResult<AdminMemberListDTO>>(`${ADMIN_MEMBER_BASE}/list`, { params });
}

export function getAdminMemberDetailApi(id: string) {
    return requestClient.get<AdminMemberDetailDTO>(`${ADMIN_MEMBER_BASE}/${id}`);
}

export function updateAdminMemberApi(id: string, data: AdminMemberUpdateDTO) {
    return requestClient.put<boolean>(`${ADMIN_MEMBER_BASE}/${id}`, data);
}

export function updateAdminMemberStatusApi(id: string, data: AdminMemberStatusUpdateDTO) {
    return requestClient.put<boolean>(`${ADMIN_MEMBER_BASE}/${id}/status`, data);
}

export function getAdminMemberStatisticsApi() {
    return requestClient.get<MemberAdminStatisticsDTO>(`${ADMIN_MEMBER_BASE}/statistics`);
}

export function searchAdminMembersApi(params: MemberSearchRequest) {
    return requestClient.get<PageResult<MemberSearchResultDTO>>(`${ADMIN_MEMBER_BASE}/search`, { params });
}

export function searchAdminMemberByPhoneApi(phone: string, page = 1, pageSize = 10) {
    return searchAdminMembersApi({ phone, page, pageSize });
}

export function getMemberStatsApi() {
    return requestClient.get<MemberStatsDTO>('/api/member/stats');
}
