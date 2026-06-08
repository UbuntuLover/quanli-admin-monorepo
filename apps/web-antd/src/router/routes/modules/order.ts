import type {RouteRecordRaw} from 'vue-router';
import {$t} from "@vben/locales";

const routes: RouteRecordRaw[] = [
    {
        name: 'Order',
        path: 'order',
        meta: {
            icon: 'lucide:shopping-cart',
            order: 110,
            title: '订单管理'
        },
        children: [
            {
                name: 'OrderList',
                path: 'list',
                meta: {
                    title: '订单列表',
                    icon: 'lucide:list',
                },
                component: () => import('#/views/order/list/index.vue'),
            },
            {
                path: 'detail/:orderNo',
                name: 'OrderDetail',
                component: () => import('#/views/order/detail/index.vue'),
                meta: {
                    title: '订单详情',
                    hideInMenu: true,
                },
            },
        ]
    }
];

export default routes;