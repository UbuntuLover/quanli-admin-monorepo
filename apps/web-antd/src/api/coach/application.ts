import { requestClient } from '#/api/request';

export interface CoachApplicationVO {
    id: number;
    applicationNo?: string | null;
    phone?: string | null;
    name?: string | null;
    gender?: number | null;
    birthday?: string | null;
    avatar?: string | null;
    certificates: string[];
    specialties: string[];
    tags: string[];
    introduction?: string | null;
    photos: string[];
    applyVenueIds: number[];
    employmentType?: string | null;
    applyStatus?: string | null;
    rejectReason?: string | null;
    approverUserId?: number | null;
    approvedAt?: string | null;
    linkedCoachId?: number | null;
    remark?: string | null;
    createdAt?: string | null;
}

export interface RejectCoachApplicationRequest {
    rejectReason: string;
}

/**
 * 列表查询参数（新增）
 * keyword: 姓名/手机号关键字（模糊匹配）
 * page/pageSize: 分页参数（可选）
 * applyStatus: 按申请状态过滤（可选）
 */
export interface CoachApplicationListQuery {
    keyword?: string;
    page?: number;
    pageSize?: number;
    applyStatus?: string;
}

/**
 * 分页返回结构（新增）
 */
export interface PageResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * 后端接口：
 * GET  /api/admin/coach/applications
 * GET  /api/admin/coach/applications/{id}
 * POST /api/admin/coach/applications/{id}/approve
 * POST /api/admin/coach/applications/{id}/reject
 *
 * 注意：
 * 你的 requestClient 使用 apiURL 作为 baseURL。
 * 如果 apiURL 已经是 /api，这里就不要再写 /api。
 */
const COACH_APPLICATION_BASE = '/api/admin/coach/applications';

/**
 * 查询教练申请列表（兼容版）
 * - 支持传参 keyword/page/pageSize/applyStatus
 * - 兼容后端返回：
 *   1) CoachApplicationVO[]
 *   2) PageResult<CoachApplicationVO>
 */
export function listCoachApplicationsApi(params?: CoachApplicationListQuery) {
    return requestClient.get<CoachApplicationVO[] | PageResult<CoachApplicationVO>>(
        COACH_APPLICATION_BASE,
        { params },
    );
}

/**
 * 查询教练申请列表（数组版）
 * - 给旧页面/仅表格数据场景使用
 * - 若后端返回分页对象，会自动提取 items
 */
export async function listCoachApplicationsAsArrayApi(
    params?: CoachApplicationListQuery,
): Promise<CoachApplicationVO[]> {
    const res = await listCoachApplicationsApi(params);
    return Array.isArray(res) ? res : res.items || [];
}

/**
 * 查询教练申请列表（分页版）
 * - 给需要 total/page/pageSize 的页面使用
 * - 若后端暂时返回数组，会自动包装成分页对象
 */
export async function listCoachApplicationsAsPageApi(
    params?: CoachApplicationListQuery,
): Promise<PageResult<CoachApplicationVO>> {
    const res = await listCoachApplicationsApi(params);

    if (Array.isArray(res)) {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize || 10;
        return {
            items: res,
            total: res.length,
            page,
            pageSize,
        };
    }

    return {
        items: res.items || [],
        total: Number(res.total || 0),
        page: Number(res.page || params?.page || 1),
        pageSize: Number(res.pageSize || params?.pageSize || 10),
    };
}

/**
 * 查询教练申请详情
 */
export function getCoachApplicationDetailApi(id: number) {
    return requestClient.get<CoachApplicationVO>(`${COACH_APPLICATION_BASE}/${id}`);
}

/**
 * 审批通过
 */
export function approveCoachApplicationApi(id: number) {
    return requestClient.post<string>(`${COACH_APPLICATION_BASE}/${id}/approve`);
}

/**
 * 驳回申请
 */
export function rejectCoachApplicationApi(
    id: number,
    data: RejectCoachApplicationRequest,
) {
    return requestClient.post<string>(`${COACH_APPLICATION_BASE}/${id}/reject`, data);
}
