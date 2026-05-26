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
                component: () => import('#/views/groupbuy/list/index.vue'),
                meta: {
                    title: '团购活动列表',
                    icon: 'lucide:list',
                    keepAlive: true,
                },
            },
            {
                name: 'GroupBuyCreate',
                path: '/group-buy/create',
                component: () => import('#/views/groupbuy/create/index.vue'),
                meta: {
                    title: '创建团购活动',
                    icon: 'lucide:plus',
                    keepAlive: true,
                },
            },
            {
                name: 'GroupBuyDetail',
                path: '/group-buy/detail',
                component: () => import('#/views/groupbuy/detail/index.vue'),
                meta: {
                    title: '团购活动详情',
                    icon: 'lucide:eye',
                    hideInMenu: true,
                },
            },
        ],
    },
];

export default routes;
