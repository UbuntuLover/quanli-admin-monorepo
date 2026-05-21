import { requestClient } from '#/api/request';

import type {
    CategoryDTO,
    CategoryDeletePreviewDTO,
    CreateCategoryRequest,
    MoveCategoryProductsRequest,
    UpdateCategoryRequest,
} from '#/types/category';

/** 获取分类树 */
export function getCategoryTreeApi() {
    return requestClient.get<CategoryDTO[]>('/api/product-categories/tree');
}

/** 获取所有分类 */
export function getAllCategoriesApi() {
    return requestClient.get<CategoryDTO[]>('/api/product-categories/all');
}

/** 获取分类详情 */
export function getCategoryDetailApi(id: number) {
    return requestClient.get<CategoryDTO>(`/api/product-categories/${id}`);
}

/** 获取子分类（修正路径） */
export function getSubCategoriesApi(parentId: number) {
    return requestClient.get<CategoryDTO[]>(
        `/api/product-categories/${parentId}/sub-categories`,
    );
}

/** 获取三级分类（叶子） */
export function getLeafCategoriesApi() {
    return requestClient.get<CategoryDTO[]>('/api/product-categories/leaf');
}

/** 创建分类 */
export function createCategoryApi(data: CreateCategoryRequest) {
    return requestClient.post<CategoryDTO>('/api/product-categories/create', data);
}

/** 更新分类 */
export function updateCategoryApi(id: number, data: UpdateCategoryRequest) {
    return requestClient.put<CategoryDTO>(`/api/product-categories/${id}`, data);
}

/** 删除分类 */
export function deleteCategoryApi(id: number) {
    return requestClient.delete<boolean>(`/api/product-categories/${id}`);
}

/** 删除预览 */
export function previewDeleteCategoryApi(id: number) {
    return requestClient.get<CategoryDeletePreviewDTO>(
        `/api/product-categories/${id}/delete-preview`,
    );
}

/** 迁移商品 */
export function moveCategoryProductsApi(
    sourceCategoryId: number,
    data: MoveCategoryProductsRequest,
) {
    return requestClient.post<number>(
        `/api/product-categories/${sourceCategoryId}/move-products`,
        data,
    );
}
