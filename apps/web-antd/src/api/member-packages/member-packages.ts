import {requestClient} from '#/api/request';
import type {PageResult} from '#/api/_shared/page';

/** =========================
 * 管理后台 - 会员权益卡 DTO
 * ========================= */

export type MemberPackageCardType = 'COURSE' | 'VENUE' | 'COMBO';
export type MemberPackageRole = 'SINGLE' | 'ROOT' | 'CHILD';
export type MemberPackageStatus = 1 | 2 | 3 | 4 | 5;

export interface AdminMemberPackageQueryDTO {
    memberId?: string;
    memberNo?: string;
    memberKeyword?: string;
    cardType?: MemberPackageCardType;
    status?: MemberPackageStatus;
    purchaseTimeStart?: string;
    purchaseTimeEnd?: string;
    startDateStart?: string;
    endDateEnd?: string;
    page?: number;
    pageSize?: number;
}

export interface AdminMemberPackageListDTO {
    id: string;
    packageNo: string;
    memberId: string;
    memberNo: string;
    memberName?: string | null;
    memberPhone: string;
    templateId?: string | null;
    packageName: string;
    cardType: MemberPackageCardType | string;
    cardTypeText: string;
    status: MemberPackageStatus | number;
    statusText: string;
    purchaseTime?: string | null;
    activatedAt?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    remainingDays?: number | null;
    courseTotalTimes?: number | null;
    courseRemainingTimes?: number | null;
    courseUsedTimes: number;
    venueTotalTimes?: number | null;
    venueRemainingTimes?: number | null;
    venueUsedTimes?: number | null;
    originalPrice?: number | null;
    paidPrice?: number | null;
    discountAmount?: number | null;
    isUsedNewCustomerDiscount: boolean;
    purchaseSource: string;
    grantSourceType: string;
    orderId?: string | null;
    createdAt?: string | null;
}

