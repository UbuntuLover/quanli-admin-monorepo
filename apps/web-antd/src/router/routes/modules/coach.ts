import type {RouteRecordRaw} from 'vue-router';

import {$t} from '#/locales';

const routes: RouteRecordRaw[] = [
    {
        meta: {
            icon: 'lucide:layout-dashboard',
            order: -1,
            title: $t('page.dashboard.title'),
        },
        name: 'Dashboard',
        path: '/dashboard',
        children: [

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
                    icon: 'lucide:file-pen-line',
                    keepAlive: true,
                    title: '教练信息变更',
                },
            }
        ]
    }];

export default routes;
