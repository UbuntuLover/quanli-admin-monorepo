<script lang="ts" setup>
import type {NotificationItem} from '@vben/layouts';

import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useRouter} from 'vue-router';

import {connectSse, closeSse, onSseEvent} from '#/utils/sse';

import {AuthenticationLoginExpiredModal} from '@vben/common-ui';
import {useWatermark} from '@vben/hooks';
import {
    BasicLayout,
    LockScreen,
    Notification,
    UserDropdown,
} from '@vben/layouts';
import {preferences, usePreferences} from '@vben/preferences';
import {useAccessStore, useUserStore} from '@vben/stores';

import {$t} from '#/locales';
import {useAuthStore} from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';
import {
    clearNotificationsApi,
    deleteNotificationApi,
    getNotificationsApi,
    markAllNotificationsReadApi,
    markNotificationReadApi
} from "#/api/message/message";
import {
    message
} from 'ant-design-vue';

const notifications = ref<NotificationItem[]>([]);
const notificationLoading = ref<boolean>(false);

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const {destroyWatermark, updateWatermark} = useWatermark();
const {isDark} = usePreferences();
const showDot = computed(() =>
    notifications.value.some((item) => !item.isRead),
);

const menus = computed(() => [
    {
        handler: () => {
            router.push({name: 'Profile'});
        },
        icon: 'lucide:user',
        text: $t('page.auth.profile'),
    },
]);

const avatar = computed(() => {
    return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
    offSseNotification?.();
    offSseNotification = null;

    closeSse();

    notifications.value = [];
    await authStore.logout(false);
}

function normalizeNotificationList(list: any[]): NotificationItem[] {
    return (list || []).map((item) => ({
        id: item.id,
        avatar: item.avatar || undefined,
        date: item.date || '',
        isRead: Boolean(item.isRead),
        message: item.message || '',
        title: item.title || '',
        link: item.link || undefined,
        query: item.query || undefined,
        state: item.state || undefined,
    }));
}

async function loadNotifications() {
    notificationLoading.value = true;

    try {
        const res = await getNotificationsApi();

        notifications.value = normalizeNotificationList(res?.list || []);
    } catch (error) {
        console.error('[Notification] load failed:', error);
    } finally {
        notificationLoading.value = false;
    }
}

async function handleNoticeClear() {
    try {
        await clearNotificationsApi();
        notifications.value = [];
    } catch (error) {
        console.error('[Notification] clear failed:', error);
    }
}

async function markRead(id: number | string) {
    try {
        await markNotificationReadApi(id);

        const item = notifications.value.find((item) => item.id === id);
        if (item) {
            item.isRead = true;
        }
    } catch (error) {
        console.error('[Notification] mark read failed:', error);
    }
}

async function remove(id: number | string) {
    try {
        await deleteNotificationApi(id);
        notifications.value = notifications.value.filter((item) => item.id !== id);
    } catch (error) {
        console.error('[Notification] delete failed:', error);
    }
}

async function handleMakeAll() {
    try {
        await markAllNotificationsReadApi();
        notifications.value.forEach((item) => {
            item.isRead = true;
        });
    } catch (error) {
        console.error('[Notification] mark all read failed:', error);
    }
}

const viewAll = () => {
};

const handleClick = async (item: NotificationItem) => {
    if (item.id && !item.isRead) {
        await markRead(item.id);
    }

    if (item.link) {
        navigateTo(item.link, item.query, item.state);
    }
};

function navigateTo(
    link: string,
    query?: Record<string, any>,
    state?: Record<string, any>,
) {
    if (link.startsWith('http://') || link.startsWith('https://')) {
        // 外部链接，在新标签页打开
        window.open(link, '_blank');
    } else {
        // 内部路由链接，支持 query 参数和 state
        router.push({
            path: link,
            query: query || {},
            state,
        });
    }
}

let offSseNotification: null | (() => void) = null;

onMounted(async () => {
    if (accessStore.accessToken) {
        await loadNotifications();

        connectSse();

        offSseNotification = onSseEvent('notification', async (data) => {
            message.info(data.message || data.title || '你有一条新通知');

            await loadNotifications();
        });
    }
});

onBeforeUnmount(() => {
    offSseNotification?.();
    offSseNotification = null;
});
watch(
    () => ({
        enable: preferences.app.watermark,
        content: preferences.app.watermarkContent,
        isDark: isDark.value,
    }),
    async ({enable, content, isDark: isDarkValue}) => {
        if (enable) {
            const watermarkColor = isDarkValue
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.12)';

            await updateWatermark({
                advancedStyle: {
                    colorStops: [
                        {
                            color: watermarkColor,
                            offset: 0,
                        },
                        {
                            color: watermarkColor,
                            offset: 1,
                        },
                    ],
                    type: 'linear',
                },
                content:
                    content ||
                    `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
            });
        } else {
            destroyWatermark();
        }
    },
    {
        immediate: true,
    },
);
</script>

<template>
    <BasicLayout @clear-preferences-and-logout="handleLogout">
        <template #user-dropdown>
            <UserDropdown
                :avatar
                :menus
                :text="userStore.userInfo?.realName"
                description="拳力世家管理"
                tag-text="Pro"
                @logout="handleLogout"
            />
        </template>
        <template #notification>
            <Notification
                :dot="showDot"
                :notifications="notifications"
                @clear="handleNoticeClear"
                @read="(item) => item.id && markRead(item.id)"
                @remove="(item) => item.id && remove(item.id)"
                @make-all="handleMakeAll"
                @on-click="handleClick"
                @view-all="viewAll"
            />
        </template>
        <template #extra>
            <AuthenticationLoginExpiredModal
                v-model:open="accessStore.loginExpired"
                :avatar
            >
                <LoginForm/>
            </AuthenticationLoginExpiredModal>
        </template>
        <template #lock-screen>
            <LockScreen :avatar @to-login="handleLogout"/>
        </template>
    </BasicLayout>
</template>
