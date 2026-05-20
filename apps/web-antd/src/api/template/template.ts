import { requestClient } from '#/api/request';

export namespace PackageProductApi {
    export type CardType = 'COURSE' | 'VENUE';
    export type DeliveryMode = 'DIRECT' | 'MANUAL_ACTIVATE';
    export type VenueBenefitType = 'COUNT' | 'PERIOD';

    export interface CreateSinglePackageProductRequest {
        templateName: string;
        cardType: CardType;

        courseTimes?: null | number;
        courseDuration?: null | number;
        canSpecifyCoach?: number;

        validityDays: number;
        originalPrice: number;
        sellingPrice: number;
        newCustomerPrice?: null | number;

        applicableVenues?: null | number[];
        maxConcurrentBookings?: number;
        maxDailyBookings?: null | number;

        venueBenefitType?: null | VenueBenefitType;
        venueTimes?: null | number;

        productName: string;
        categoryId: number;
        brandId?: null | number;
        subtitle?: null | string;
        description?: null | string;
        mainImage?: null | string;
        detailImages?: null | string[];

        deliveryMode?: DeliveryMode;

        isNew?: number;
        isHot?: number;

        skuName: string;
        skuImage?: null | string;
        attributes?: null | Record<string, string>;
        stockQuantity?: number;
    }

    export interface CreateComboChildItem {
        childTemplateId: number;
        quantity: number;
        displayName?: null | string;
        sortOrder?: number;
    }

    export interface CreateComboPackageProductRequest {
        templateName: string;

        validityDays: number;
        originalPrice: number;
        sellingPrice: number;
        newCustomerPrice?: null | number;

        applicableVenues?: null | number[];
        maxConcurrentBookings?: number;
        maxDailyBookings?: null | number;

        children: CreateComboChildItem[];

        productName: string;
        categoryId: number;
        brandId?: null | number;
        subtitle?: null | string;
        description?: null | string;
        mainImage?: null | string;
        detailImages?: null | string[];

        deliveryMode?: DeliveryMode;

        isNew?: number;
        isHot?: number;

        skuName: string;
        skuImage?: null | string;
        attributes?: null | Record<string, string>;
        stockQuantity?: number;
    }

    export interface CreatePackageProductResponse {
        templateId: number;
        productId: number;
        skuId: number;
        benefitConfigId: number;

        templateNo: string;
        productNo: string;
        skuNo: string;

        templateName: string;
        productName: string;
        skuName: string;

        cardType: string;
        price: number;
        originalPrice: number;
    }
}

/**
 * 创建单卡权益商品
 * POST /admin/package-products/single
 */
export async function createSinglePackageProductApi(
    data: PackageProductApi.CreateSinglePackageProductRequest,
) {
    return requestClient.post<PackageProductApi.CreatePackageProductResponse>(
        '/admin/package-products/single',
        data,
    );
}

/**
 * 创建组合卡权益商品
 * POST /admin/package-products/combo
 */
export async function createComboPackageProductApi(
    data: PackageProductApi.CreateComboPackageProductRequest,
) {
    return requestClient.post<PackageProductApi.CreatePackageProductResponse>(
        '/admin/package-products/combo',
        data,
    );
}
