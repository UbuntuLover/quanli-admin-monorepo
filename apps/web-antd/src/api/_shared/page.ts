export interface PageResult<T> {
    list?: T[];
    items?: T[];
    records?: T[];
    total: number;
    page?: number;
    pageNum?: number;
    current?: number;
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
        list: res.list ?? res.items ?? res.records ?? [],
        total: Number(res.total ?? 0),
        page: Number(res.page ?? res.pageNum ?? res.current ?? 1),
        pageSize: Number(res.pageSize ?? res.size ?? 20),
    };
}