export interface AdminMemberPackageDetailDTO {
    id: string;
    packageNo: string;
    templateId?: string | null;
    packageName: string;
    cardType: MemberPackageCardType | string;
    cardTypeText: string;
    memberId: string;
    memberNo: string;
    memberName?: string | null;
    memberNickname?: string | null;
    memberPhone: string;
    memberAvatar?: string | null;
    status: MemberPackageStatus | number;
    statusText: string;
    statusDescription: string;
    purchaseTime?: string | null;
    activatedAt?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    originalEndDate?: string | null;
    remainingDays?: number | null;
    courseTotalTimes?: number | null;
    courseRemainingTimes?: number | null;
    courseUsedTimes: number;
    courseDuration?: number | null;
    venueTotalTimes?: number | null;
    venueRemainingTimes?: number | null;
    venueUsedTimes?: number | null;
    canSpecifyCoach: boolean;
    hasVenueAccess: boolean;
    applicableVenues?: string[] | null;
    maxConcurrentBookings: number;
    maxDailyBookings?: number | null;
    freezeStartDate?: string | null;
    freezeEndDate?: string | null;
    freezeDays: number;
    freezeReason?: string | null;
    originalPrice?: number | null;
    paidPrice?: number | null;
    discountAmount?: number | null;
    isUsedNewCustomerDiscount: boolean;
    purchaseSource: string;
    grantSourceType: string;
    orderId?: string | null;
    sourceCouponId?: string | null;
    sourceOrderItemId?: string | null;
    remark?: string | null;
    packageRole: MemberPackageRole | string;
    parentPackageId?: string | null;
    rootPackageId?: string | null;
    subPackages?: AdminMemberPackageListDTO[] | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface FreezePackageRequest {
    freezeDays: number;
    freezeReason?: string | null;
}

export interface UnfreezePackageRequest {
    unfreezeReason?: string | null;
}

export interface DeletePackageRequest {
    deleteReason?: string | null;
}

/** =========================
 * 管理后台 - 发放权益卡 DTO
 * 对齐后端 AdminGrantPackageDTO.kt
 * ========================= */

export interface AdminGrantPackageRequest {
    memberId: string;
    templateId: string;
    startDate?: string; // yyyy-MM-dd
    remark?: string | null;
    grantUniqueKey?: string | null;
    grantTime?: string; // yyyy-MM-dd HH:mm:ss 或 ISO
}

export interface AdminGrantPackageResponse {
    rootPackageId: string;
    childPackageIds: string[];
    packageName: string;
    cardType: string;
    grantTime: string;
    startDate: string;
    endDate: string;
}

const ADMIN_MEMBER_PACKAGES_BASE = '/api/admin/member-packages';

/** =========================
 * 内部 normalize（防类型漂移）
 * ========================= */

function toStr(v: unknown): string {
    return v == null ? '' : String(v);
}

function toNullableStr(v: unknown): null | string {
    return v == null ? null : String(v);
}

function normalizeListItem(item: any): AdminMemberPackageListDTO {
    return {
        ...item,
        id: toStr(item?.id),
        memberId: toStr(item?.memberId),
        templateId: toNullableStr(item?.templateId),
        orderId: toNullableStr(item?.orderId),
    };
}

function normalizeDetail(detail: any): AdminMemberPackageDetailDTO {
    return {
        ...detail,
        id: toStr(detail?.id),
        templateId: toNullableStr(detail?.templateId),
        memberId: toStr(detail?.memberId),
        orderId: toNullableStr(detail?.orderId),
        sourceCouponId: toNullableStr(detail?.sourceCouponId),
        sourceOrderItemId: toNullableStr(detail?.sourceOrderItemId),
        parentPackageId: toNullableStr(detail?.parentPackageId),
        rootPackageId: toNullableStr(detail?.rootPackageId),
        subPackages: Array.isArray(detail?.subPackages)
            ? detail.subPackages.map(normalizeListItem)
            : detail?.subPackages ?? null,
    };
}

function normalizeGrantResponse(res: any): AdminGrantPackageResponse {
    return {
        ...res,
        rootPackageId: toStr(res?.rootPackageId),
        childPackageIds: Array.isArray(res?.childPackageIds)
            ? res.childPackageIds.map((x: unknown) => String(x))
            : [],
    };
}

/** =========================
 * API
 * ========================= */

export function getAdminMemberPackageListApi(params: AdminMemberPackageQueryDTO) {
    return requestClient
        .get<PageResult<AdminMemberPackageListDTO>>(`${ADMIN_MEMBER_PACKAGES_BASE}/list`, {
            params: {
                ...params,
                memberId: params.memberId ? String(params.memberId) : undefined,
            },
        })
        .then((page: any) => {
            const list = page?.list ?? page?.items ?? page?.records ?? [];
            const normalizedList = Array.isArray(list) ? list.map(normalizeListItem) : [];
            return {
                ...page,
                list: normalizedList,
                items: normalizedList,
                records: normalizedList,
            } as PageResult<AdminMemberPackageListDTO>;
        });
}

export function getAdminMemberPackageDetailApi(id: string) {
    return requestClient
        .get<AdminMemberPackageDetailDTO>(`${ADMIN_MEMBER_PACKAGES_BASE}/${String(id)}`)
        .then((res: any) => normalizeDetail(res));
}

export function getAdminPackagesByMemberIdApi(memberId: string) {
    return requestClient
        .get<AdminMemberPackageListDTO[]>(`${ADMIN_MEMBER_PACKAGES_BASE}/member/${String(memberId)}`)
        .then((list: any[]) => (Array.isArray(list) ? list.map(normalizeListItem) : []));
}

export function freezeAdminMemberPackageApi(id: string, data: FreezePackageRequest) {
    return requestClient.post<boolean>(`${ADMIN_MEMBER_PACKAGES_BASE}/${String(id)}/freeze`, data);
}

export function unfreezeAdminMemberPackageApi(id: string, data?: UnfreezePackageRequest) {
    return requestClient.post<boolean>(`${ADMIN_MEMBER_PACKAGES_BASE}/${String(id)}/unfreeze`, data ?? {});
}

export function deleteAdminMemberPackageApi(id: string, data?: DeletePackageRequest) {
    return requestClient.delete<boolean>(`${ADMIN_MEMBER_PACKAGES_BASE}/${String(id)}`, {
        data: data ?? {},
    });
}

export function extendAdminMemberPackageValidityApi(id: string, extendDays: number) {
    return requestClient.post<boolean>(`${ADMIN_MEMBER_PACKAGES_BASE}/${String(id)}/extend`, null, {
        params: {extendDays},
    });
}

/**
 * 管理后台发放权益卡
 * POST /api/admin/member-packages/grant
 */
export function grantAdminMemberPackageApi(data: AdminGrantPackageRequest) {
    return requestClient
        .post<AdminGrantPackageResponse>(`${ADMIN_MEMBER_PACKAGES_BASE}/grant`, {
            ...data,
            memberId: String(data.memberId),
            templateId: String(data.templateId),
        })
        .then((res: any) => normalizeGrantResponse(res));
}
