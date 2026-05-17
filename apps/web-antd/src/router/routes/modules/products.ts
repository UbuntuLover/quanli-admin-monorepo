import type {RouteRecordRaw} from 'vue-router';
import {$t} from "@vben/locales";

const routes: RouteRecordRaw[] = [
    {
        name: 'Products',
        path: 'products',
        meta: {
            icon: 'material-symbols:production-quantity-limits-sharp',
            order: 100,
            title: $t('products.title'),
        },
        children: [
            {
                name: 'ProductsList',
                path: '/list',
                icon: 'material-symbols:production-quantity-limits-sharp',
                meta: {
                    title: $t('products.list'),
                },
                component: () => import('#/views/products/list/index.vue'),
            },
            {
                path: 'create',
                name: 'ProductCreate',
                component: () => import('#/views/products/create/index.vue'),
                meta: {
                    title: '新建商品',
                },
            },
            {
                path: 'detail/:id',
                name: 'ProductDetail',
                component: () => import('#/views/products/detail/index.vue'),
                meta: {
                    title: '商品详情',
                    hideInMenu: true,
                },
            },
            {
                path: 'edit/:id',
                name: 'ProductEdit',
                component: () => import('#/views/products/edit/index.vue'),
                meta: {
                    title: '编辑商品',
                    hideInMenu: true,
                },
            },
        ]
    }
];

export default routes;