import { requestClient } from '#/api/request';

/**
 * 教练状态码
 *
 * 对应后端：
 * 1 - 启用
 * 2 - 禁用
 * 3 - 请假
 * 4 - 已离职
 */
export enum CoachStatus {
    ENABLED = 1,
    DISABLED = 2,
    LEAVE = 3,
    RESIGNED = 4,
}

/**
 * 教练查询参数
 *
 * 对应后端：CoachQueryRequest
 *
 * 说明：
 * 由于你当前未提供 CoachQueryRequest 的完整字段，
 * 这里先按后台管理常见查询条件做宽松定义。
 * 如果后端字段已明确，可继续收紧类型。
 */
export interface CoachQueryRequest {
    /**
     * 教练姓名
     */
    name?: string;

    /**
     * 手机号
     */
    phone?: string;

    /**
     * 状态：1启用 2禁用 3请假 4已离职
     */
    status?: number;

    /**
     * 场馆ID
     */
    venueId?: number;

    /**
     * 教练ID
     */
    coachId?: number | string;

    /**
     * 页码
     */
    page?: number;

    /**
     * 每页条数
     */
    pageSize?: number;

    /**
     * 其他动态查询字段
     */
    [key: string]: any;
}

/**
 * 场馆信息
 *
 * 说明：
 * 后端 CoachVO 的完整结构未提供，
 * 这里先定义后台列表/详情常见场馆结构。
 */
export interface CoachVenueVO {
    id?: number;
    name?: string;
    address?: string;
}

/**
 * 教练信息
 *
 * 对应后端：CoachVO
 *
 * 说明：
 * 由于你未提供 CoachVO 的完整字段，
 * 这里按管理后台常见展示字段做兼容定义。
 * 如果你后面补充 CoachVO，我可以再帮你精确收口。
 */
export interface CoachVO {
    /**
     * 教练ID
     */
    id?: number;

    /**
     * 教练编号
     */
    coachId?: string;

    /**
     * 姓名
     */
    name?: string;

    /**
     * 手机号
     */
    phone?: string;

    /**
     * 头像
     */
    avatar?: string;

    /**
     * 状态：1启用 2禁用 3请假 4已离职
     */
    status?: number;

    /**
     * 状态文案
     */
    statusText?: string;

    /**
     * 教练介绍
     */
    introduction?: string;

    /**
     * 证书列表
     */
    certificates?: string[];

    /**
     * 标签列表
     */
    tags?: string[];

    /**
     * 照片列表
     */
    photos?: string[];

    /**
     * 所属场馆列表
     */
    venues?: CoachVenueVO[];

    /**
     * 创建时间
     */
    createdAt?: string;

    /**
     * 更新时间
     */
    updatedAt?: string;

    /**
     * 其他后端可能返回的动态字段
     */
    [key: string]: any;
}

/**
 * 更新教练状态请求参数
 *
 * 对应后端：UpdateCoachStatusRequest
 */
export interface UpdateCoachStatusRequest {
    /**
     * 状态：1启用 2禁用 3请假 4已离职
     */
    status: CoachStatus | number;
}

/**
 * 更新教练场馆请求参数
 *
 * 对应后端：UpdateCoachVenuesRequest
 */
export interface UpdateCoachVenuesRequest {
    /**
     * 场馆ID列表
     */
    venueIds: number[];
}

/**
 * 后台查询教练列表
 *
 * 对应后端：
 * GET /api/admin/coaches
 *
 * @param params 查询参数
 * @returns 教练列表
 */
export async function getCoachListApi(params: CoachQueryRequest = {}) {
    return requestClient.get<CoachVO[]>('/api/admin/coaches', {
        params,
    });
}

/**
 * 后台查询教练详情
 *
 * 对应后端：
 * GET /api/admin/coaches/{id}
 *
 * @param id 教练主键ID
 * @returns 教练详情
 */
export async function getCoachDetailApi(id: number) {
    return requestClient.get<CoachVO>(`/api/admin/coaches/${id}`);
}

/**
 * 后台启用教练
 *
 * 对应后端：
 * POST /api/admin/coaches/{id}/enable
 *
 * @param id 教练主键ID
 * @returns 操作结果文案
 */
export async function enableCoachApi(id: number) {
    return requestClient.post<string>(`/api/admin/coaches/${id}/enable`);
}

/**
 * 后台禁用教练
 *
 * 对应后端：
 * POST /api/admin/coaches/{id}/disable
 *
 * @param id 教练主键ID
 * @returns 操作结果文案
 */
export async function disableCoachApi(id: number) {
    return requestClient.post<string>(`/api/admin/coaches/${id}/disable`);
}

/**
 * 后台更新教练状态
 *
 * 对应后端：
 * PUT /api/admin/coaches/{coachId}/status
 *
 * @param coachId 教练主键ID
 * @param data 状态更新参数
 * @returns 操作结果文案
 */
export async function updateCoachStatusApi(
    coachId: number,
    data: UpdateCoachStatusRequest,
) {
    return requestClient.put<string>(`/api/admin/coaches/${coachId}/status`, data);
}

/**
 * 后台更新教练所属场馆
 *
 * 对应后端：
 * PUT /api/admin/coaches/{coachId}/venues
 *
 * @param coachId 教练主键ID
 * @param data 场馆更新参数
 * @returns 操作结果文案
 */
export async function updateCoachVenuesApi(
    coachId: number,
    data: UpdateCoachVenuesRequest,
) {
    return requestClient.put<string>(`/api/admin/coaches/${coachId}/venues`, data);
}