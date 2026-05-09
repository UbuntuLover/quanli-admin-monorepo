import {baseRequestClient, requestClient} from '#/api/request';

export namespace AuthApi {
    /** 登录接口参数 */
    export interface LoginParams {
        password?: string;
        username?: string;
    }

    /** 登录接口返回值 */
    export interface LoginUserInfoVO {
        userId: number;
        userType: string;
        username: string;
        phone: null | string;
        roleCodes: string[];
        coachId: null | number;
        memberId: null | number;
        venueIds: number[];
    }

    export interface LoginResult {
        token: string;
        tokenType: string;
        userInfo: LoginUserInfoVO;
    }


    export interface RefreshTokenResult {
        data: string;
        status: number;
    }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
    return requestClient.post<AuthApi.LoginResult>('/api/auth/admin/login', data);
}

/**
 * 获取当前登录用户信息
 */
export async function getUserInfoApi() {
    return requestClient.get<AuthApi.LoginUserInfoVO>('/api/auth/me');
}



/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
    return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
        withCredentials: true,
    });
}

/**
 * 退出登录
 */
export async function logoutApi() {
    return baseRequestClient.post('api/auth/admin/logout');
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
    return [];
}
