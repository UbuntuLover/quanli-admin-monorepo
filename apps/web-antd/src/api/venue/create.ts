import { requestClient } from '#/api/request';

/** =========================
 * 通用类型
 * ========================= */

export interface BusinessHourConfig {
    isOpen: boolean;
    startTime?: string | null;
    endTime?: string | null;
}

/** MyBatis-Plus Page 结构（后端返回 Page<VenueAdminListDTO>） */
export interface MpPage<T> {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages?: number;
    [key: string]: any;
}

/** 如果你需要在页面统一成 list/total/page/pageSize，可用这个方法 */
export interface NormalizedPageResult<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
}
export function normalizeMpPage<T>(page: MpPage<T>): NormalizedPageResult<T> {
    return {
        list: page.records ?? [],
        total: Number(page.total ?? 0),
        page: Number(page.current ?? 1),
        pageSize: Number(page.size ?? 20),
    };
}

/** =========================
 * 请求 DTO（对齐后端）
 * ========================= */

/** POST /api/admin/venue/create */
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

    facilities?: string[] | null;
    photos?: string[] | null;
    videos?: string[] | null;

    description?: string | null;
    businessHours?: Record<string, BusinessHourConfig> | null;

    businessStatus: number; // 1-营业中 2-休业中 3-装修中
    closedDates?: string[] | null;
    notice?: string | null;
    tags?: string[] | null;

    logo?: string | null;
    backgroundImage?: string | null;

    managerId?: number | null;
    status: number; // 1-正常 2-停用
}

/** PUT /api/admin/venue/update */
export interface VenueUpdateRequest {
    venueId: number;

    name?: string | null;
    address?: string | null;
    province?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;

    latitude?: number | null;
    longitude?: number | null;

    areaSqm?: number | null;
    capacity?: number | null;

    facilities?: string[] | null;
    photos?: string[] | null;
    videos?: string[] | null;

    description?: string | null;
    businessHours?: Record<string, BusinessHourConfig> | null;

    businessStatus?: number | null;
    closedDates?: string[] | null;
    notice?: string | null;
    tags?: string[] | null;

    logo?: string | null;
    backgroundImage?: string | null;

    managerId?: number | null;
    status?: number | null;
}

/** GET /api/admin/venue/list */
export interface VenueAdminQueryDTO {
    name?: string;
    city?: string;
    businessStatus?: number;
    status?: number;
    page?: number; // 后端参数名 page
    pageSize?: number;
}

/** PUT /api/admin/venue/batch/business-status */
export interface BatchUpdateBusinessStatusRequest {
    venueIds: number[];
    businessStatus: number; // 1/2/3
}

/** =========================
 * 返回 DTO（对齐后端）
 * ========================= */

export interface VenueAdminListDTO {
    id: number;
    venueNo: string;
    name: string;
    city?: string | null;
    phone?: string | null;
    businessStatus: number;
    businessStatusText: string;
    status: number;
    areaSqm?: number | null; // 后端 BigDecimal -> 前端 number
    capacity?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface VenueDetailForAdminDTO {
    id: number;
    venueNo: string;
    name: string;
    address?: string | null;
    province?: string | null;
    city?: string | null;
    district?: string | null;
    phone?: string | null;

    latitude?: number | null;   // BigDecimal
    longitude?: number | null;  // BigDecimal
    areaSqm?: number | null;    // BigDecimal
    capacity?: number | null;

    facilities?: string[] | null;
    photos?: string[] | null;
    videos?: string[] | null;
    description?: string | null;

    businessHours?: Record<string, BusinessHourConfig> | null;
    businessStatus: number;
    businessStatusText: string;

    closedDates?: string[] | null;
    notice?: string | null;
    tags?: string[] | null;
    logo?: string | null;
    backgroundImage?: string | null;

    managerId?: number | null;
    status: number;

    createdAt?: string | null;
    updatedAt?: string | null;
}

/** 复用给“新增教练”等页面的场馆选项 */
export interface VenueOptionVO {
    id: number;
    name: string;
}

/** =========================
 * API Functions
 * ========================= */

/** 创建场馆 */
export function createVenueApi(data: VenueCreateRequest) {
    return requestClient.post<number>('/api/admin/venue/create', data);
}

/** 编辑场馆 */
export function updateVenueApi(data: VenueUpdateRequest) {
    return requestClient.put<boolean>('/api/admin/venue/update', data);
}

/** 管理后台-场馆详情 */
export function getVenueDetailForAdminApi(venueId: number) {
    return requestClient.get<VenueDetailForAdminDTO>(`/api/admin/venue/${venueId}`);
}

/** 管理后台-场馆列表（分页） */
export function getVenueListForAdminApi(params: VenueAdminQueryDTO) {
    return requestClient.get<MpPage<VenueAdminListDTO>>('/api/admin/venue/list', { params });
}

/** 删除场馆 */
export function deleteVenueApi(venueId: number) {
    return requestClient.delete<boolean>(`/api/admin/venue/${venueId}`);
}

/** 批量更新营业状态 */
export function batchUpdateBusinessStatusApi(data: BatchUpdateBusinessStatusRequest) {
    return requestClient.put<number>('/api/admin/venue/batch/business-status', data);
}

/** 给“新增教练”等页面复用的场馆下拉（来自 C 端接口 /api/venue/all） */
export function getVenueOptionsApi() {
    return requestClient.get<VenueOptionVO[]>('/api/venue/all');
}
