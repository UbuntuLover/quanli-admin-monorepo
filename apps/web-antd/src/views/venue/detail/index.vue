<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getVenueDetailForAdminApi, type VenueDetailForAdminDTO, type BusinessHourConfig } from '#/api/venue/create';
import {
    Card as ACard,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    Image as AImage,
    PageHeader as APageHeader,
    Spin as ASpin,
    Tag as ATag,
    Space as ASpace,
    Button as AButton,
    Divider as ADivider,
    Row as ARow,
    Col as ACol,
    Table as ATable,
    TableColumn as ATableColumn,
} from 'ant-design-vue';
import { message } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const venueDetail = ref<VenueDetailForAdminDTO | null>(null);

const venueId = computed(() => {
    const id = route.query.id;
    return id ? Number(id) : null;
});

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

const coverImage = computed(() => {
    if (!venueDetail.value) return '';
    return venueDetail.value.backgroundImage || venueDetail.value.logo || '';
});

const photoList = computed(() => {
    if (!venueDetail.value?.photos?.length) return [];
    return venueDetail.value.photos;
});

const weekDayLabels: Record<string, string> = {
    monday: '周一',
    tuesday: '周二',
    wednesday: '周三',
    thursday: '周四',
    friday: '周五',
    saturday: '周六',
    sunday: '周日',
};

const businessHoursList = computed(() => {
    if (!venueDetail.value?.businessHours) return [];
    return Object.entries(venueDetail.value.businessHours).map(([key, config]) => ({
        day: weekDayLabels[key] || key,
        ...config,
    }));
});

async function loadVenueDetail(id: number) {
    try {
        loading.value = true;
        const data = await getVenueDetailForAdminApi(id);
        venueDetail.value = data;
    } catch (e: any) {
        message.error(e?.message || '加载场馆详情失败');
    } finally {
        loading.value = false;
    }
}

function handleBack() {
    router.push({ name: 'VenueList' });
}

function handleEdit() {
    if (venueDetail.value) {
        router.push({
            name: 'VenueEdit',
            query: { id: venueDetail.value.id },
        });
    }
}

onMounted(() => {
    const id = venueId.value;
    if (id) {
        loadVenueDetail(id);
    } else {
        message.error('场馆ID不存在');
        router.push({ name: 'VenueList' });
    }
});
</script>

