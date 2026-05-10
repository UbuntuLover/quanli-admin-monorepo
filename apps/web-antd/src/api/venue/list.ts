import { requestClient } from '#/api/request';

export interface TodayBusinessHoursDTO {
    isOpen: boolean;
    startTime?: string | null;
    endTime?: string | null;
    dayOfWeek: string;
}

export interface CoachSimpleVO {
    id: number;
    name: string;
    avatar?: string | null;
    introduction?: string | null;
    backgroundImage?: string | null;
    tags?: string[] | null;
}

export interface VenueDetailDTO {
    id: number;
    name: string;
    address?: string | null;
    logo?: string | null;
    backgroundImage?: string | null;
    thumbnails?: string[] | null;
    businessHours?: TodayBusinessHoursDTO | null;
    phone?: string | null;
    description?: string | null;
    longitude?: number | null;
    latitude?: number | null;
    coaches?: CoachSimpleVO[] | null;
    tags?: string[] | null;
    status: string; // "营业中" | "休业中" | "装修中" | "未知"
}

export function getAllVenuesApi() {
    return requestClient.get<VenueDetailDTO[]>('/api/venue/all');
}