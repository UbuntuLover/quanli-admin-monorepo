import type {RouteRecordRaw} from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        meta: {
            icon: 'lucide:layout-dashboard',
            order: -2,
            title: '场馆管理',
        },
        name: 'Venue',
        path: '/venue',
        children: [
            {
                name: 'VenueCreate',
                path: '/venue/create',
                component: () => import('#/views/venue/create/index.vue'),
                meta: {
                    icon: 'lucide:building-2',
                    keepAlive: true,
                    title: '场馆创建',
                },
            },
            {
                name: 'VenueList',
                path: '/venue/list',
                component: () => import('#/views/venue/list/index.vue'),
                meta: {
                    icon: 'lucide:hotel',
                    keepAlive: true,
                    title: '场馆列表',
                },
            },
            {
                name: 'VenueDetail',
                path: '/venue/detail',
                component: () => import('#/views/venue/detail/index.vue'),
                meta: {
                    hideInMenu: true,
                    keepAlive: true,
                    title: '场馆详情',
                },
            }


        ]
    }];

export default routes;