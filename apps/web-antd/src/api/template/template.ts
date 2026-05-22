import {requestClient} from '#/api/request';

/** =========================
 * 创建商品相关（你现有创建页在用）
 * ========================= */

export interface CreateComboChildItem {
    childTemplateId: string; // 你当前后端 DTO 已是 string
    quantity: number;
    displayName?: string | null;
    sortOrder?: number | null;
}

export interface CreateSinglePackageProductRequest {
    templateName: string;
    cardType: 'COURSE' | 'VENUE';

    courseTimes?: number | null;
    courseDuration?: number | null;
    canSpecifyCoach?: number;

    validityDays: number;
    originalPrice: number; // 分
    sellingPrice: number; // 分
    newCustomerPrice?: number | null;

    applicableVenues?: number[] | null;
    maxConcurrentBookings?: number | null;
    maxDailyBookings?: number | null;

    venueBenefitType?: 'COUNT' | 'PERIOD' | null;
    venueTimes?: number | null;

    productName: string;
    categoryId: string;
    brandId?: number | null;
    subtitle?: string | null;
    description?: string | null;
    mainImage?: string | null;
    detailImages?: string[] | null;

    deliveryMode?: 'DIRECT' | 'MANUAL_ACTIVATE';
    isNew?: number;
    isHot?: number;

    skuName: string;
    skuImage?: string | null;
    attributes?: Record<string, string> | null;
    stockQuantity?: number;
}

export interface CreateComboPackageProductRequest {
    templateName: string;

    validityDays: number;
    originalPrice: number;
    sellingPrice: number;
    newCustomerPrice?: number | null;

    applicableVenues?: number[] | null;
    maxConcurrentBookings?: number | null;
    maxDailyBookings?: number | null;

    children: CreateComboChildItem[];

    productName: string;
    categoryId: string;
    brandId?: number | null;
    subtitle?: string | null;
    description?: string | null;
    mainImage?: string | null;
    detailImages?: string[] | null;

    deliveryMode?: 'DIRECT' | 'MANUAL_ACTIVATE';
    isNew?: number;
    isHot?: number;

    skuName: string;
    skuImage?: string | null;
    attributes?: Record<string, string> | null;
    stockQuantity?: number;
}

export interface CreatePackageProductResponse {
    templateId: number;
    productId?: number;
    skuId?: number;
    message?: string;
}

/** 页面已有引用：type PackageProductApi */
export namespace PackageProductApi {
    export type CreateComboChildItem = import('./template').CreateComboChildItem;
    export type CreateSinglePackageProductRequest = import('./template').CreateSinglePackageProductRequest;
    export type CreateComboPackageProductRequest = import('./template').CreateComboPackageProductRequest;
    export type CreatePackageProductResponse = import('./template').CreatePackageProductResponse;
    export type PackageTemplateListDTO = import('./template').PackageTemplateListDTO;
}

/** 创建单卡商品 */
export function createSinglePackageProductApi(data: CreateSinglePackageProductRequest) {
    return requestClient.post<CreatePackageProductResponse>('/admin/package-products/single', data);
}

/** 创建组合卡商品 */
export function createComboPackageProductApi(data: CreateComboPackageProductRequest) {
    return requestClient.post<CreatePackageProductResponse>('/admin/package-products/combo', data);
}

/** 更新单卡商品 */
export function updateSinglePackageProductApi(id: number, data: CreateSinglePackageProductRequest) {
    return requestClient.put<boolean>(`/admin/package-products/single/${id}`, data);
}

/** 更新组合卡商品 */
export function updateComboPackageProductApi(id: number, data: CreateComboPackageProductRequest) {
    return requestClient.put<boolean>(`/admin/package-products/combo/${id}`, data);
}

/** =========================
 * 模板管理（严格对齐 PackageTemplateAdminController）
 * ========================= */

export interface PackageTemplateQueryDTO {
    cardType?: 'COURSE' | 'VENUE' | 'COMBO';
    status?: number;
    keyword?: string; // 后端字段名是 keyword
    page?: number;
    pageSize?: number;
}

export interface PackageTemplateListDTO {
    id: number;
    templateNo: string;
    name: string;
    cardType: 'COURSE' | 'VENUE' | 'COMBO';
    validityDays: number;
    originalPrice: number;
    sellingPrice: number;
    courseTimes?: number | null;
    courseDuration?: number | null;
    venueBenefitType?: string | null;
    venueTimes?: number | null;
    childCount: number;
    status: number;
    isOnSale: number;
    createdAt: string;
}

export interface PackageTemplateCompositionDTO {
    id: number;
    childTemplateId: string; // 你后端当前定义是 String
    childTemplateName: string;
    childType: string;
    displayName: string;
    quantity: number;
    sortOrder: number;
}

