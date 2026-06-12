import { requestClient } from '#/api/request';

import type { PageResult } from '#/api/_shared/page';

/**
 * 会员偏好教练 API
 *
 * 后端 Controller:
 * /api/admin/member-preferred-coaches
 */

const MEMBER_PREFERRED_COACH_BASE = '/api/admin/member-preferred-coaches';

/**
 * 设置偏好教练请求
 */
export interface SetPreferredCoachDTO {
    /**
     * 会员ID
     */
    memberId?: number | string;

    /**
     * 教练ID
     */
    coachId?: number | string;

    /**
     * 场馆ID
     */
    venueId?: number | string;

    /**
     * 偏好等级：1-首选，2-次选
     */
    preferenceLevel?: number;

    /**
     * 偏好原因：MANUAL-手动设置
     */
    preferenceReason?: string;
}

/**
 * 偏好教练 VO
 */
export interface PreferredCoachVO {
    /**
     * 记录ID
     */
    id?: number | string;

    /**
     * 会员ID
     */
    memberId?: number | string;

    /**
     * 会员名称
     */
    memberName?: string | null;

    /**
     * 教练ID
     */
    coachId?: number | string;

    /**
     * 教练名称
     */
    coachName?: string | null;

    /**
     * 场馆ID
     */
    venueId?: number | string;

    /**
     * 场馆名称
     */
    venueName?: string | null;

    /**
     * 偏好等级：1-首选，2-次选
     */
    preferenceLevel?: number | null;

    /**
     * 偏好原因
     */
    preferenceReason?: string | null;

    /**
     * 预约次数
     */
    bookingCount?: number | null;

    /**
     * 最近预约时间
     *
     * 后端 LocalDateTime 通常序列化为：
     * yyyy-MM-ddTHH:mm:ss
     */
    lastBookingTime?: string | null;

    /**
     * 是否有效
     */
    isActive?: boolean | null;

    /**
     * 创建时间
     */
    createdAt?: string | null;

    /**
     * 更新时间
     */
    updatedAt?: string | null;
}

/**
 * 分页查询偏好教练请求
 */
export interface PreferredCoachQueryDTO {
    /**
     * 会员ID
     */
    memberId?: number | string;

    /**
     * 场馆ID
     */
    venueId?: number | string;

    /**
     * 教练ID
     */
    coachId?: number | string;

    /**
     * 是否有效
     */
    isActive?: boolean;

    /**
     * 页码
     */
    pageNum?: number;

    /**
     * 每页大小
     */
    pageSize?: number;
}

/**
 * 更新偏好教练请求
 */
export interface UpdatePreferredCoachDTO {
    /**
     * 记录ID
     */
    id?: number | string;

    /**
     * 偏好等级
     */
    preferenceLevel?: number;

    /**
     * 是否有效
     */
    isActive?: boolean;
}

/**
 * 批量设置偏好教练请求
 */
export interface BatchSetPreferredCoachDTO {
    /**
     * 会员ID
     */
    memberId?: number | string;

    /**
     * 场馆ID
     */
    venueId?: number | string;

    /**
     * 偏好教练列表
     */
    coaches: PreferredCoachItemDTO[];
}

/**
 * 批量设置偏好教练单项
 */
export interface PreferredCoachItemDTO {
    /**
     * 教练ID
     */
    coachId?: number | string;

    /**
     * 偏好等级：1-首选，2-次选
     */
    preferenceLevel?: number;
}

/**
 * 会员偏好教练 API 集合
 */
