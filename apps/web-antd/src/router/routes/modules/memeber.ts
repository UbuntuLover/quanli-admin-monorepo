import type {RouteRecordRaw} from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        name: 'MemberManagement',
        path: '/member',
        meta: {
            icon: 'lucide:id-card',
            order: 40,
            title: '会员信息管理',
        },
        children: [
            {
                name: 'MemberList',
                path: '/member/list',
                component: () => import('#/views/member/list/index.vue'),
                meta: {
                    icon: 'lucide:flame',
                    keepAlive: true,
                    title: '会员列表',
                },
            },
            {
                name: 'MemberDetail',
                path: '/member/detail',
                component: () => import('#/views/member/detail/index.vue'),
                meta: {
                    hideInMenu: true,
                    icon: 'lucide:book-user',
                    keepAlive: true,
                    title: '会员详情',
                },
            },
            {
                name: 'MemberRights',
                path: '/member/rights',
                component: () => import('#/views/member/rights/index.vue'),
                meta: {
                    hideInMenu: true,
                    icon: 'lucide:badge-check',
                    keepAlive: true,
                    title: '会员权益信息',
                },
            },
            {
                name: 'MemberFitnessData',
                path: '/member/fitness-data',
                component: () => import('#/views/member/fitness-data/index.vue'),
                meta: {
                    icon: 'lucide:activity',
                    keepAlive: true,
                    title: '健身数据管理',
                },
            },
        ],
    },
];

export default routes;