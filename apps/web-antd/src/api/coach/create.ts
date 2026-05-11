import { requestClient } from '#/api/request';

export interface CoachApplyRequest {
    phone: string
    password: string
    name: string
    gender?: number | null
    birthday?: string | null // yyyy-MM-dd
    avatar?: string | null
    certificates: string[]
    specialties: string[]
    tags: string[]
    introduction?: string | null
    photos: string[]
    applyVenueIds: number[]
    employmentType?: string | null
    remark?: string | null
}



export function createCoachByApply(data: CoachApplyRequest) {
    return requestClient.post<string>('/api/admin/coach/create', data)
}


