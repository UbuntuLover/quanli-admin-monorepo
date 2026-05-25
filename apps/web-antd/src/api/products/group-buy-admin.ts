import { requestClient } from '#/api/request';
import type { PageResult } from '#/api/_shared/page';

/** =========================
 * 管理后台 - 拼团活动管理
 * Base: /api/admin/group-buy/activities
 * ========================= */

const ADMIN_GROUP_BUY_BASE = '/api/admin/group-buy/activities';

/** 活动状态 */
export type GroupBuyActivityStatus = 'ACTIVE' | 'INACTIVE';

/** 规则类型 */
export type GroupBuyLotteryType = 'GROUP_PRICE' | 'LEADER_FREE' | 'RANDOM_ONE';

/** 退款截止类型 */
export type GroupBuyRefundDeadlineType = 'BEFORE_GROUP' | 'AFTER_GROUP';

/** 排序方向 */
export type SortDirection = 'ASC' | 'DESC';

/** 创建拼团活动请求 */
export interface CreateGroupBuyActivityRequest {
    name: string;
    productId: string;
    skuId?: string;
    originalPrice: number; // 分
    groupPrice: number; // 分
    minPeople: number;
    maxPeople: number;
    startTime: string; // LocalDateTime 字符串，如 2026-05-25T10:00:00
    endTime: string; // LocalDateTime 字符串
    expireHours: number;
    lotteryType: GroupBuyLotteryType | string;
    autoGroupEnabled?: 0 | 1;
    refundDeadLineType?: GroupBuyRefundDeadlineType | string;
}

/** 更新拼团活动请求 */
export interface UpdateGroupBuyActivityRequest {
    name?: string;
    productId?: string;
    skuId?: string;
    originalPrice?: number;
    groupPrice?: number;
    minPeople?: number;
    maxPeople?: number;
    startTime?: string;
    endTime?: string;
    expireHours?: number;
    lotteryType?: GroupBuyLotteryType | string;
    autoGroupEnabled?: 0 | 1;
    refundDeadLineType?: GroupBuyRefundDeadlineType | string;
}

/** 管理后台查询参数 */
export interface AdminGroupBuyQueryDTO {
    name?: string;
    productId?: string;
    status?: GroupBuyActivityStatus | string;
    lotteryType?: GroupBuyLotteryType | string;
    startTimeStart?: string;
    startTimeEnd?: string;
    sortField?: string; // created_at / start_time / ...
    sortDirection?: SortDirection | string;
    page?: number;
    pageSize?: number;
}

/** 活动列表项 */
export interface AdminGroupBuyListDTO {
    id: string;
    name: string;
    productId: string;
    productName: string;
    skuId?: string | null;
    originalPrice: number;
    groupPrice: number;
    minPeople: number;
    maxPeople: number;
    startTime: string;
    endTime: string;
    lotteryType: GroupBuyLotteryType | string;
    status: GroupBuyActivityStatus | string;
    createdAt: string;
    signupCount: number;
    groupCount: number;
}

/** 活动详情 */
export interface AdminGroupBuyDetailDTO {
    id: string;
    name: string;
    productId: string;
    productName: string;
    productImage?: string | null;
    skuId?: string | null;
    skuName?: string | null;
    originalPrice: number;
    groupPrice: number;
    minPeople: number;
    maxPeople: number;
    startTime: string;
    endTime: string;
    expireHours: number;
    lotteryType: GroupBuyLotteryType | string;
    autoGroupEnabled: 0 | 1 | number;
    refundDeadLineType: GroupBuyRefundDeadlineType | string;
    status: GroupBuyActivityStatus | string;
    createdAt: string;
    updatedAt?: string | null;
    signupCount: number;
    groupCount: number;
    failGroupCount: number;
}

/**
 * 创建拼团活动
 * 返回创建后的活动ID
 */
export function createAdminGroupBuyActivityApi(data: CreateGroupBuyActivityRequest) {
    const payload = {
        ...data,
        productId: String(data.productId),
        skuId: data.skuId ? String(data.skuId) : undefined,
        autoGroupEnabled: data.autoGroupEnabled ?? 0,
        refundDeadLineType: data.refundDeadLineType ?? 'BEFORE_GROUP',
    };

    return requestClient.post<string>(ADMIN_GROUP_BUY_BASE, payload);
}

/**
 * 更新拼团活动
 */
export function updateAdminGroupBuyActivityApi(id: string, data: UpdateGroupBuyActivityRequest) {
    const payload = {
        ...data,
        productId: data.productId ? String(data.productId) : undefined,
        skuId: data.skuId ? String(data.skuId) : undefined,
    };

    return requestClient.put<boolean>(`${ADMIN_GROUP_BUY_BASE}/${id}`, payload);
}

/**
 * 删除拼团活动
 */
export function deleteAdminGroupBuyActivityApi(id: string) {
    return requestClient.delete<boolean>(`${ADMIN_GROUP_BUY_BASE}/${id}`);
}

/**
 * 查询拼团活动列表（分页）
 */
export function getAdminGroupBuyActivityListApi(params: AdminGroupBuyQueryDTO) {
    return requestClient.get<PageResult<AdminGroupBuyListDTO>>(`${ADMIN_GROUP_BUY_BASE}/list`, {
        params: {
            ...params,
            productId: params.productId ? String(params.productId) : undefined,
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 10,
            sortField: params.sortField ?? 'created_at',
            sortDirection: params.sortDirection ?? 'DESC',
        },
    });
}

/**
 * 查询拼团活动详情
 */
export function getAdminGroupBuyActivityDetailApi(id: string) {
    return requestClient.get<AdminGroupBuyDetailDTO>(`${ADMIN_GROUP_BUY_BASE}/${id}`);
}

/**
 * 启用拼团活动
 */
export function activateAdminGroupBuyActivityApi(id: string) {
    return requestClient.post<boolean>(`${ADMIN_GROUP_BUY_BASE}/${id}/activate`);
}

/**
 * 禁用拼团活动
 */
export function deactivateAdminGroupBuyActivityApi(id: string) {
    return requestClient.post<boolean>(`${ADMIN_GROUP_BUY_BASE}/${id}/deactivate`);
}
