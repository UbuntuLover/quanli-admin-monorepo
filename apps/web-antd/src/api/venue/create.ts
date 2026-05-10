import { requestClient } from '#/api/request';


export interface BusinessHourConfig {
    isOpen: boolean;
    startTime?: string | null;
    endTime?: string | null;
}

export interface VenueCreateRequest {
    name: string;
    address?: string | null;
    province?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;

    latitude?: number | null;
    longitude?: number | null;

    areaSqm?: number | null;
    capacity?: number | null;

    facilities?: string[];
    photos?: string[];
    videos?: string[];

    description?: string | null;
    businessHours?: Record<string, BusinessHourConfig> | null;

    businessStatus: number; // 1营业中 2休业中 3装修中
    closedDates?: string[];
    notice?: string | null;
    tags?: string[];

    logo?: string | null;
    backgroundImage?: string | null;

    managerId?: number | null;
    status: number; // 1正常 2停用
}

export interface VenueOptionVO {
    id: number;
    name: string;
}

export function createVenueApi(data: VenueCreateRequest) {
    return requestClient.post<number>('/api/admin/venue/create', data);
}

// 给“新增教练”等页面复用
export function getVenueOptionsApi() {
    return requestClient.get<VenueOptionVO[]>('/api/venue/all');
}

