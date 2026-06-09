import { requestClient } from '#/api/request';

/** =========================
 * 通知中心 API
 * Base: /api/notifications
 * ========================= */


/**
 * 消息类型。
 *
 * 后端注释：
 * system / order / member / activity
 *
 * 这里额外允许 string，方便后续扩展新类型。
 */
export type NotificationType =
    | 'system'
    | 'order'
    | 'member'
    | 'activity'
    | string;

/**
 * 通知 DTO
 *
 * 对应后端：
 * NotificationDTO.kt
 */
export interface NotificationDTO {
    /**
     * 通知ID
     */
    id: number;

    /**
     * 头像URL
     */
    avatar?: string | null;

    /**
     * 创建时间，如：
     * 2024-01-01 10:00:00
     * 或相对时间
     */
    date: string;

    /**
     * 是否已读
     */
    isRead: boolean;

    /**
     * 内容描述
     */
    message: string;

    /**
     * 标题
     */
    title: string;

    /**
     * 跳转链接
     */
    link?: string | null;

    /**
     * 消息类型：
     * system / order / member / activity
     */
    type?: NotificationType | null;

    /**
     * 路由 query 参数
     */
    query?: Record<string, any> | null;

    /**
     * 路由 state 参数
     */
    state?: Record<string, any> | null;
}

/**
 * 通知列表响应
 *
 * 对应后端：
 * NotificationListResp
 */
export interface NotificationListResp {
    list: NotificationDTO[];
    unreadCount: number;
}

/**
 * 创建通知请求
 *
 * 对应后端：
 * NotificationCreateReq
 */
export interface NotificationCreateReq {
    /**
     * 接收通知的用户ID
     */
    userId: number;

    /**
     * 通知标题
     */
    title: string;

    /**
     * 通知内容
     */
    message: string;

    /**
     * 头像URL
     */
    avatar?: string | null;

    /**
     * 跳转链接
     */
    link?: string | null;

    /**
     * 路由 query 参数
     */
    query?: Record<string, any> | null;

    /**
     * 路由 state 参数
     */
    state?: Record<string, any> | null;
}

/**
 * 创建通知响应
 *
 * 后端返回：
 * ApiResponse.success(mapOf("id" to id), "创建成功")
 *
 * 被 requestClient 解包后，前端拿到：
 * { id: number }
 */
export interface NotificationCreateResp {
    id: number;
}

/**
 * 标记全部已读 / 清空通知响应
 *
 * 后端返回：
 * mapOf("count" to count)
 */
export interface NotificationCountResp {
    count: number;
}

const NOTIFICATION_BASE = '/api/notifications';

/** =========================
 * API Functions
 * ========================= */

/**
 * 获取当前登录用户通知列表
 *
 * GET /api/notifications
 *
 * Header:
 * Authorization: Bearer xxx
 *
 * Authorization 已在 request.ts 中统一注入。
 */
export function getNotificationsApi() {
    return requestClient.get<NotificationListResp>(NOTIFICATION_BASE);
}

/**
 * 创建通知
 *
 * POST /api/notifications
 *
 * 注意：
 * 这个接口根据后端设计不需要登录态 userId，
 * 而是通过 req.userId 指定通知接收者。
 */
export function createNotificationApi(data: NotificationCreateReq) {
    return requestClient.post<NotificationCreateResp>(NOTIFICATION_BASE, data);
}

/**
 * 标记单条通知为已读
 *
 * PATCH /api/notifications/{id}/read
 *
 * 后端返回：
 * ApiResponse.success(true, "已标记已读")
 *
 * 被 requestClient 解包后，前端拿到：
 * true
 */
export function markNotificationReadApi(id: number | string) {
    return requestClient.patch<boolean>(
        `${NOTIFICATION_BASE}/${encodeURIComponent(String(id))}/read`,
    );
}

/**
 * 标记当前用户全部通知为已读
 *
 * PATCH /api/notifications/read-all
 *
 * 后端返回：
 * mapOf("count" to count)
 */
export function markAllNotificationsReadApi() {
    return requestClient.patch<NotificationCountResp>(
        `${NOTIFICATION_BASE}/read-all`,
    );
}

/**
 * 删除单条通知
 *
 * DELETE /api/notifications/{id}
 *
 * 后端返回：
 * true
 */
export function deleteNotificationApi(id: number | string) {
    return requestClient.delete<boolean>(
        `${NOTIFICATION_BASE}/${encodeURIComponent(String(id))}`,
    );
}

/**
 * 清空当前用户全部通知
 *
 * DELETE /api/notifications
 *
 * 后端返回：
 * mapOf("count" to count)
 */
export function clearNotificationsApi() {
    return requestClient.delete<NotificationCountResp>(NOTIFICATION_BASE);
}

/** =========================
 * 可选：前端展示辅助方法
 * ========================= */

/**
 * 判断通知是否未读
 */
export function isUnreadNotification(item: NotificationDTO) {
    return !item.isRead;
}

/**
 * 按消息类型返回展示颜色。
 *
 * 如果你页面使用 antd 的 Tag，可以直接：
 * <a-tag :color="getNotificationTypeColor(item.type)">
 */
export function getNotificationTypeColor(type?: NotificationType | null) {
    const colorMap: Record<string, string> = {
        system: 'blue',
        order: 'green',
        member: 'purple',
        activity: 'orange',
    };

    return type ? colorMap[type] || 'default' : 'default';
}

/**
 * 按消息类型返回中文名称。
 */
export function getNotificationTypeText(type?: NotificationType | null) {
    const textMap: Record<string, string> = {
        system: '系统消息',
        order: '订单消息',
        member: '会员消息',
        activity: '活动消息',
    };

    return type ? textMap[type] || type : '普通消息';
}

/** =========================
 * 默认导出
 * ========================= */

export default {
    getNotificationsApi,
    createNotificationApi,
    markNotificationReadApi,
    markAllNotificationsReadApi,
    deleteNotificationApi,
    clearNotificationsApi,

    isUnreadNotification,
    getNotificationTypeColor,
    getNotificationTypeText,
};
