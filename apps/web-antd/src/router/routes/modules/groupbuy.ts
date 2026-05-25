import type {RouteRecordRaw} from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        name: 'GroupBuy',
        path: '/group-buy',
        meta: {
            title: '团购管理',
            icon: 'lucide:wrench',
            order: 999,
        },
        children: [
            {
                name: 'GroupBuyList',
                path: '/group-buy/list',
                component: () => import('#/views/groupbuy/detail/index.vue'),
                meta: {
                    title: '团购详情',
                    icon: 'lucide:image-plus',
                    keepAlive: true,
                },
            },
            {
                name: 'GroupBuyCreate',
                path: '/group-buy/create',
                component: () => import('#/views/groupbuy/create/index.vue'),
                meta: {
                    title: '创建团购活动',
                    icon: 'lucide:image-plus',
                    keepAlive: true,
                },
            },
        ],
    },
];

export default routes;