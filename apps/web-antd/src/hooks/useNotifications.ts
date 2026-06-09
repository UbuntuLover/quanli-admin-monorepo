import { message } from 'ant-design-vue';

import { onSseEvent } from '#/utils/sse';

let initialized = false;
let offNotification: null | (() => void) = null;

export function setupSseNotification() {
    if (initialized) {
        return;
    }

    initialized = true;

    offNotification = onSseEvent('notification', (data) => {
        message.info(data.message || data.title || '你有一条新通知');

        /**
         * 这里可以触发全局 store 更新未读数
         * 例如：
         * useNotificationStore().refresh()
         */
    });
}

export function cleanupSseNotification() {
    offNotification?.();
    offNotification = null;
    initialized = false;
}