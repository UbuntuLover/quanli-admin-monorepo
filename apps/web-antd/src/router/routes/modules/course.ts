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
            {
                name: 'CourseScheduleHistory',
                path: '/course/schedule-history',
                component: () => import('#/views/course/schedule-history/index.vue'),
                meta: {
                    icon: 'lucide:history',
                    keepAlive: true,
                    title: '历史排班记录',
                },
            },
            {
                name: 'CourseBookingList',
                path: '/course/booking-list',
                component: () => import('#/views/course/booking-list/index.vue'),
                meta: {
                    icon: 'lucide:calendar-range',
                    keepAlive: true,
                    title: '课程预约列表',
                }
            },
            {
                name: 'CourseBookingDetail',
                path: '/course/booking-detail/:id',
                component: () => import('#/views/course/booking-detail/index.vue'),
                meta: {
                    hideInMenu: true,
                    icon: 'lucide:notebook-tabs',
                    title: '课程预约详情',
                }
            }
        ],
    },
];

export default routes;
