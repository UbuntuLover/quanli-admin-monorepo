import {baseRequestClient, requestClient} from '#/api/request';

/** =========================
 * 创建/更新商品（PackageProductAdminController）
 * ========================= */

export interface CreateComboChildItem {
    childTemplateId: number;
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
    originalPrice: number;
    sellingPrice: number;
    newCustomerPrice?: number | null;

    applicableVenues?: number[] | null;
    maxConcurrentBookings?: number | null;
    maxDailyBookings?: number | null;

    venueBenefitType?: 'COUNT' | 'PERIOD' | null;
    venueTimes?: number | null;

    /** 续费配置 */
    allowRenewal?: number;
    renewalWindowDaysBeforeExpire?: number;
    renewalGraceDaysAfterExpire?: number;

    productName: string;
    categoryId: number;
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

    /** 续费配置 */
    allowRenewal?: number;
    renewalWindowDaysBeforeExpire?: number;
    renewalGraceDaysAfterExpire?: number;

    productName: string;
    categoryId: number;
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
    benefitConfigId?: number;
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
export function updateSinglePackageProductApi(id: number | string, data: CreateSinglePackageProductRequest) {
    return requestClient.put<boolean>(`/admin/package-products/single/${id}`, data);
}

/** 更新组合卡商品 */
export function updateComboPackageProductApi(id: number | string, data: CreateComboPackageProductRequest) {
    return requestClient.put<boolean>(`/admin/package-products/combo/${id}`, data);
}

/** =========================
 * 模板管理（严格对齐 PackageTemplateAdminController）
 * ========================= */

export interface PackageTemplateQueryDTO {
    cardType?: 'COURSE' | 'VENUE' | 'COMBO';
    status?: number;
    keyword?: string;
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
    newCustomerPrice?: number | null;

    courseTimes?: number | null;
    courseDuration?: number | null;
    venueBenefitType?: 'COUNT' | 'PERIOD' | null;
    venueTimes?: number | null;

    maxConcurrentBookings?: number | null;
    maxDailyBookings?: number | null;
    applicableVenues?: number[] | null;

    /** 续费配置 */
    allowRenewal?: number;
    renewalWindowDaysBeforeExpire?: number;
    renewalGraceDaysAfterExpire?: number;
    version?: number;

    childCount: number;
    status: number;
    isOnSale: number;
    createdAt: string;
}

export interface PackageTemplateCompositionDTO {
    id: number;
    childTemplateId: number;
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
    cardType: 'COURSE' | 'VENUE' | 'COMBO';

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

    /** 续费配置 */
    allowRenewal?: number;
    renewalWindowDaysBeforeExpire?: number;
    renewalGraceDaysAfterExpire?: number;
    version?: number;

    children: PackageTemplateCompositionDTO[];
    createdAt: string;

    /** 商品信息 */
    productId?: number | null;
    productNo?: string | null;
    productName?: string | null;
    categoryId?: number | null;
    categoryName?: string | null;
    brandId?: number | null;
    subtitle?: string | null;
    mainImage?: string | null;

    /** SKU信息 */
    skuId?: number | null;
    skuNo?: string | null;
    skuName?: string | null;
    skuImage?: string | null;
    stockQuantity?: number | null;
    attributes?: Record<string, string> | null;

    /** 销售设置 */
    deliveryMode?: 'DIRECT' | 'MANUAL_ACTIVATE' | string | null;
    isNew?: number | null;
    isHot?: number | null;
}

export interface AddChildTemplateRequest {
    childTemplateId: number;
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

    /** 续费配置 */
    allowRenewal?: number | null;
    renewalWindowDaysBeforeExpire?: number | null;
    renewalGraceDaysAfterExpire?: number | null;
}

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
    return requestClient.get<PageResult<PackageTemplateListDTO>>(`${TEMPLATE_BASE}/list`, {params});
}

/** GET /admin/package-templates/{id} */
export function getPackageTemplateDetailApi(id: number | string) {
    return requestClient.get<PackageTemplateDetailDTO>(`${TEMPLATE_BASE}/${id}`);
}

/** GET /admin/package-templates/available-children */
export function getAvailableChildTemplatesApi(cardType?: 'COURSE' | 'VENUE' | 'COMBO') {
    return requestClient.get<PackageTemplateListDTO[]>(`${TEMPLATE_BASE}/available-children`, {
        params: {cardType},
    });
}

/** GET /admin/package-templates/{id}/children */
export function getChildrenOfComboApi(id: number | string) {
    return requestClient.get<PackageTemplateCompositionDTO[]>(`${TEMPLATE_BASE}/${id}/children`);
}

/** POST /admin/package-templates/{id}/children */
export function addChildTemplateApi(parentId: number | string, data: AddChildTemplateRequest) {
    return requestClient.post<PackageTemplateCompositionDTO>(`${TEMPLATE_BASE}/${parentId}/children`, data);
}

/** PUT /admin/package-templates/{parentId}/children/{childId} */
export function updateChildTemplateApi(
    parentId: number | string,
    childId: number | string,
    data: UpdateChildTemplateRequest,
) {
    return requestClient.put<boolean>(`${TEMPLATE_BASE}/${parentId}/children/${childId}`, data);
}

/** 绕过拦截器链路（直连） */
export function getPackageTemplateDetailRawApi(id: number | string) {
    return baseRequestClient.get<any>(`${TEMPLATE_BASE}/${id}`);
}

export function getChildrenOfComboRawApi(id: number | string) {
    return baseRequestClient.get<any>(`${TEMPLATE_BASE}/${id}/children`);
}

/** DELETE /admin/package-templates/{parentId}/children/{childId} */
export function removeChildTemplateApi(parentId: number | string, childId: number | string) {
    return requestClient.delete<boolean>(`${TEMPLATE_BASE}/${parentId}/children/${childId}`);
}

/** PUT /admin/package-templates/{id} */
export function updatePackageTemplateApi(id: number | string, data: UpdatePackageTemplateRequest) {
    return requestClient.put<boolean>(`${TEMPLATE_BASE}/${id}`, data);
}

/** 仅改状态（复用 update） */
export function updatePackageTemplateStatusApi(id: number | string, status: number) {
    return updatePackageTemplateApi(id, {status});
}

/** DELETE /admin/package-templates/{id} */
export function deletePackageTemplateApi(id: number | string) {
    return requestClient.delete<boolean>(`${TEMPLATE_BASE}/${id}`);
}

/** 页面已有引用：保留兼容导出 */
export const PackageProductApi = {
    createSinglePackageProductApi,
    createComboPackageProductApi,
    updateSinglePackageProductApi,
    updateComboPackageProductApi,
    getPackageTemplateListApi,
    getPackageTemplateDetailApi,
    getAvailableChildTemplatesApi,
    getChildrenOfComboApi,
    addChildTemplateApi,
    updateChildTemplateApi,
    removeChildTemplateApi,
    updatePackageTemplateApi,
    updatePackageTemplateStatusApi,
    deletePackageTemplateApi,
};
