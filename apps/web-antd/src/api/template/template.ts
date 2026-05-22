import { requestClient } from '#/api/request';

/** ---------------------------
 * 通用响应（按你的项目风格可调整）
 * 如果 requestClient 已自动解包 data，这里不影响使用
 * -------------------------- */

/** 子项（组合卡） */
export interface CreateComboChildItem {
    childTemplateId: string;
    quantity: number;
    displayName?: string | null;
    sortOrder?: number | null;
}

/** 单卡创建请求 */
export interface CreateSinglePackageProductRequest {
    templateName: string;
    cardType: 'COURSE' | 'VENUE';

    courseTimes?: number | null;
    courseDuration?: number | null;
    canSpecifyCoach?: number; // 0/1

    validityDays: number;
    originalPrice: number; // 分
    sellingPrice: number;  // 分
    newCustomerPrice?: number | null; // 分

    applicableVenues?: number[] | null;
    maxConcurrentBookings?: number | null;
    maxDailyBookings?: number | null;

    venueBenefitType?: 'COUNT' | 'PERIOD' | null;
    venueTimes?: number | null;

    // 商品信息
    productName: string;
    categoryId: string;
    brandId?: number | null;
    subtitle?: string | null;
    description?: string | null;
    mainImage?: string | null;
    detailImages?: string[] | null;

    deliveryMode?: 'DIRECT' | 'MANUAL_ACTIVATE';
    isNew?: number; // 0/1
    isHot?: number; // 0/1

    // SKU
    skuName: string;
    skuImage?: string | null;
    attributes?: Record<string, string> | null;
    stockQuantity?: number;
}

/** 组合卡创建请求 */
export interface CreateComboPackageProductRequest {
    templateName: string;

    validityDays: number;
    originalPrice: number; // 分
    sellingPrice: number;  // 分
    newCustomerPrice?: number | null; // 分

    applicableVenues?: number[] | null;
    maxConcurrentBookings?: number | null;
    maxDailyBookings?: number | null;

    children: CreateComboChildItem[];

    // 商品信息
    productName: string;
    categoryId: string;
    brandId?: number | null;
    subtitle?: string | null;
    description?: string | null;
    mainImage?: string | null;
    detailImages?: string[] | null;

    deliveryMode?: 'DIRECT' | 'MANUAL_ACTIVATE';
    isNew?: number; // 0/1
    isHot?: number; // 0/1

    // SKU
    skuName: string;
    skuImage?: string | null;
    attributes?: Record<string, string> | null;
    stockQuantity?: number;
}

/** 创建返回 */
export interface CreatePackageProductResponse {
    templateId: number;
    productId?: number;
    skuId?: number;
    message?: string;
}

/** 模板列表项（复用后端 PackageTemplateListDTO） */
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
    venueBenefitType?: 'COUNT' | 'PERIOD' | null;
    venueTimes?: number | null;
    childCount: number;
    status: number;
    isOnSale: number;
    createdAt: string;
}

/** 暴露给页面的命名空间类型（匹配你现在的写法） */
export namespace PackageProductApi {
    export type CreateComboChildItem = import('./template').CreateComboChildItem;
    export type CreateSinglePackageProductRequest = import('./template').CreateSinglePackageProductRequest;
    export type CreateComboPackageProductRequest = import('./template').CreateComboPackageProductRequest;
    export type CreatePackageProductResponse = import('./template').CreatePackageProductResponse;
    export type PackageTemplateListDTO = import('./template').PackageTemplateListDTO;
}

/** =========================
 * 创建接口
 * ========================= */

/**
 * 创建单卡模板商品
 * 注意：这里路径请与你后端“创建接口Controller”保持一致
 * 若你实际是 /admin/package-products/single，请改此路径
 */
export function createSinglePackageProductApi(data: CreateSinglePackageProductRequest) {
    return requestClient.post<CreatePackageProductResponse>(
        '/admin/package-products/single',
        data,
    );
}

/**
 * 创建组合卡模板商品
 * 若你后端实际是 /admin/package-products/combo，请保持如下
 */
export function createComboPackageProductApi(data: CreateComboPackageProductRequest) {
    return requestClient.post<CreatePackageProductResponse>(
        '/admin/package-products/combo',
        data,
    );
}

/** =========================
 * 组合子模板下拉接口（你后端已具备）
 * GET /admin/package-templates/available-children?cardType=COURSE|VENUE
 * ========================= */
export function getAvailableChildTemplatesApi(cardType?: 'COURSE' | 'VENUE') {
    return requestClient.get<PackageTemplateListDTO[]>(
        '/admin/package-templates/available-children',
        { params: { cardType } },
    );
}
