import type {RouteRecordRaw} from 'vue-router';

import {$t} from '#/locales';

const routes: RouteRecordRaw[] = [
    {
        meta: {
            icon: 'lucide:roller-coaster',
            order: -1,
            title: $t('page.dashboard.title'),
        },
        name: 'Dashboard',
        path: '/dashboard',
        children: [
            {
                name: 'CoachCreate',
                path: '/coach/create',
                component: () => import('#/views/coach/create/index.vue'),
                meta: {
                    icon: 'lucide:user-plus',
                    keepAlive: true,
                    title: '教练创建',
                },
            },

            {
                name: 'CoachRegisterApproval',
                path: '/coach/register-approval',
                component: () => import('#/views/coach/register-approval/index.vue'),
                meta: {
                    icon: 'lucide:user-plus',
                    keepAlive: true,
                    title: '教练注册审批',
                },
            },
            {
                name: 'CoachResignationApproval',
                path: '/coach/resignation-approval',
                component: () => import('#/views/coach/resignation-approval/index.vue'),
                meta: {
                    icon: 'lucide:user-minus',
                    keepAlive: true,
                    title: '教练离职审批',
                },
            },
            {
                name: 'CoachInfoChange',
                path: '/coach/info-change',
                component: () => import('#/views/coach/info-change/index.vue'),
                meta: {
                    hideInMenu: true,
                    keepAlive: true,
                    title: '教练信息编辑',
                },
            },
            {
                path: '/coach/profile/list',
                name: 'CoachProfileList',
                component: () => import('#/views/coach/profile/profile.vue'),
                meta: {
                    title: '教练信息',
                    icon: 'lucide:bike',
                },
            },
            {
                path: '/coach/profile/edit/:id',
                name: 'CoachProfileEdit',
                component: () => import('#/views/coach/profile/edit.vue'),
                meta: {title: '编辑教练信息', hideInMenu: true},
            },
            {
                path: '/coach/preference',
                name: 'CoachPreference',
                component: () => import('#/views/coach/preference/index.vue'),
                meta: {title: '设置教练偏好', hideInMenu: true},
            }
        ]
    }];

export default routes;
