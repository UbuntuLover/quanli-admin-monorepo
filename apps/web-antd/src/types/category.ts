export interface CategoryDTO {
    id: string;
    name: string;
    parentId: number;
    level: number;
    sort: number;
    icon?: string;
    status: string;
    children?: CategoryDTO[];
}

export interface CascaderOption {
    value: string;
    label: string;
    children?: CascaderOption[];
    disabled?: boolean;
}

export interface CreateCategoryRequest {
    name: string;
    parentId: string;
    sort?: number;
    icon?: string;
}

export interface UpdateCategoryRequest {
    name?: string;
    parentId?: number;
    sort?: number;
    icon?: string;
    status?: string;
}

export interface CategoryDeletePreviewDTO {
    categoryId: number;
    categoryName: string;
    categoryLevel: number;
    hasChildren: boolean;
    categoryCount: number;
    categoryIds: number[];
    productCount: number;
    productIds: number[];
    skuCount: number;
    imageCount: number;
    warningMessage: string;
}

export interface MoveCategoryProductsRequest {
    targetCategoryId: number;
    includeChildren?: boolean;
}
