import type {RouteRecordRaw} from 'vue-router';


const routes: RouteRecordRaw[] = [
    {
        name: 'DisclaimerManagement',
        path: '/disclaimer',
        meta: {
            icon: 'lucide:file-text',
            order: 30,
            title: '免责声明管理',
        },
        children: [
            {
                name: 'DisclaimerList',
                path: '/disclaimer/list',
                component: () => import('#/views/disclaimer/list/index.vue'),
                meta: {
                    icon: 'lucide:list',
                    keepAlive: true,
                    title: '免责声明列表',
                },
            },
            {
                name: 'DisclaimerCreate',
                path: '/disclaimer/create',
                component: () => import('#/views/disclaimer/create/index.vue'),
                meta: {
                    icon: 'lucide:plus',
                    title: '创建免责声明',
                },
            },
            {
                name: 'DisclaimerEdit',
                path: '/disclaimer/edit',
                component: () => import('#/views/disclaimer/edit/index.vue'),
                meta: {
                    icon: 'lucide:edit',
                    title: '编辑免责声明',
                },
            },
        ],
    },
];

export default routes;
