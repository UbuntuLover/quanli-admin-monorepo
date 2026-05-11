import {requestClient} from '#/api/request';

export interface CoachResignationVO {
    id: number;
    applicationNo?: string | null;
    coachId?: number | null;
    coachName?: string | null;
    coachPhone?: string | null;
    reason?: string | null;
    expectedResignDate?: string | null;
    applyStatus?: string | null;
    approverUserId?: number | null;
    approveRemark?: string | null;
    approvedAt?: string | null;
    cancelledAt?: string | null;
    createdAt?: string | null;
}

export interface CoachResignationPageResult {
    items: CoachResignationVO[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CoachResignationListParams {
    keyword?: string;
    applyStatus?: string;
    page?: number;
    pageSize?: number;
}

export interface RejectResignationRequest {
    approveRemark: string;
}

export async function listCoachResignationsApi(params?: CoachResignationListParams) {
    return await requestClient.get<CoachResignationPageResult | CoachResignationVO[]>(
        '/api/admin/coach/resignations',
        {params},
    );
}


export async function getCoachResignationDetailApi(id: number) {
    return await requestClient.get<CoachResignationVO>(`/api/admin/coach/resignations/${id}`);
}

export async function approveCoachResignationApi(id: number, approveRemark?: string) {
    return await requestClient.post<string>(`/api/admin/coach/resignations/${id}/approve`, null, {
        params: {approveRemark},
    });

}

export async function rejectCoachResignationApi(id: number, data: RejectResignationRequest) {
    return await requestClient.post<string>(`/api/admin/coach/resignations/${id}/reject`, data);
}