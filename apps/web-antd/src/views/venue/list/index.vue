<template>
    <div class="p-4 venue-list-page">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">场馆列表</div>
                        <div class="mt-1 text-xs text-gray-400">展示 /api/venue/all 返回的全部场馆</div>
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
                            placeholder="搜索场馆名称 / 地址 / 电话"
                        />
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-select
                            v-model:value="statusFilter"
                            allow-clear
                            placeholder="按营业状态筛选"
                            style="width: 100%"
                            :options="statusOptions"
                        />
                    </a-col>
                    <a-col :xs="24" :md="10" class="flex items-center justify-end">
            <span class="text-xs text-gray-500">
              共 {{ filteredList.length }} 条
            </span>
                    </a-col>
                </a-row>
            </div>

            <a-spin :spinning="loading">
                <a-row v-if="filteredList.length > 0" :gutter="[16, 16]">
                    <a-col
                        v-for="item in filteredList"
                        :key="item.id"
                        :xs="24"
                        :sm="12"
                        :md="8"
                        :lg="6"
                    >
                        <a-card hoverable class="venue-card cursor-pointer" @click="goDetail(item.id)">
                            <template #cover>
                                <img
                                    class="venue-cover"
                                    :src="item.logo || item.backgroundImage || defaultCover"
                                    alt="venue"
                                />
                            </template>

                            <template #title>
                                <a @click="goDetail(item.id)" class="venue-name-link">
                                    {{ item.name }}
                                </a>
                            </template>
                            <template #description>
                                <div class="meta-wrap">
                                    <div class="mb-2">
                                        <a-tag :color="statusColor(item.status)">
                                            {{ item.status || '未知' }}
                                        </a-tag>
                                    </div>

                                    <div class="line">
                                        <span class="label">地址：</span>
                                        <span class="value">{{ item.address || '-' }}</span>
                                    </div>
                                    <div class="line">
                                        <span class="label">电话：</span>
                                        <span class="value">{{ item.phone || '-' }}</span>
                                    </div>
                                    <div class="line">
                                        <span class="label">营业：</span>
                                        <span class="value">
                        {{ formatBusinessHours(item.businessHours) }}
                      </span>
                                    </div>
                                    <div class="line">
                                        <span class="label">教练：</span>
                                        <span class="value">{{ item.coaches?.length || 0 }} 人</span>
                                    </div>

                                    <div class="mt-2">
                                        <a-space wrap>
                                            <a-tag v-for="tag in (item.tags || []).slice(0, 3)" :key="tag">
                                                {{ tag }}
                                            </a-tag>
                                        </a-space>
                                    </div>
                                </div>
                            </template>
                        </a-card>
                    </a-col>
                </a-row>

                <div v-else class="empty-wrap">
                    <a-empty description="暂无场馆数据" />
                </div>
            </a-spin>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    CardMeta as ACardMeta,
    Col as ACol,
    Empty as AEmpty,
    Input as AInput,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
} from 'ant-design-vue';
import { getAllVenuesApi, type TodayBusinessHoursDTO, type VenueDetailDTO } from '#/api/venue/list';

defineOptions({ name: 'VenueList' });

const router = useRouter();
const loading = ref(false);
const list = ref<VenueDetailDTO[]>([]);

const keyword = ref('');
const statusFilter = ref<string | undefined>(undefined);

const defaultCover =
    'https://dummyimage.com/600x320/f3f4f6/9ca3af&text=Venue';

const statusOptions = [
    { label: '营业中', value: '营业中' },
    { label: '休业中', value: '休业中' },
    { label: '装修中', value: '装修中' },
    { label: '未知', value: '未知' },
];

const filteredList = computed(() => {
    const key = keyword.value.trim().toLowerCase();

    return list.value.filter((v) => {
        const hitStatus = !statusFilter.value || (v.status || '未知') === statusFilter.value;
        if (!hitStatus) return false;

        if (!key) return true;

        const text = `${v.name ?? ''} ${v.address ?? ''} ${v.phone ?? ''}`.toLowerCase();
        return text.includes(key);
    });
});

function statusColor(status?: string) {
    switch (status) {
        case '营业中':
            return 'success';
        case '休业中':
            return 'warning';
        case '装修中':
            return 'error';
        default:
            return 'default';
    }
}

function formatBusinessHours(hours?: TodayBusinessHoursDTO | null) {
    if (!hours) return '-';
    if (!hours.isOpen) return `${hours.dayOfWeek} 休息`;
    return `${hours.dayOfWeek} ${hours.startTime || '--'}-${hours.endTime || '--'}`;
}

async function fetchList() {
    loading.value = true;
    try {
        const res = await getAllVenuesApi();
        list.value = Array.isArray(res) ? res : [];
    } finally {
        loading.value = false;
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

onMounted(fetchList);
</script>

<style scoped>
.venue-card :deep(.ant-card-body) {
    padding-top: 12px;
}
.venue-cover {
    width: 100%;
    height: 160px;
    object-fit: cover;
}
.venue-name-link {
    color: inherit;
    cursor: pointer;
}
.venue-name-link:hover {
    color: #1890ff;
}
.meta-wrap .line {
    display: flex;
    font-size: 12px;
    margin-bottom: 4px;
}
.meta-wrap .label {
    width: 38px;
    color: #999;
    flex-shrink: 0;
}
.meta-wrap .value {
    color: #555;
    word-break: break-all;
}
.empty-wrap {
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
