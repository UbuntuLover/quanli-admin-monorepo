import { requestClient } from '#/api/request';

export interface ProductBrandDTO {
    id: number;
    name: string;
    logo?: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    sort: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductBrandQueryDTO {
    name?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    page?: number;
    pageSize?: number;
}

export interface ProductBrandListResponse {
    list: ProductBrandDTO[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CreateProductBrandRequest {
    name: string;
    logo?: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    sort?: number;
}

export interface UpdateProductBrandRequest {
    name?: string;
    logo?: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    sort?: number;
}

export function getProductBrandListApi(params: ProductBrandQueryDTO) {
    return requestClient.get<ProductBrandListResponse>('/api/product-brands/list', { params });
}

export function getAllProductBrandsApi() {
    return requestClient.get<ProductBrandDTO[]>('/api/product-brands/all');
}

export function getProductBrandDetailApi(id: string) {
    return requestClient.get<ProductBrandDTO>(`/api/product-brands/${id}`);
}

export function createProductBrandApi(data: CreateProductBrandRequest) {
    return requestClient.post<ProductBrandDTO>('/api/product-brands/create', data);
}

export function updateProductBrandApi(id: string, data: UpdateProductBrandRequest) {
    return requestClient.put<ProductBrandDTO>(`/api/product-brands/${id}`, data);
}

export function deleteProductBrandApi(id: string) {
    return requestClient.delete<boolean>(`/api/product-brands/${id}`);
}

export function updateProductBrandStatusApi(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return requestClient.put<boolean>(`/api/product-brands/${id}/status`, undefined, {
        params: { status },
    });
}
