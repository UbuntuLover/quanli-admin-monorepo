import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        name: 'MetricsManagement',
        path: '/metrics-management',
        meta: {
            icon: 'lucide:scan-eye',
            order: 40,
            title: '指标管理',
        },
        children: [
            {
                path: 'definitions',
                name: 'MetricDefinition',
                component: () => import('#/views/metric/definition/index.vue'),
                meta: {
                    icon: 'lucide:list-checks',
                    title: '指标定义',
                },
            },
            {
                path: 'record',
                name: 'MetricRecord',
                component: () => import('#/views/metric/record/index.vue'),
                meta: {
                    icon: 'lucide:activity',
                    title: '用户指标记录',
                },
            },
            {
                path: 'record/create',
                name: 'MetricRecordCreate',
                component: () => import('#/views/metric/record/create.vue'),
                meta: {
                    hideInMenu: true,
                    title: '录入用户指标',
                },
            },
            {
                path: 'radar',
                name: 'MetricRadar',
                component: () => import('#/views/metric/radar/index.vue'),
                meta: {
                    icon: 'lucide:radar',
                    title: '雷达图管理',
                },
            },
        ],
    },
];

export default routes;
