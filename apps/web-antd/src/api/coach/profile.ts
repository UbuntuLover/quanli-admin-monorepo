import {requestClient} from '#/api/request';

export interface CoachVenueVO {
    id: number;
    name: string;
}

export interface CoachVO {
    id: number;
    name: string;
    avatar?: number | null;
    specialties?: string[] | null;
    venues: CoachVenueVO[];
    isAvailable: boolean;
    introduction?: string | null;
    certifications?: string[] | null;
    tags?: string[] | null;
    photoFiles?: string[] | null;
}

export interface CoachProfileVO {
    id: number;
    phone?: string | null;
    avatar?: string | null;
    certificates?: string[] | null;
    tags?: string[] | null;
    introduction?: string | null;
    photos?: string[] | null;
}

export interface UpdateCoachProfileRequest {
    phone?: string;
    smsCode?: string;
    avatar?: string;
    certificates?: string[];
    tags?: string[];
    introduction?: string;
    photos?: string[];
}

export async function listCoachesApi() {
    const res = await requestClient.get<CoachVO[]>('/api/coach/list');
    return res || [];
}

export async function updateMyCoachProfileApi(data: UpdateCoachProfileRequest) {
    return await requestClient.put<CoachProfileVO>('/api/coach/profile', data);
}
