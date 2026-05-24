<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Empty as AEmpty,
    Input as AInput,
    Pagination as APagination,
    RangePicker as ARangePicker,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    Table as ATable,
    TableColumn as ATableColumn,
    Avatar as AAvatar,
    message,
} from 'ant-design-vue';
import {
    getAdminMemberListApi,
    normalizePageResult,
    type AdminMemberListDTO,
    type AdminMemberQueryDTO,
} from '#/api/member/member';

defineOptions({ name: 'MemberList' });

const router = useRouter();
const loading = ref(false);
const list = ref<AdminMemberListDTO[]>([]);
const pagination = ref({ page: 1, pageSize: 20, total: 0 });

const keyword = ref('');
const phoneFilter = ref('');
const statusFilter = ref<number | undefined>(undefined);
const registerTimeRange = ref<[string, string] | null>(null);

const statusOptions = [
    { label: '正常', value: 1 },
    { label: '冻结', value: 2 },
    { label: '注销', value: 3 },
];

const genderOptions = [
    { label: '未知', value: 0 },
    { label: '男', value: 1 },
    { label: '女', value: 2 },
];

const filteredList = computed(() => list.value);

function statusColor(status: number) {
    switch (status) {
        case 1:
            return 'success';
        case 2:
            return 'warning';
        case 3:
            return 'default';
        default:
            return 'default';
    }
}

function statusText(status: number) {
    switch (status) {
        case 1:
            return '正常';
        case 2:
            return '冻结';
        case 3:
            return '注销';
        default:
            return '未知';
    }
}

function genderText(gender: number | null | undefined) {
    if (gender === null || gender === undefined) return '-';
    switch (gender) {
        case 0:
            return '未知';
        case 1:
            return '男';
        case 2:
            return '女';
        default:
            return '-';
    }
}

function formatDateTime(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    const date = dayjs(dateStr);
    if (!date.isValid()) return dateStr;
    return date.format('YYYY 年 MM 月 DD 日 HH 时 mm 分 ss 秒');
}

function formatMoney(amount: number): string {
    return `¥${(amount / 100).toFixed(2)}`;
}

async function fetchList() {
    loading.value = true;
    try {
        const params: AdminMemberQueryDTO = {
            page: pagination.value.page,
            pageSize: pagination.value.pageSize,
        };
        if (keyword.value) params.name = keyword.value.trim();
        if (phoneFilter.value) params.phone = phoneFilter.value.trim();
        if (statusFilter.value) params.status = statusFilter.value;
        if (registerTimeRange.value && registerTimeRange.value[0] && registerTimeRange.value[1]) {
            params.registerTimeStart = registerTimeRange.value[0];
            params.registerTimeEnd = registerTimeRange.value[1];
        }

        const res = await getAdminMemberListApi(params);
        const normalized = normalizePageResult(res);
        list.value = normalized.list;
        pagination.value.total = normalized.total;
    } finally {
        loading.value = false;
    }
}

function handlePageChange(page: number, pageSize: number) {
    pagination.value.page = page;
    pagination.value.pageSize = pageSize;
    fetchList();
}

function goDetail(id: number) {
    router.push({
        name: 'MemberDetail',
        query: { id },
    });
}

let searchTimer: ReturnType<typeof setTimeout>;
watch([keyword, phoneFilter, statusFilter, registerTimeRange], () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        pagination.value.page = 1;
        fetchList();
    }, 300);
});

onMounted(fetchList);
</script>

