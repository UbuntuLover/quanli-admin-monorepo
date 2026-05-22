import type {RouteRecordRaw} from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        name: 'PackageTemplate',
        path: '/package-create',
        meta: {
            icon: 'lucide:card-sim',
            order: 40,
            title: '权益卡模板管理',
        },
        children: [
            {
                name: 'PackageTemplateInfo',
                path: '/info',
                component: () => import('#/views/package-template/info/index.vue'),
                meta: {
                    icon: 'lucide:book-copy',
                    keepAlive: true,
                    title: '权益卡模板信息',
                },
            },
            {
                name: 'PackageTemplateTemplate',
                path: '/create',
                component: () => import('#/views/package-template/create/index.vue'),
                meta: {
                    icon: 'lucide:badge-plus',
                    keepAlive: true,
                    title: '创建权益卡模板',
                },
            },
            {
                name: 'PackageTemplateEdit',
                path: '/edit',
                component: () => import('#/views/package-template/edit/index.vue'),
                meta: {
                    hideInMenu: true,
                    icon: 'lucide:pencil',
                    keepAlive: true,
                    title: '编辑权益卡模板',
                },
            },
            {
                name: 'PackageTemplateDetail',
                path: '/detail',
                component: () => import('#/views/package-template/detail/index.vue'),
                meta: {
                    hideInMenu: true,
                    icon: 'lucide:info',
                    keepAlive: true,
                    title: '权益卡详情',
                },
            },


        ],
    },
];

export default routes;