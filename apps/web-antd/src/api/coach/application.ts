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
 * 查询所有教练申请
 */
export function listCoachApplicationsApi() {
    return requestClient.get<CoachApplicationVO[]>(COACH_APPLICATION_BASE);
}

/**
 * 查询教练申请详情
 */
export function getCoachApplicationDetailApi(id: number) {
    return requestClient.get<CoachApplicationVO>(
        `${COACH_APPLICATION_BASE}/${id}`,
    );
}


/**
 * 审批通过
 */
export function approveCoachApplicationApi(id: number) {
    return requestClient.post<string>(
        `${COACH_APPLICATION_BASE}/${id}/approve`,
    );
}

/**
 * 驳回申请
 */
export function rejectCoachApplicationApi(
    id: number,
    data: RejectCoachApplicationRequest,
) {
    return requestClient.post<string>(
        `${COACH_APPLICATION_BASE}/${id}/reject`,
        data,
    );
}
