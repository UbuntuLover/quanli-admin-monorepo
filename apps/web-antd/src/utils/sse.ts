import { useAccessStore } from '@vben/stores';

type SseEventHandler = (data: any, rawEvent?: MessageEvent) => void;

let eventSource: EventSource | null = null;

const eventHandlers = new Map<string, Set<SseEventHandler>>();

function getSseUrl(token: string) {
    /**
     * 同域部署或 Vite 配置了 /api 代理时，使用相对地址即可。
     */
    return `/api/sse/connect?token=${encodeURIComponent(token)}`;
}

/**
 * 建立 SSE 连接
 */
export function connectSse() {
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;

    if (!token) {
        console.warn('[SSE] accessToken为空，跳过连接');
        return;
    }

    if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
        console.log('[SSE] 已存在连接，跳过重复连接');
        return;
    }

    const url = getSseUrl(token);

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
        console.log('[SSE] connected');
    };

    eventSource.onerror = (error) => {
        console.warn('[SSE] error', error);

        /**
         * EventSource 会自动重连。
         * 不需要手动 setTimeout 重连。
         */
    };

    registerEvent('connected');
    registerEvent('notification');
    registerEvent('broadcast');
    registerEvent('heartbeat');
}

/**
 * 关闭 SSE 连接
 */
export function closeSse() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
        console.log('[SSE] closed');
    }
}

/**
 * 监听 SSE 事件
 */
export function onSseEvent(eventName: string, handler: SseEventHandler) {
    if (!eventHandlers.has(eventName)) {
        eventHandlers.set(eventName, new Set());
    }

    eventHandlers.get(eventName)!.add(handler);

    return () => {
        offSseEvent(eventName, handler);
    };
}

/**
 * 取消监听
 */
export function offSseEvent(eventName: string, handler: SseEventHandler) {
    eventHandlers.get(eventName)?.delete(handler);
}

/**
 * 判断是否已连接
 */
export function isSseConnected() {
    return eventSource?.readyState === EventSource.OPEN;
}

function registerEvent(eventName: string) {
    if (!eventSource) {
        return;
    }

    eventSource.addEventListener(eventName, (event) => {
        emitLocalEvent(eventName, event as MessageEvent);
    });
}

function emitLocalEvent(eventName: string, event: MessageEvent) {
    try {
        const payload = JSON.parse(event.data);

        /**
         * 后端发送格式：
         * {
         *   event: "notification",
         *   data: {...},
         *   timestamp: 123
         * }
         */
        const data = payload?.data ?? payload;

        eventHandlers.get(eventName)?.forEach((handler) => {
            handler(data, event);
        });

        /**
         * 通配监听，方便调试
         */
        eventHandlers.get('*')?.forEach((handler) => {
            handler(data, event);
        });
    } catch (error) {
        console.error('[SSE] event parse failed:', error, event.data);
    }
}

export default {
    connectSse,
    closeSse,
    onSseEvent,
    offSseEvent,
    isSseConnected,
};
