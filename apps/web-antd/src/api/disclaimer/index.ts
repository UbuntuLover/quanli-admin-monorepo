import {requestClient} from '#/api/request';

/* =========================
 * 基础分页结构（对齐 PageResult）
 * ========================= */
export interface PageResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

/* =========================
 * 请求 DTO（对齐后端 dto.admin）
 * ========================= */

export interface CreateDisclaimerDocReq {
    code: string;
    name: string;
    sceneType: string;
    forceReconfirmOnUpdate?: boolean;
    requireCheckboxConfirm?: boolean;
    requireScrollToEnd?: boolean;
    confirmMode: string;
    description?: string | null;
}

export interface CreateDisclaimerVersionReq {
    docId: number;
    title: string;
    contentHtml: string;
    contentJson?: string | null;
    summary?: string | null;
    confirmText: string;
    versionRemark?: string | null;
}

export interface PublishDisclaimerVersionReq {
    docId: number;
    versionId: number;
}

export interface BindDisclaimerReq {
    docId: number;
    targetType: string;
    targetId: string;
    priority?: number;
    enabled?: boolean;
}

export interface QueryDisclaimerDocReq {
    page: number;
    pageSize: number;
    keyword?: string;
    sceneType?: string;
}

export interface UpdateDisclaimerDocReq {
    id: number;
    name?: string;
    sceneType?: string;
    forceReconfirmOnUpdate?: boolean;
    requireCheckboxConfirm?: boolean;
    requireScrollToEnd?: boolean;
    confirmMode?: string;
    description?: string | null;
}

export interface SetPublishStatusReq {
    docId: number;
    versionId: number;
    published: boolean;
}

// 后端有 typealias SetPublishedReq = SetPublishStatusReq
export type SetPublishedReq = SetPublishStatusReq;

/* =========================
 * 响应 VO（对齐后端 disclaimer.vo）
 * ========================= */

export interface DisclaimerVersionVO {
    versionId: number;
    docId: number;
    title: string;
    contentHtml: string;
    contentJson: string;
    summary?: string | null;
    confirmText?: string | null;
    versionRemark?: string | null;
    isPublished?: boolean | null;
    publishedAt?: string | null;
    createdAt?: string | null;
}

export interface DisclaimerDocListItemVO {
    id: number;
    code: string;
    name: string;
    sceneType: string;
    confirmMode: string;
    requireCheckboxConfirm?: boolean | null;
    requireScrollToEnd?: boolean | null;
    forceReconfirmOnUpdate?: boolean | null;
    description?: string | null;
    isPublished?: boolean | null;
    currentVersionId?: number | null;
    currentVersionTitle?: string | null;
    createAt?: string | null; // 后端字段是 createAt（非 createdAt）
    updateAt?: string | null; // 后端字段是 updateAt（非 updatedAt）
}

export interface DisclaimerDocDetailVO {
    id: number;
    code: string;
    name: string;
    sceneType: string;
    confirmMode: string;
    requireCheckboxConfirm?: boolean | null;
    requireScrollToEnd?: boolean | null;
    forceReconfirmOnUpdate?: boolean | null;
    description?: string | null;
    isPublished?: boolean | null;
    currentVersionId?: number | null;
    currentVersion?: DisclaimerVersionVO | null;
    allVersions: Array<DisclaimerVersionVO | null>;
    createdAt?: string | null;
    updatedAt?: string | null;
}

/* =========================
 * API：创建 / 版本 / 绑定
 * ========================= */

/** 创建免责声明文档 -> docId */
export async function createDisclaimerDoc(data: CreateDisclaimerDocReq): Promise<number> {
    return requestClient.post('/admin/disclaimer/doc/create', data);
}

/** 创建免责声明版本 -> versionId */
export async function createDisclaimerVersion(data: CreateDisclaimerVersionReq): Promise<number> {
    return requestClient.post('/admin/disclaimer/version/create', data);
}

/** 发布免责声明版本 -> "ok" */
export async function publishDisclaimerVersion(data: PublishDisclaimerVersionReq): Promise<string> {
    return requestClient.post('/admin/disclaimer/version/publish', data);
}

/** 绑定免责声明 -> bindId */
export async function bindDisclaimerDoc(data: BindDisclaimerReq): Promise<number> {
    return requestClient.post('/admin/disclaimer/bind', data);
}

/* =========================
 * API：文档管理（新增）
 * ========================= */

/** 分页查询免责声明文档列表 */
export async function pageDisclaimerDocs(
    params: QueryDisclaimerDocReq,
): Promise<PageResult<DisclaimerDocListItemVO>> {
    return requestClient.get('/admin/disclaimer/doc/page', {params});
}

/** 获取免责声明文档详情 */
export async function getDisclaimerDocDetail(id: number): Promise<DisclaimerDocDetailVO> {
    return requestClient.get(`/admin/disclaimer/doc/${id}`);
}

/** 更新免责声明文档 -> "ok" */
export async function updateDisclaimerDoc(data: UpdateDisclaimerDocReq): Promise<string> {
    return requestClient.put('/admin/disclaimer/doc/update', data);
}

/** 删除免责声明文档 -> "ok" */
export async function deleteDisclaimerDoc(id: number): Promise<string> {
    return requestClient.delete(`/admin/disclaimer/doc/${id}`);
}

/* =========================
 * API：版本管理（新增）
 * ========================= */

/** 查询文档的所有版本列表 */
export async function listDisclaimerVersions(docId: number): Promise<DisclaimerVersionVO[]> {
    return requestClient.get(`/admin/disclaimer/version/list/${docId}`);
}

/** 设置/取消发布状态 -> "ok" */
export async function setDisclaimerPublished(data: SetPublishStatusReq): Promise<string> {
    return requestClient.post('/admin/disclaimer/version/set-published', data);
}

/* =========================
 * 快捷编排流程（保留并增强）
 * ========================= */

export interface CreatePublishBindDisclaimerReq {
    doc: CreateDisclaimerDocReq;
    version: Omit<CreateDisclaimerVersionReq, 'docId'>;
    bind?: Omit<BindDisclaimerReq, 'docId'>; // 允许仅创建+发布，不绑定
}

export interface CreatePublishBindDisclaimerResult {
    docId: number;
    versionId: number;
    bindId?: number;
    publishResult: string;
}

/**
 * 一体化流程：
 * 1) 创建文档
 * 2) 创建版本
 * 3) 发布版本
 * 4) 可选绑定
 */
export async function createPublishBindDisclaimer(
    payload: CreatePublishBindDisclaimerReq,
): Promise<CreatePublishBindDisclaimerResult> {
    const docId = await createDisclaimerDoc(payload.doc);

    const versionId = await createDisclaimerVersion({
        docId,
        ...payload.version,
    });

    const publishResult = await publishDisclaimerVersion({
        docId,
        versionId,
    });

    let bindId: number | undefined;
    if (payload.bind) {
        bindId = await bindDisclaimerDoc({
            docId,
            ...payload.bind,
        });
    }

    return {
        docId,
        versionId,
        bindId,
        publishResult,
    };
}
