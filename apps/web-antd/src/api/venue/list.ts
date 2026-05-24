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
    status: string; // 例如：营业中/休业中/装修中/未知
}

/**
 * /api/venue/list 的单项 VO
 * 后端是 VenueListVO，你没贴字段定义
 * 这里先做宽松兼容，至少保证常用字段可用
 */
export interface VenueListVO {
    id: number;
    name?: string;
    address?: string | null;
    logo?: string | null;
    distance?: number | null;
    isFavorite?: boolean;
    businessStatus?: number | null;
    [key: string]: any;
}

/** 查询参数（对齐 VenueController.getVenueList） */
export interface VenueQueryDTO {
    pageNum?: number;
    pageSize?: number;
    latitude?: number;
    longitude?: number;
    name?: string;
    city?: string;
    businessStatus?: number;
}

/**
 * MyBatis-Plus Page<T> 常见结构
 * （你后端直接返回 Page<VenueListVO>）
 */
export interface MpPage<T> {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages?: number;
    [key: string]: any;
}

/** 收藏接口返回结构（后端 Result<Map<String, Any>>） */
export interface ToggleFavoriteResult {
    isFavorite: boolean;
    message: string;
    [key: string]: any;
}

/** =========================
 * API（对齐后端 Controller）
 * ========================= */

/**
 * 分页获取场馆列表
 * GET /api/venue/list
 */
export function getVenueListApi(params: VenueQueryDTO) {
    return requestClient.get<MpPage<VenueListVO>>('/api/venue/list', { params });
}

/**
 * 收藏/取消收藏场馆
 * POST /api/venue/{venueId}/favorite?memberId=xxx
 */
export function toggleVenueFavoriteApi(venueId: number, memberId: number) {
    return requestClient.post<ToggleFavoriteResult>(`/api/venue/${venueId}/favorite`, null, {
        params: { memberId },
    });
}

/**
 * 获取场馆详情
 * GET /api/venue/detail/{venueId}
 */
export function getVenueDetailApi(venueId: number) {
    return requestClient.get<VenueDetailDTO>(`/api/venue/detail/${venueId}`);
}

/**
 * 获取所有场馆
 * GET /api/venue/all
 */
export function getAllVenuesApi() {
    return requestClient.get<VenueDetailDTO[]>('/api/venue/all');
}
