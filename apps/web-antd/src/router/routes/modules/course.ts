import type {RouteRecordRaw} from 'vue-router';


const routes: RouteRecordRaw[] = [
    {
        name: 'CourseManagement',
        path: '/course',
        meta: {
            icon: 'lucide:calendar-days',
            order: 20,
            title: '课程管理',
        },
        children: [
            {
                name: 'CourseWeeklySchedule',
                path: '/course/weekly-schedule',
                component: () => import('#/views/course/weekly-schedule/index.vue'),
                meta: {
                    icon: 'lucide:calendar-range',
                    keepAlive: true,
                    title: '未来一周排课表',
                },
            },
        ],
    },
];

export default routes;