export interface PackageTemplateDetailDTO {
    id: number;
    templateNo: string;
    name: string;
    cardType: string;
    validityDays: number;
    originalPrice: number;
    sellingPrice: number;
    newCustomerPrice?: number | null;
    courseTimes?: number | null;
    courseDuration?: number | null;
    canSpecifyCoach: number;
    maxConcurrentBookings: number;
    maxDailyBookings?: number | null;
    applicableVenues?: number[] | null;
    coverImage?: string | null;
    detailImages?: string[] | null;
    description?: string | null;
    status: number;
    isOnSale: number;
    children: PackageTemplateCompositionDTO[];
    createdAt: string;
}

export interface AddChildTemplateRequest {
    childTemplateId: number; // 后端 AddChildTemplateRequest 是 Long
    quantity?: number;
    displayName?: string | null;
    sortOrder?: number;
}

export interface UpdateChildTemplateRequest {
    quantity?: number | null;
    displayName?: string | null;
    sortOrder?: number | null;
}

export interface UpdatePackageTemplateRequest {
    name?: string | null;
    validityDays?: number | null;
    originalPrice?: number | null;
    sellingPrice?: number | null;
    newCustomerPrice?: number | null;
    applicableVenues?: number[] | null;
    maxConcurrentBookings?: number | null;
    maxDailyBookings?: number | null;
    isOnSale?: number | null;
    sortOrder?: number | null;
    coverImage?: string | null;
    detailImages?: string[] | null;
    description?: string | null;
    status?: number | null;
    venueBenefitType?: string | null;
    venueTimes?: number | null;
}

/** PageResult 兼容 */
export interface PageResult<T> {
    list?: T[];
    items?: T[];
    total: number;
    page?: number;
    pageNum?: number;
    pageSize?: number;
    size?: number;
}

export interface NormalizedPageResult<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
}

export function normalizePageResult<T>(res: PageResult<T>): NormalizedPageResult<T> {
    return {
        list: res.list ?? res.items ?? [],
        total: Number(res.total || 0),
        page: Number(res.page ?? res.pageNum ?? 1),
        pageSize: Number(res.pageSize ?? res.size ?? 20),
    };
}

const TEMPLATE_BASE = '/admin/package-templates';

/** GET /admin/package-templates/list */
export function getPackageTemplateListApi(params: PackageTemplateQueryDTO) {
    return requestClient.get<PageResult<PackageTemplateListDTO>>(`${TEMPLATE_BASE}/list`, {params});
}

/** GET /admin/package-templates/{id} */
export function getPackageTemplateDetailApi(id: number) {
    return requestClient.get<PackageTemplateDetailDTO>(`${TEMPLATE_BASE}/${id}`);
}

/** GET /admin/package-templates/available-children */
export function getAvailableChildTemplatesApi(cardType?: 'COURSE' | 'VENUE' | 'COMBO') {
    return requestClient.get<PackageTemplateListDTO[]>(`${TEMPLATE_BASE}/available-children`, {
        params: {cardType},
    });
}

/** GET /admin/package-templates/{id}/children */
export function getChildrenOfComboApi(id: number) {
    return requestClient.get<PackageTemplateCompositionDTO[]>(`${TEMPLATE_BASE}/${id}/children`);
}

/** POST /admin/package-templates/{id}/children */
export function addChildTemplateApi(parentId: number, data: AddChildTemplateRequest) {
    return requestClient.post<PackageTemplateCompositionDTO>(`${TEMPLATE_BASE}/${parentId}/children`, data);
}

/** PUT /admin/package-templates/{parentId}/children/{childId} */
export function updateChildTemplateApi(
    parentId: number,
    childId: number,
    data: UpdateChildTemplateRequest,
) {
    return requestClient.put<boolean>(`${TEMPLATE_BASE}/${parentId}/children/${childId}`, data);
}

/** DELETE /admin/package-templates/{parentId}/children/{childId} */
export function removeChildTemplateApi(parentId: number, childId: number) {
    return requestClient.delete<boolean>(`${TEMPLATE_BASE}/${parentId}/children/${childId}`);
}

/** PUT /admin/package-templates/{id} */
export function updatePackageTemplateApi(id: number, data: UpdatePackageTemplateRequest) {
    return requestClient.put<boolean>(`${TEMPLATE_BASE}/${id}`, data);
}

/** 仅改状态（复用 update 接口） */
export function updatePackageTemplateStatusApi(id: number, status: number) {
    return updatePackageTemplateApi(id, {status});
}

/** DELETE /admin/package-templates/{id} */
export function deletePackageTemplateApi(id: number) {
    return requestClient.delete<boolean>(`${TEMPLATE_BASE}/${id}`);
}