<template>
    <div class="venue-detail">
        <a-page-header title="场馆详情" @back="handleBack">
            <template #extra>
                <a-space>
                    <a-button @click="handleEdit">编辑</a-button>
                </a-space>
            </template>
        </a-page-header>

        <a-spin :spinning="loading">
            <a-card v-if="venueDetail" :bordered="false" class="detail-card">
                <!-- 封面图片 -->
                <div v-if="coverImage" class="cover-section">
                    <img :src="coverImage" :alt="venueDetail.name" class="cover-image" />
                </div>

                <!-- 基本信息 -->
                <a-divider orientation="left">基本信息</a-divider>
                <a-descriptions :column="2" bordered>
                    <a-descriptions-item label="场馆编号">
                        {{ venueDetail.venueNo }}
                    </a-descriptions-item>
                    <a-descriptions-item label="场馆名称">
                        <span class="name">{{ venueDetail.name }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="联系电话">
                        {{ venueDetail.phone || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="营业状态">
                        <a-tag :color="statusColor(venueDetail.businessStatus)">
                            {{ venueDetail.businessStatusText || statusText(venueDetail.businessStatus) }}
                        </a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="省份">
                        {{ venueDetail.province || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="城市">
                        {{ venueDetail.city || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="区县">
                        {{ venueDetail.district || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="场馆状态">
                        <a-tag :color="venueDetail.status === 1 ? 'success' : 'warning'">
                            {{ venueDetail.status === 1 ? '正常' : '停用' }}
                        </a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="地址" :span="2">
                        {{ venueDetail.address || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="面积">
                        {{ venueDetail.areaSqm ? `${venueDetail.areaSqm} ㎡` : '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="容纳人数">
                        {{ venueDetail.capacity ?? '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item v-if="venueDetail.description" label="简介" :span="2">
                        {{ venueDetail.description }}
                    </a-descriptions-item>
                </a-descriptions>

                <!-- 每周营业时间 -->
                <a-divider orientation="left">每周营业时间</a-divider>
                <a-table
                    v-if="businessHoursList.length"
                    :dataSource="businessHoursList"
                    :pagination="false"
                    :scroll="{ y: 240 }"
                    row-key="day"
                    size="small"
                >
                    <a-table-column title="星期" data-index="day" width="100" />
                    <a-table-column title="状态" data-index="isOpen" width="120">
                        <template #default="{ record }">
                            <a-tag :color="record.isOpen ? 'success' : 'default'">
                                {{ record.isOpen ? '营业' : '休息' }}
                            </a-tag>
                        </template>
                    </a-table-column>
                    <a-table-column title="营业时间">
                        <template #default="{ record }">
                            <template v-if="record.isOpen">
                                {{ record.startTime || '--' }} - {{ record.endTime || '--' }}
                            </template>
                            <span v-else class="text-gray-400">-</span>
                        </template>
                    </a-table-column>
                </a-table>
                <div v-else class="text-gray-400 py-4">暂无营业时间数据</div>

                <!-- 位置信息 -->
                <template v-if="venueDetail.longitude && venueDetail.latitude">
                    <a-divider orientation="left">位置信息</a-divider>
                    <a-descriptions :column="2" bordered>
                        <a-descriptions-item label="经度">
                            {{ venueDetail.longitude }}
                        </a-descriptions-item>
                        <a-descriptions-item label="纬度">
                            {{ venueDetail.latitude }}
                        </a-descriptions-item>
                    </a-descriptions>
                </template>

                <!-- 设施 -->
                <template v-if="venueDetail.facilities?.length">
                    <a-divider orientation="left">设施</a-divider>
                    <div class="tags-section">
                        <a-tag v-for="facility in venueDetail.facilities" :key="facility" color="green">
                            {{ facility }}
                        </a-tag>
                    </div>
                </template>

                <!-- 标签 -->
                <template v-if="venueDetail.tags?.length">
                    <a-divider orientation="left">场馆标签</a-divider>
                    <div class="tags-section">
                        <a-tag v-for="tag in venueDetail.tags" :key="tag" color="blue">
                            {{ tag }}
                        </a-tag>
                    </div>
                </template>

                <!-- 场馆图片 -->
                <template v-if="photoList.length">
                    <a-divider orientation="left">场馆图片</a-divider>
                    <div class="thumbnails-section">
                        <a-image.PreviewGroup>
                            <a-row :gutter="[8, 8]">
                                <a-col v-for="(img, index) in photoList" :key="index" :span="8">
                                    <a-image :src="img" :alt="`场馆图片${index + 1}`" class="thumbnail-image" />
                                </a-col>
                            </a-row>
                        </a-image.PreviewGroup>
                    </div>
                </template>

                <!-- 场馆公告 -->
                <template v-if="venueDetail.notice">
                    <a-divider orientation="left">场馆公告</a-divider>
                    <div class="notice-section">
                        {{ venueDetail.notice }}
                    </div>
                </template>

                <!-- 时间信息 -->
                <a-divider orientation="left">时间信息</a-divider>
                <a-descriptions :column="2" bordered>
                    <a-descriptions-item label="创建时间">
                        {{ venueDetail.createdAt || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="更新时间">
                        {{ venueDetail.updatedAt || '-' }}
                    </a-descriptions-item>
                </a-descriptions>
            </a-card>
        </a-spin>
    </div>
</template>

<style scoped>
.venue-detail {
    padding: 16px;
}

.detail-card {
    margin-top: 16px;
}

.cover-section {
    margin-bottom: 24px;
    border-radius: 8px;
    overflow: hidden;
}

.cover-image {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
}

.name {
    font-size: 18px;
    font-weight: 600;
}

.ml-2 {
    margin-left: 8px;
}

.text-gray-500 {
    color: #9ca3af;
}

.tags-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.thumbnails-section {
    margin-top: 8px;
}

.thumbnail-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 4px;
}

.notice-section {
    padding: 12px;
    background: #fafafa;
    border-radius: 4px;
    color: #666;
}

.text-gray-400 {
    color: #9ca3af;
}
</style>
