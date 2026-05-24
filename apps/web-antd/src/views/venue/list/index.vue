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
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    Popconfirm as APopconfirm,
    Table as ATable,
    TableColumn as ATableColumn,
    message,
} from 'ant-design-vue';
import {
    getVenueListForAdminApi,
    deleteVenueApi,
    normalizeMpPage,
    type VenueAdminListDTO,
    type VenueAdminQueryDTO,
} from '#/api/venue/create';

defineOptions({ name: 'VenueList' });

const router = useRouter();
const loading = ref(false);
const list = ref<VenueAdminListDTO[]>([]);
const pagination = ref({ page: 1, pageSize: 20, total: 0 });

const keyword = ref('');
const businessStatusFilter = ref<number | undefined>(undefined);

const statusOptions = [
    { label: '营业中', value: 1 },
    { label: '休业中', value: 2 },
    { label: '装修中', value: 3 },
];

const filteredList = computed(() => list.value);

function statusColor(status: number) {
    switch (status) {
        case 1:
            return 'success';
        case 2:
            return 'warning';
        case 3:
            return 'error';
        default:
            return 'default';
    }
}

function statusText(status: number) {
    switch (status) {
        case 1:
            return '营业中';
        case 2:
            return '休业中';
        case 3:
            return '装修中';
        default:
            return '未知';
    }
}

function formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const date = dayjs(dateStr);
    if (!date.isValid()) return dateStr;
    return date.format('YYYY 年 MM 月 DD 日 HH 时 mm 分 ss 秒');
}

async function fetchList() {
    loading.value = true;
    try {
        const params: VenueAdminQueryDTO = {
            page: pagination.value.page,
            pageSize: pagination.value.pageSize,
        };
        if (keyword.value) params.name = keyword.value.trim();
        if (businessStatusFilter.value) params.businessStatus = businessStatusFilter.value;

        const res = await getVenueListForAdminApi(params);
        const normalized = normalizeMpPage(res);
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

async function handleDelete(id: number) {
    try {
        await deleteVenueApi(id);
        message.success('删除成功');
        fetchList();
    } catch (e) {
        console.error(e);
    }
}

function goCreate() {
    router.push({ name: 'VenueCreate' });
}

function goDetail(id: number) {
    router.push({
        name: 'VenueDetail',
        query: { id },
    });
}

let searchTimer: ReturnType<typeof setTimeout>;
watch([keyword, businessStatusFilter], () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        pagination.value.page = 1;
        fetchList();
    }, 300);
});

onMounted(fetchList);
</script>

<template>
    <div class="p-4 venue-list-page">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">场馆列表</div>
                        <div class="mt-1 text-xs text-gray-400">管理后台场馆管理</div>
                    </div>
                    <a-space>
                        <a-button :loading="loading" @click="fetchList">刷新</a-button>
                        <a-button type="primary" @click="goCreate">创建场馆</a-button>
                    </a-space>
                </div>
            </template>

            <div class="mb-4">
                <a-row :gutter="[12, 12]">
                    <a-col :xs="24" :md="8">
                        <a-input
                            v-model:value="keyword"
                            allow-clear
                            placeholder="搜索场馆名称"
                        />
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-select
                            v-model:value="businessStatusFilter"
                            allow-clear
                            placeholder="按营业状态筛选"
                            style="width: 100%"
                            :options="statusOptions"
                        />
                    </a-col>
                    <a-col :xs="24" :md="10" class="flex items-center justify-end">
                        <span class="text-xs text-gray-500">
                            共 {{ pagination.total }} 条
                        </span>
                    </a-col>
                </a-row>
            </div>

            <a-spin :spinning="loading">
                <a-table
                    v-if="filteredList.length > 0"
                    :dataSource="filteredList"
                    :pagination="false"
                    :scroll="{ x: 1000 }"
                    row-key="id"
                >
                    <a-table-column title="场馆编号" data-index="venueNo" width="120" />
                    <a-table-column title="场馆名称" data-index="name" min-width="150">
                        <template #default="{ record }">
                            <a @click="goDetail(record.id)" class="venue-name-link">
                                {{ record.name }}
                            </a>
                        </template>
                    </a-table-column>
                    <a-table-column title="城市" data-index="city" width="100" />
                    <a-table-column title="联系电话" data-index="phone" width="130" />
                    <a-table-column title="营业状态" data-index="businessStatus" width="100">
                        <template #default="{ record }">
                            <a-tag :color="statusColor(record.businessStatus)">
                                {{ statusText(record.businessStatus) }}
                            </a-tag>
                        </template>
                    </a-table-column>
                    <a-table-column title="面积(㎡)" data-index="areaSqm" width="100">
                        <template #default="{ record }">
                            {{ record.areaSqm ?? '-' }}
                        </template>
                    </a-table-column>
                    <a-table-column title="容纳人数" data-index="capacity" width="100">
                        <template #default="{ record }">
                            {{ record.capacity ?? '-' }}
                        </template>
                    </a-table-column>
                    <a-table-column title="创建时间" data-index="createdAt" width="240">
                        <template #default="{ record }">
                            {{ formatDateTime(record.createdAt) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="操作" width="120" fixed="right">
                        <template #default="{ record }">
                            <a-space>
                                <a @click="goDetail(record.id)">详情</a>
                                <a-popconfirm
                                    title="确认删除该场馆？"
                                    @confirm="handleDelete(record.id)"
                                >
                                    <a class="text-red-500">删除</a>
                                </a-popconfirm>
                            </a-space>
                        </template>
                    </a-table-column>
                </a-table>

                <div v-else class="empty-wrap">
                    <a-empty description="暂无场馆数据" />
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
.venue-name-link {
    color: #1890ff;
    cursor: pointer;
}
.venue-name-link:hover {
    text-decoration: underline;
}
.empty-wrap {
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
