import {requestClient} from '#/api/request';

/** ===================== 通用响应类型 ===================== */

/** ===================== 提货相关 ===================== */
export interface PickupPreviewRequest {
    pickupCode: string;
    venueId: number;
}

export interface PickupPreviewResponse {
    valid: boolean;
    orderNo?: string;
    orderItemId?: number;
    productName?: string;
    quantity?: number;
    pickupStatus?: number;
    pickupExpireAt?: string;
    message?: string;
}

export interface PickupVerifyRequest {
    pickupCode: string;
    venueId: number;
}

export interface PickupVerifyResponse {
    success: boolean;
    orderNo?: string;
    orderItemId?: number;
    verifiedAt?: string;
    venueId?: number;
    operatorId?: number;
    message?: string;
}

/** ===================== 订单列表 ===================== */
export interface AdminOrderListRequest {
    pageNum?: number; // 默认1
    pageSize?: number; // 默认10
    orderNo?: string;
    memberId?: number;
    phone?: string;
    status?: string;
    payStatus?: string;
    orderType?: string;
    startTime?: string;
    endTime?: string;
}

/**
 * 这里按后台常见分页结构给出通用定义；
 * 如果你后端实际是 records/total 或 list/total，请在页面侧按实际字段取值。
 */
export interface AdminOrderListItem {
    id: number;
    orderNo: string;
    memberId: number;
    phone?: string;
    memberName?: string;
    orderType: string;
    orderTypeDesc?: string;
    title?: string;
    status: string;
    statusDesc?: string;
    payStatus: string;
    payStatusDesc?: string;
    totalAmount?: number;
    paidAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
    isGroupBuy?: number;
    refundStatus?: number;
    refundStatusDesc?: string;
    createdAt?: string;
    updatedAt?: string;
    expireTime?: string;
}

export interface AdminOrderListResponse {
    total: number;
    orders: AdminOrderListItem[];
    pageNum: number;
    pageSize: number;
    pages: number;
}

/** ===================== 订单详情 ===================== */
export interface AdminOrderDetailVO {
    id: number;
    orderNo: string;
    memberId: number;
    phone: string;
    memberName?: string;
    orderType: string;
    orderTypeDesc: string;
    title?: string;
    status: string;
    statusDesc: string;
    payStatus: string;
    payStatusDesc: string;
    totalAmount: number;
    paidAmount: number;
    discountAmount: number;
    couponDiscountAmount: number;
    usedCouponCount: number;
    finalAmount: number;
    paymentMethod?: string;
    paymentTime?: string;
    isOfflinePayment: number;
    offlineVerifyOperatorId?: number;
    offlineVerifyTime?: string;
    isGroupBuy: number;
    groupBuyId?: number;
    fulfillmentType?: string;
    activationStatus?: string;
    refundStatus: number;
    refundStatusDesc: string;
    refundedAmount: number;
    remark?: string;
    expireTime?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface AdminOrderItemVO {
    id: number;
    orderNo: string;
    productId: number;
    productName: string;
    skuId: number;
    skuName: string;
    skuImage?: string;
    attributes?: Record<string, string>;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    productType?: string;
    deliveryMode?: string;
    activationStatus?: string;
    rightsGrantStatus?: string;
    createdAt: string;
}

export interface GroupBuyOrderInfo {
    activityId: number;
    activityName: string;
    status: string;
    minMembers: number;
    currentMembers: number;
    isFree: boolean;
    endTime: string;
}

export interface AdminOrderDetailResponse {
    order: AdminOrderDetailVO;
    items: AdminOrderItemVO[];
    groupBuyInfo?: GroupBuyOrderInfo;
}

/** ===================== API ===================== */
const ADMIN_ORDER_BASE = '/api/admin/orders';

/**
 * 分页查询订单列表
 * POST /api/admin/orders/page
 */
export async function getAdminOrderPage(params: AdminOrderListRequest) {
    return requestClient.post<AdminOrderListResponse>(
        `${ADMIN_ORDER_BASE}/page`,
        params,
    );
}

/**
 * 查询订单详情
 * GET /api/admin/orders/{orderNo}
 */
export async function getAdminOrderDetail(orderNo: string) {
    return requestClient.get<AdminOrderDetailResponse>(
        `${ADMIN_ORDER_BASE}/${encodeURIComponent(orderNo)}`,
    );
}

/**
 * 管理员取消订单（仅未支付）
 * POST /api/admin/orders/{orderNo}/cancel?reason=xxx
 */
export async function cancelAdminOrder(orderNo: string, reason = '管理员取消') {
    return requestClient.post<string>(
        `${ADMIN_ORDER_BASE}/${encodeURIComponent(orderNo)}/cancel`,
        undefined,
        {
            params: {reason},
        },
    );
}

/**
 * 管理员关闭订单
 * POST /api/admin/orders/{orderNo}/close?reason=xxx
 */
export async function closeAdminOrder(orderNo: string, reason = '管理员关闭') {
    return requestClient.post<string>(
        `${ADMIN_ORDER_BASE}/${encodeURIComponent(orderNo)}/close`,
        undefined,
        {
            params: {reason},
        },
    );
}

/**
 * 管理员完成订单
 * POST /api/admin/orders/{orderNo}/finish
 */
export async function finishAdminOrder(orderNo: string) {
    return requestClient.post<string>(
        `${ADMIN_ORDER_BASE}/${encodeURIComponent(orderNo)}/finish`,
    );
}

/**
 * 提货预览
 * POST /api/admin/orders/pickups/preview
 */
export async function previewPickup(data: PickupPreviewRequest) {
    return requestClient.post<PickupPreviewResponse>(
        `${ADMIN_ORDER_BASE}/pickups/preview`,
        data,
    );
}

/**
 * 核销提货
 * POST /api/admin/orders/pickups/verify
 */
export async function verifyPickup(data: PickupVerifyRequest) {
    return requestClient.post<PickupVerifyResponse>(
        `${ADMIN_ORDER_BASE}/pickups/verify`,
        data,
    );
}

/** 可选统一导出 */
export default {
    getAdminOrderPage,
    getAdminOrderDetail,
    cancelAdminOrder,
    closeAdminOrder,
    finishAdminOrder,
    previewPickup,
    verifyPickup,
};