<template>
    <div class="p-4 member-list-page">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">会员列表</div>
                        <div class="mt-1 text-xs text-gray-400">管理后台会员管理</div>
                    </div>
                    <a-space>
                        <a-button :loading="loading" @click="fetchList">刷新</a-button>
                    </a-space>
                </div>
            </template>

            <div class="mb-4">
                <a-row :gutter="[12, 12]">
                    <a-col :xs="24" :md="6">
                        <a-input
                            v-model:value="keyword"
                            allow-clear
                            placeholder="搜索会员姓名"
                        />
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-input
                            v-model:value="phoneFilter"
                            allow-clear
                            placeholder="搜索手机号"
                        />
                    </a-col>
                    <a-col :xs="24" :md="4">
                        <a-select
                            v-model:value="statusFilter"
                            allow-clear
                            placeholder="按状态筛选"
                            style="width: 100%"
                            :options="statusOptions"
                        />
                    </a-col>
                    <a-col :xs="24" :md="8">
                        <a-range-picker
                            v-model:value="registerTimeRange"
                            style="width: 100%"
                            placeholder="注册时间范围"
                        />
                    </a-col>
                </a-row>
            </div>

            <a-spin :spinning="loading">
                <a-table
                    v-if="filteredList.length > 0"
                    :dataSource="filteredList"
                    :pagination="false"
                    :scroll="{ x: 1400 }"
                    row-key="id"
                >
                    <a-table-column title="会员编号" data-index="memberNo" width="140">
                        <template #default="{ record }">
                            <a @click="goDetail(record.id)" class="member-link">
                                {{ record.memberNo }}
                            </a>
                        </template>
                    </a-table-column>
                    <a-table-column title="头像" width="70">
                        <template #default="{ record }">
                            <a-avatar :src="record.avatar" :size="40">
                                {{ (record.name || record.nickname || '用户')[0] }}
                            </a-avatar>
                        </template>
                    </a-table-column>
                    <a-table-column title="姓名" data-index="name" width="100">
                        <template #default="{ record }">
                            <a @click="goDetail(record.id)" class="member-link">
                                {{ record.name || '-' }}
                            </a>
                        </template>
                    </a-table-column>
                    <a-table-column title="昵称" data-index="nickname" width="100">
                        <template #default="{ record }">
                            <a @click="goDetail(record.id)" class="member-link">
                                {{ record.nickname || '-' }}
                            </a>
                        </template>
                    </a-table-column>
                    <a-table-column title="手机号" data-index="phone" width="130" />
                    <a-table-column title="性别" data-index="gender" width="70">
                        <template #default="{ record }">
                            {{ genderText(record.gender) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="状态" data-index="status" width="80">
                        <template #default="{ record }">
                            <a-tag :color="statusColor(record.status)">
                                {{ statusText(record.status) }}
                            </a-tag>
                        </template>
                    </a-table-column>
                    <a-table-column title="总消费" data-index="totalConsumption" width="100">
                        <template #default="{ record }">
                            {{ formatMoney(record.totalConsumption) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="课程数" data-index="totalCourseCount" width="80">
                        <template #default="{ record }">
                            {{ record.totalCourseCount ?? 0 }}
                        </template>
                    </a-table-column>
                    <a-table-column title="访问次数" data-index="totalVenueVisitCount" width="90">
                        <template #default="{ record }">
                            {{ record.totalVenueVisitCount ?? 0 }}
                        </template>
                    </a-table-column>
                    <a-table-column title="注册时间" data-index="registerTime" width="240">
                        <template #default="{ record }">
                            {{ formatDateTime(record.registerTime) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="最后访问" data-index="lastVisitTime" width="240">
                        <template #default="{ record }">
                            {{ formatDateTime(record.lastVisitTime) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="操作" width="80" fixed="right">
                        <template #default="{ record }">
                            <a @click="goDetail(record.id)">详情</a>
                        </template>
                    </a-table-column>
                </a-table>

                <div v-else class="empty-wrap">
                    <a-empty description="暂无会员数据" />
                </div>

                <div v-if="pagination.total > 0" class="mt-4 flex justify-end">
                    <a-pagination
                        v-model:current="pagination.page"
                        v-model:page-size="pagination.pageSize"
                        :total="pagination.total"
                        :show-size-changer="true"
                        :show-quick-jumper="true"
                        :show-total="(total: number) => `共 ${total} 条`"
                        @change="handlePageChange"
                    />
                </div>
            </a-spin>
        </a-card>
    </div>
</template>

<style scoped>
.member-link {
    color: #1890ff;
    cursor: pointer;
}
.member-link:hover {
    text-decoration: underline;
}
.empty-wrap {
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
