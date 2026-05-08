import { acceptHMRUpdate, defineStore } from 'pinia';

interface BasicUserInfo {
  [key: string]: any;

  /**
   * 教练 ID。
   */
  coachId?: null | number;

  /**
   * 首页路径。
   */
  homePath?: string;

  /**
   * 会员 ID。
   */
  memberId?: null | number;

  /**
   * 手机号。
   */
  phone?: null | string;

  /**
   * 用户 ID
   */
  userId: string;

  /**
   * 用户名，同时作为展示名。
   */
  username: string;

  /**
   * 用户类型。
   */
  userType?: string;

  /**
   * 场馆 ID 列表。
   */
  venueIds?: number[];
}

interface UserState {
  /**
   * 用户信息
   */
  userInfo: BasicUserInfo | null;

  /**
   * 保留这个字段是为了兼容 Vben 内部可能读取 userRoles 的场景。
   *
   * 你的业务不使用角色设计，所以这里默认只作为兼容字段。
   */
  userRoles: string[];
}

/**
 * 用户信息相关
 */
export const useUserStore = defineStore('core-user', {
  actions: {
    setUserInfo(userInfo: BasicUserInfo | null) {
      this.userInfo = userInfo;

      /**
       * 业务上不使用角色系统。
       * 这里不再从 userInfo 里读取 roles。
       */
      this.setUserRoles(userInfo ? ['ADMIN'] : []);
    },

    setUserRoles(roles: string[]) {
      this.userRoles = roles;
    },
  },

  state: (): UserState => ({
    userInfo: null,
    userRoles: [],
  }),
});

const hot = import.meta.hot;

if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}
