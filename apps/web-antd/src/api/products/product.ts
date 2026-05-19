import { requestClient } from '#/api/request';

import type {
    CreateProductRequest,
    ProductDTO,
    ProductDetailDTO,
    ProductListDTO,
    ProductListResponse,
    ProductQueryDTO,
    UpdateProductRequest,
} from '#/types/product';

/**
 * 获取商品列表。
 */
export function getProductListApi(params: ProductQueryDTO) {
    return requestClient.get<ProductListResponse>('/api/products/list', {
        params,
    });
}

/**
 * 获取商品详情，后台使用。
 */
export function getProductDetailApi(id: string) {
    return requestClient.get<ProductDTO>(`/api/products/${id}`);
}

/**
 * 获取商品详情，前台/商城展示使用。
 *
 * 如果你的 ProductController 里实际路径不是这个，需要按后端实际接口调整。
 */
export function getProductFrontendDetailApi(id: number) {
    return requestClient.get<ProductDetailDTO>(`/api/products/${id}/frontend`);
}

/**
 * 创建商品。
 */
export function createProductApi(data: CreateProductRequest) {
    return requestClient.post<ProductDTO>('/api/products/create', data);
}

/**
 * 更新商品。
 */
export function updateProductApi(id: string, data: UpdateProductRequest) {
    return requestClient.put<ProductDTO>(`/api/products/${id}`, data);
}

/**
 * 删除商品。
 */
export function deleteProductApi(id: number) {
    return requestClient.delete<boolean>(`/api/products/${id}`);
}

/**
 * 更新商品状态。
 *
 * 后端接口：
 * PUT /api/products/{id}/status?status=ACTIVE
 */
export function updateProductStatusApi(id: number, status: string) {
    return requestClient.put<boolean>(`/api/products/${id}/status`, undefined, {
        params: {
            status,
        },
    });
}

/**
 * 获取新品商品。
 */
export function getNewProductsApi(limit = 10) {
    return requestClient.get<ProductListDTO[]>('/api/products/new', {
        params: {
            limit,
        },
    });
}

/**
 * 获取热销商品。
 */
export function getHotProductsApi(limit = 10) {
    return requestClient.get<ProductListDTO[]>('/api/products/hot', {
        params: {
            limit,
        },
    });
}

/**
 * 搜索商品。
 */
export function searchProductsApi(keyword: string, page = 1, pageSize = 10) {
    return requestClient.get<ProductDTO[]>('/api/products/search', {
        params: {
            keyword,
            page,
            pageSize,
        },
    });
}

/**
 * 按分类查询商品。
 *
 * 如果你的后端 ProductController 路径不同，请同步修改。
 */
export function getProductsByCategoryApi(
    categoryId: number,
    page = 1,
    pageSize = 10,
) {
    return requestClient.get<ProductListDTO[]>(
        `/api/products/category/${categoryId}`,
        {
            params: {
                page,
                pageSize,
            },
        },
    );
}

export const ProductStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SOLD_OUT: 'SOLD_OUT',
} as const;

export const ProductType = {
    PHYSICAL: 'PHYSICAL',
    VIRTUAL: 'VIRTUAL',
} as const;

export const ProductBenefitType = {
    PACKAGE: 'PACKAGE',
    COUPON: 'COUPON',
    BALANCE: 'BALANCE',
    MIXED: 'MIXED',
} as const;