export const MemberPreferredCoachApi = {
    /**
     * 设置偏好教练
     *
     * POST /api/admin/member-preferred-coaches
     */
    setPreferredCoach(data: SetPreferredCoachDTO) {
        return requestClient.post<PreferredCoachVO>(
            MEMBER_PREFERRED_COACH_BASE,
            data,
        );
    },

    /**
     * 批量设置偏好教练
     *
     * POST /api/admin/member-preferred-coaches/batch
     */
    batchSetPreferredCoach(data: BatchSetPreferredCoachDTO) {
        return requestClient.post<PreferredCoachVO[]>(
            `${MEMBER_PREFERRED_COACH_BASE}/batch`,
            data,
        );
    },

    /**
     * 更新偏好教练
     *
     * PUT /api/admin/member-preferred-coaches
     */
    updatePreferredCoach(data: UpdatePreferredCoachDTO) {
        return requestClient.put<PreferredCoachVO>(
            MEMBER_PREFERRED_COACH_BASE,
            data,
        );
    },

    /**
     * 删除偏好教练
     *
     * DELETE /api/admin/member-preferred-coaches/{id}
     */
    deletePreferredCoach(id: number | string) {
        return requestClient.delete<string>(
            `${MEMBER_PREFERRED_COACH_BASE}/${id}`,
        );
    },

    /**
     * 查询偏好教练详情
     *
     * GET /api/admin/member-preferred-coaches/{id}
     */
    getPreferredCoachDetail(id: number | string) {
        return requestClient.get<PreferredCoachVO>(
            `${MEMBER_PREFERRED_COACH_BASE}/${id}`,
        );
    },

    /**
     * 查询会员的偏好教练列表
     *
     * GET /api/admin/member-preferred-coaches/member/{memberId}
     *
     * @param memberId 会员ID
     * @param venueId 场馆ID，可选
     */
    listByMember(memberId: number | string, venueId?: number | string) {
        return requestClient.get<PreferredCoachVO[]>(
            `${MEMBER_PREFERRED_COACH_BASE}/member/${memberId}`,
            {
                params: {
                    venueId,
                },
            },
        );
    },

    /**
     * 分页查询偏好教练
     *
     * POST /api/admin/member-preferred-coaches/page
     */
    pageQuery(data: PreferredCoachQueryDTO) {
        return requestClient.post<PageResult<PreferredCoachVO>>(
            `${MEMBER_PREFERRED_COACH_BASE}/page`,
            data,
        );
    },

    /**
     * 清除会员的所有偏好教练
     *
     * DELETE /api/admin/member-preferred-coaches/member/{memberId}
     *
     * @param memberId 会员ID
     * @param venueId 场馆ID，可选，不传则清除所有场馆
     */
    clearAllByMember(memberId: number | string, venueId?: number | string) {
        return requestClient.delete<number>(
            `${MEMBER_PREFERRED_COACH_BASE}/member/${memberId}`,
            {
                params: {
                    venueId,
                },
            },
        );
    },
};

/**
 * 兼容函数式调用方式
 *
 * 如果你的页面更习惯：
 * import { pagePreferredCoachApi } from ...
 * 也可以直接使用下面这些方法。
 */

export function setPreferredCoachApi(data: SetPreferredCoachDTO) {
    return MemberPreferredCoachApi.setPreferredCoach(data);
}

export function batchSetPreferredCoachApi(data: BatchSetPreferredCoachDTO) {
    return MemberPreferredCoachApi.batchSetPreferredCoach(data);
}

export function updatePreferredCoachApi(data: UpdatePreferredCoachDTO) {
    return MemberPreferredCoachApi.updatePreferredCoach(data);
}

export function deletePreferredCoachApi(id: number | string) {
    return MemberPreferredCoachApi.deletePreferredCoach(id);
}

export function getPreferredCoachDetailApi(id: number | string) {
    return MemberPreferredCoachApi.getPreferredCoachDetail(id);
}

export function listPreferredCoachesByMemberApi(
    memberId: number | string,
    venueId?: number | string,
) {
    return MemberPreferredCoachApi.listByMember(memberId, venueId);
}

export function pagePreferredCoachApi(data: PreferredCoachQueryDTO) {
    return MemberPreferredCoachApi.pageQuery(data);
}

export function clearPreferredCoachesByMemberApi(
    memberId: number | string,
    venueId?: number | string,
) {
    return MemberPreferredCoachApi.clearAllByMember(memberId, venueId);
}
