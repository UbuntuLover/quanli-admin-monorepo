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
                name: 'MemberRights',
                path: '/member/rights',
                component: () => import('#/views/member/rights/index.vue'),
                meta: {
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