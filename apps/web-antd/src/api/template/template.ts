import {baseRequestClient, requestClient} from '#/api/request';

/** =========================
 * 创建/更新商品（PackageProductAdminController）
 * ========================= */

export interface CreateComboChildItem {
    /** 你当前后端 DTO 注释写的是 string，这里保持兼容 */
    childTemplateId: string;
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
    brandId?: string | null;
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
    originalPrice: number; // 分
    sellingPrice: number; // 分
    newCustomerPrice?: number | null;

    applicableVenues?: number[] | null;
    maxConcurrentBookings?: number | null;
    maxDailyBookings?: number | null;

    children: CreateComboChildItem[];

    productName: string;
    categoryId: string;
    brandId?: string | null;
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
    templateId: string;
    productId?: string;
    skuId?: string;
    benefitConfigId?: string;
    templateNo?: string;
    productNo?: string;
    skuNo?: string;
    templateName?: string;
    productName?: string;
    skuName?: string;
    cardType?: string;
    price?: number;
    originalPrice?: number;
    message?: string;
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
export function updateSinglePackageProductApi(id: string, data: CreateSinglePackageProductRequest) {
    return requestClient.put<boolean>(`/admin/package-products/single/${id}`, data);
}

/** 更新组合卡商品 */
export function updateComboPackageProductApi(id: string, data: CreateComboPackageProductRequest) {
    return requestClient.put<boolean>(`/admin/package-products/combo/${id}`, data);
}

/** =========================
 * 模板管理（严格对齐 PackageTemplateAdminController）
 * ========================= */

export interface PackageTemplateQueryDTO {
    cardType?: 'COURSE' | 'VENUE' | 'COMBO';
    status?: number; // 1启用 2停用
    keyword?: string;
    page?: number;
    pageSize?: number;
}

export interface PackageTemplateListDTO {
    id: string;
    templateNo: string;
    name: string;
    cardType: 'COURSE' | 'VENUE' | 'COMBO';
    validityDays: number;
    originalPrice: number; // 分
    sellingPrice: number; // 分
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
    id: string;
    childTemplateId: string; // 后端当前 DTO 是 String
    childTemplateName: string;
    childType: string;
    displayName: string;
    quantity: number;
    sortOrder: number;
}

export interface PackageTemplateDetailDTO {
    id: string;
    templateNo: string;
    name: string;
    cardType: 'COURSE' | 'VENUE' | 'COMBO';
    validityDays: number;
    originalPrice: number; // 分
    sellingPrice: number; // 分
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

    /** 商品信息（后端新增） */
    productId?: string | null;
    productNo?: string | null;
    productName?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    brandId?: number | null;
    subtitle?: string | null;
    mainImage?: string | null;

    /** SKU信息（后端新增） */
    skuId?: string | null;
    skuNo?: string | null;
    skuName?: string | null;
    skuImage?: string | null;
    stockQuantity?: number | null;
    attributes?: Record<string, string> | null;

    /** 销售设置（后端新增） */
    deliveryMode?: 'DIRECT' | 'MANUAL_ACTIVATE' | string | null;
    isNew?: number | null;
    isHot?: number | null;
}

export interface AddChildTemplateRequest {
    childTemplateId: string;
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
    records?: T[];
    total: number;
    page?: number;
    pageNum?: number;
    pageSize?: number;
    size?: number;
    current?: number;
}

export interface NormalizedPageResult<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
}

export function normalizePageResult<T>(res: PageResult<T>): NormalizedPageResult<T> {
    return {
        list: res.list ?? res.items ?? res.records ?? [],
        total: Number(res.total || 0),
        page: Number(res.page ?? res.pageNum ?? res.current ?? 1),
        pageSize: Number(res.pageSize ?? res.size ?? 20),
    };
}

const TEMPLATE_BASE = '/admin/package-templates';

/** GET /admin/package-templates/list */
export function getPackageTemplateListApi(params: PackageTemplateQueryDTO) {
    return requestClient.get<PageResult<PackageTemplateListDTO>>(`${TEMPLATE_BASE}/list`, { params });
}

/** GET /admin/package-templates/{id} */
export function getPackageTemplateDetailApi(id: string) {
    return requestClient.get<PackageTemplateDetailDTO>(`${TEMPLATE_BASE}/${id}`);
}

/** GET /admin/package-templates/available-children */
export function getAvailableChildTemplatesApi(cardType?: 'COURSE' | 'VENUE' | 'COMBO') {
    return requestClient.get<PackageTemplateListDTO[]>(`${TEMPLATE_BASE}/available-children`, {
        params: { cardType },
    });
}

/** GET /admin/package-templates/{id}/children */
export function getChildrenOfComboApi(id: number) {
    return requestClient.get<PackageTemplateCompositionDTO[]>(`${TEMPLATE_BASE}/${id}/children`);
}

/** POST /admin/package-templates/{id}/children */
export function addChildTemplateApi(parentId: string, data: AddChildTemplateRequest) {
    return requestClient.post<PackageTemplateCompositionDTO>(`${TEMPLATE_BASE}/${parentId}/children`, data);
}

/** PUT /admin/package-templates/{parentId}/children/{childId} */
export function updateChildTemplateApi(
    parentId: string,
    childId: string,
    data: UpdateChildTemplateRequest,
) {
    return requestClient.put<boolean>(`${TEMPLATE_BASE}/${parentId}/children/${childId}`, data);
}

// B: 绕过拦截器链路（直连）
export function getPackageTemplateDetailRawApi(id: string) {
    return baseRequestClient.get<any>(`${TEMPLATE_BASE}/${id}`);
}

export function getChildrenOfComboRawApi(id: string) {
    return baseRequestClient.get<any>(`${TEMPLATE_BASE}/${id}/children`);
}

/** DELETE /admin/package-templates/{parentId}/children/{childId} */
export function removeChildTemplateApi(parentId: string, childId: string) {
    return requestClient.delete<boolean>(`${TEMPLATE_BASE}/${parentId}/children/${childId}`);
}

/** PUT /admin/package-templates/{id} */
export function updatePackageTemplateApi(id: string, data: UpdatePackageTemplateRequest) {
    return requestClient.put<boolean>(`${TEMPLATE_BASE}/${id}`, data);
}

/** 仅改状态（复用 update） */
export function updatePackageTemplateStatusApi(id: string, status: number) {
    return updatePackageTemplateApi(id, { status });
}

/** DELETE /admin/package-templates/{id} */
export function deletePackageTemplateApi(id: string) {
    return requestClient.delete<boolean>(`${TEMPLATE_BASE}/${id}`);
}

/** 页面已有引用：type PackageProductApi */
export namespace PackageProductApi {
    export type CreateComboChildItem = import('./template').CreateComboChildItem;
    export type CreateSinglePackageProductRequest = import('./template').CreateSinglePackageProductRequest;
    export type CreateComboPackageProductRequest = import('./template').CreateComboPackageProductRequest;
    export type CreatePackageProductResponse = import('./template').CreatePackageProductResponse;
    export type PackageTemplateListDTO = import('./template').PackageTemplateListDTO;
    export type PackageTemplateDetailDTO = import('./template').PackageTemplateDetailDTO;
}
