import type {Recordable} from '@vben/types';

import {ref} from 'vue';
import {useRouter} from 'vue-router';

import {LOGIN_PATH} from '@vben/constants';
import {preferences} from '@vben/preferences';
import {resetAllStores, useAccessStore, useUserStore} from '@vben/stores';

import {notification} from 'ant-design-vue';
import {defineStore} from 'pinia';

import {type AuthApi, getUserInfoApi, loginApi, logoutApi} from '#/api';
import {$t} from '#/locales';


interface AdminUserInfo {
    [key: string]: any;
    /**
     * 用户 ID
     *
     * 后端是 Long，前端统一转 string。
     */
    userId: string;

    /**
     * 用户名，同时也是展示名。
     */
    username: string;

    /**
     * 用户类型。
     *
     * 例如：ADMIN
     */
    userType: string;

    /**
     * 手机号。
     */
    phone: null | string;

    /**
     * 教练 ID。
     */
    coachId: null | number;

    /**
     * 会员 ID。
     */
    memberId: null | number;

    /**
     * 场馆 ID 列表。
     */
    venueIds: number[];

    /**
     * 首页路径。
     */
    homePath?: string;

}

/**
 * 把后端 LoginUserInfoVO 转成前端使用的 AdminUserInfo。
 *
 * 你的设计里：
 * - username 就是展示名
 * - 没有 avatar
 * - 没有 realName
 * - 没有 roleCodes
 * - 没有 roles
 */
function transformBackendUserInfo(
    backendUserInfo: AuthApi.LoginUserInfoVO,
): AdminUserInfo {
    const username = backendUserInfo.username || backendUserInfo.phone || '管理员';

    return {
        userId: String(backendUserInfo.userId),
        username,
        userType: backendUserInfo.userType,
        phone: backendUserInfo.phone,
        coachId: backendUserInfo.coachId,
        memberId: backendUserInfo.memberId,
        venueIds: backendUserInfo.venueIds ?? [],
        homePath: preferences.app.defaultHomePath,
    };
}

/**
 * 规范化 token。
 *
 * 后端推荐返回纯 token。
 * 如果后端返回了 Bearer xxx，这里兜底去掉 Bearer。
 */
function normalizeToken(token: string) {
    return token.replace(/^Bearer\s+/i, '');
}



export const useAuthStore = defineStore('auth', () => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const router = useRouter();

    const loginLoading = ref(false);

    /**
     * 异步处理登录操作
     * Asynchronously handle the login process
     * @param params 登录表单数据
     */
    /**
     * 登录
     */
    async function authLogin(
        params: Recordable<any>,
        onSuccess?: () => Promise<void> | void,
    ) {
        let userInfo: AdminUserInfo | null = null;

        try {
            loginLoading.value = true;

            const loginResult = await loginApi(params);

            const token = loginResult?.token;
            const backendUserInfo = loginResult?.userInfo;

            if (!token) {
                throw new Error('登录失败：后端未返回 token');
            }

            if (!backendUserInfo) {
                throw new Error('登录失败：后端未返回 userInfo');
            }

            /**
             * 1. 保存 accessToken
             */
            accessStore.setAccessToken(normalizeToken(token));

            /**
             * 2. 转换并保存用户信息
             */
            userInfo = transformBackendUserInfo(backendUserInfo);
            userStore.setUserInfo(userInfo);

            /**
             * 3. 设置前端权限码
             *
             * 你的后端没有权限码设计。
             * 后台仅管理员登录，所以这里固定给 ADMIN。
             *
             * 这个值只是为了兼容 Vben 的菜单/路由权限系统。
             */
            accessStore.setAccessCodes([]);

            /**
             * 4. 处理登录过期状态
             */
            if (accessStore.loginExpired) {
                accessStore.setLoginExpired(false);
            } else {
                await (onSuccess ? onSuccess() : router.push(
                        userInfo.homePath || preferences.app.defaultHomePath,
                    ));
            }

            /**
             * 5. 登录成功提示
             */
            notification.success({
                description: `${$t('authentication.loginSuccessDesc')}:${
                    userInfo.username
                }`,
                duration: 3,
                message: $t('authentication.loginSuccess'),
            });
        } finally {
            loginLoading.value = false;
        }

        return {
            userInfo,
        };
    }

    async function logout(redirect: boolean = true) {
        try {
            await logoutApi();
        } catch {
            // 不做任何处理
        }
        resetAllStores();
        accessStore.setLoginExpired(false);

        // 回登录页带上当前路由地址
        await router.replace({
            path: LOGIN_PATH,
            query: redirect
                ? {
                    redirect: encodeURIComponent(router.currentRoute.value.fullPath),
                }
                : {},
        });
    }

    async function fetchUserInfo() {
        const userInfo = await getUserInfoApi();
        userStore.setUserInfo(userInfo);
        return userInfo;
    }

    function $reset() {
        loginLoading.value = false;
    }

    return {
        $reset,
        authLogin,
        fetchUserInfo,
        loginLoading,
        logout,
    };
});
