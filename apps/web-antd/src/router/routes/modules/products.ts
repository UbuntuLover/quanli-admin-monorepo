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
                component: () => import('#/views/products/index.vue'),
            }
        ]
    }
];

export default routes;