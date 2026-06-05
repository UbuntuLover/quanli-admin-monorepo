export interface ProductQueryDTO {
    categoryId?: string;
    brandId?: string;
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    isNew?: number;
    isHot?: number;
    status?: string;
    productType?: string;
    benefitType?: string;
    sortField?: string;
    sortDirection?: 'ASC' | 'DESC';
    page: number;
    pageSize: number;
}

export interface ProductListDTO {
    id: string;
    productNo: string;
    name: string;
    subtitle?: string;
    sales: number;
    status: string;
    mainImage?: string;
    isNew: number;
    isHot: number;
    startPrice: number;
    startOriginalPrice?: number;
    hasActivity: boolean;
    priceLabel: string;
}

export interface ProductSkuDTO {
    id: string;
    productId: string;
    skuNo: string;
    skuName: string;
    sales: number;
    attributes: Record<string, string>;
    image?: string;
    price: number;
    originalPrice: number;
    stock: number;
    status: string;
    createdAt: string;
}

export interface ProductDTO {
    id: string;
    productNo: string;
    name: string;
    categoryId: string;
    categoryName?: string;
    brandId?: string;
    brandName?: string;
    subtitle?: string;
    description?: string;
    sales: number;
    status: string;
    isNew: number;
    isHot: number;
    mainImage?: string;
    videoUrl?: string;
    deliveryMode?: string;
    benefitType?: string;
    productType?: string;
    createdAt: string;
    images?: string[];
    skus?: ProductSkuDTO[];
    attributes?: ProductAttributeDTO[];
}

export interface ProductListResponse {
    list: ProductListDTO[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CreateProductSkuRequest {
    skuName: string;
    price: number;
    originalPrice: number;
    stock: number;
    attributes?: Record<string, string>;
    image?: string;
}

export interface CreateProductRequest {
    name: string;
    categoryId: string;
    brandId?: string;
    subtitle?: string;
    description?: string;
    isNew?: number;
    isHot?: number;
    mainImage?: string;
    videoUrl?: string;
    productType?: string;
    deliveryMode?: string;
    benefitType?: string;
    images?: string[];
    skus: CreateProductSkuRequest[];
}

export interface UpdateProductRequest {
    name?: string;
    categoryId?: string;
    brandId?: string;
    subtitle?: string;
    description?: string;
    status?: string;
    isNew?: number;
    isHot?: number;
    mainImage?: string | number;
    images?: number[];
    videoUrl?: string;
}

export interface ProductAttributeDTO {
    id: string;
    name: string;
    values?: ProductAttributeValueDTO[];
}

export interface ProductAttributeValueDTO {
    id: string;
    name: string;
    image?: string;
}

export interface ProductDetailAttributeDTO {
    id: string;
    name: string;
    values: ProductAttributeValueDTO[];
}

export interface ProductDetailSkuDTO {
    skuId: string;
    price?: number;
    stock?: number;
    attributes: Record<string, string>;
    image?: string;
    originalPrice?: number;
    salePrice?: number;
    activityPrice?: number;
}

export interface GroupBuyInfoDTO {
    id: string;
    price: number;
    minMembers: number;
    maxMembers: number;
    duration: number;
    status: string;
    startTime: string;
    endTime: string;
}

export interface ProductDetailDTO {
    id: string;
    productNo?: string;
    name: string;
    subtitle?: string;
    description?: string;
    mainImage?: string;
    mainImages?: string[];
    detailImages?: string[];
    videoUrl?: string;
    sales?: number;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    minOriginalPrice?: number;
    maxOriginalPrice?: number;
    hasActivity?: boolean;
    totalStock?: number;
    totalSales?: number;
    attributes?: ProductDetailAttributeDTO[];
    skus?: ProductDetailSkuDTO[];
    groupBuyInfo?: GroupBuyInfoDTO;
}
