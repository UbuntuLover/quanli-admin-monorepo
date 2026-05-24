<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getVenueDetailApi, type VenueDetailDTO } from '#/api/venue/list';
import { Card as ACard, Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem, Image as AImage, PageHeader as APageHeader, Spin as ASpin, Tag as ATag, Space as ASpace, Button as AButton, Divider as ADivider, Row as ARow, Col as ACol, Collapse as ACollapse, CollapsePanel as ACollapsePanel, Avatar as AAvatar, List as AList, ListItem as AListItem, ListItemMeta as AListItemMeta } from 'ant-design-vue';
import { message } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const venueDetail = ref<VenueDetailDTO | null>(null);

// 获取场馆ID
const venueId = computed(() => {
    const id = route.query.id;
    return id ? Number(id) : null;
});

// 状态颜色映射
const statusColor = (status: string) => {
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
};

// 格式化营业时间
const formatBusinessHours = (businessHours: VenueDetailDTO['businessHours']) => {
    if (!businessHours) return '-';
    if (!businessHours.isOpen) return '休息中';
    if (!businessHours.startTime || !businessHours.endTime) return '未设置';
    return `${businessHours.startTime} - ${businessHours.endTime}`;
};

// 获取封面图片
const coverImage = computed(() => {
    if (!venueDetail.value) return '';
    return venueDetail.value.backgroundImage || venueDetail.value.logo || '';
});

// 获取缩略图列表
const thumbnailList = computed(() => {
    if (!venueDetail.value?.thumbnails?.length) return [];
    return venueDetail.value.thumbnails;
});

// 教练头像占位图
const defaultCoachAvatar = 'https://picsum.photos/64/64?random=coach';

// 默认场馆封面
const defaultCover = 'https://picsum.photos/800/400?random=venue';

// 加载场馆详情
async function loadVenueDetail(id: number) {
    try {
        loading.value = true;
        const data = await getVenueDetailApi(id);
        venueDetail.value = data;
    } catch (e: any) {
        message.error(e?.message || '加载场馆详情失败');
    } finally {
        loading.value = false;
    }
}

// 返回列表
function handleBack() {
    router.push({ name: 'VenueList' });
}

// 编辑场馆
function handleEdit() {
    if (venueDetail.value) {
        router.push({
            name: 'VenueEdit',
            query: { id: venueDetail.value.id },
        });
    }
}

// 跳转到教练详情
function handleViewCoach(coachId: number) {
    router.push({
        name: 'CoachDetail',
        query: { id: coachId },
    });
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
                    <a-descriptions-item label="场馆名称">
                        <span class="name">{{ venueDetail.name }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="状态">
                        <a-tag :color="statusColor(venueDetail.status)">
                            {{ venueDetail.status || '未知' }}
                        </a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="联系电话">
                        {{ venueDetail.phone || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="营业状态">
                        <a-tag :color="venueDetail.businessStatus === 1 ? 'success' : 'warning'">
                            {{ venueDetail.businessStatus === 1 ? '营业中' : venueDetail.businessStatus === 2 ? '休业中' : '装修中' }}
                        </a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="地址" :span="2">
                        {{ venueDetail.address || '-' }}
                    </a-descriptions-item>
                    <a-descriptions-item v-if="venueDetail.description" label="简介" :span="2">
                        {{ venueDetail.description }}
                    </a-descriptions-item>
                </a-descriptions>

                <!-- 营业时间 -->
                <a-divider orientation="left">营业时间</a-divider>
                <a-descriptions :column="1" bordered>
                    <a-descriptions-item label="今日营业时间">
                        <a-tag :color="venueDetail.businessHours?.isOpen ? 'success' : 'warning'">
                            {{ formatBusinessHours(venueDetail.businessHours) }}
                        </a-tag>
                        <span v-if="venueDetail.businessHours?.dayOfWeek" class="ml-2 text-gray-500">
                            ({{ venueDetail.businessHours.dayOfWeek }})
                        </span>
                    </a-descriptions-item>
                </a-descriptions>

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

                <!-- 标签 -->
                <template v-if="venueDetail.tags?.length">
                    <a-divider orientation="left">场馆标签</a-divider>
                    <div class="tags-section">
                        <a-tag v-for="tag in venueDetail.tags" :key="tag" color="blue">
                            {{ tag }}
                        </a-tag>
                    </div>
                </template>

                <!-- 缩略图 -->
                <template v-if="thumbnailList.length">
                    <a-divider orientation="left">场馆图册</a-divider>
                    <div class="thumbnails-section">
                        <a-image.PreviewGroup>
                            <a-row :gutter="[8, 8]">
                                <a-col v-for="(img, index) in thumbnailList" :key="index" :span="8">
                                    <a-image :src="img" :alt="`场馆图片${index + 1}`" class="thumbnail-image" />
                                </a-col>
                            </a-row>
                        </a-image.PreviewGroup>
                    </div>
                </template>

                <!-- 教练列表 -->
                <template v-if="venueDetail.coaches?.length">
                    <a-divider orientation="left">
                        场馆教练 ({{ venueDetail.coaches.length }})
                    </a-divider>
                    <a-list
                        :data-source="venueDetail.coaches"
                        item-layout="horizontal"
                        :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }"
                    >
                        <template #renderItem="{ item }">
                            <a-list-item>
                                <a-card hoverable class="coach-card" @click="handleViewCoach(item.id)">
                                    <template #cover>
                                        <a-avatar :src="item.avatar" :size="80" class="coach-avatar">
                                            {{ item.name?.charAt(0) || '?' }}
                                        </a-avatar>
                                    </template>
                                    <div class="coach-meta">
                                        <div class="coach-name">{{ item.name }}</div>
                                        <div v-if="item.introduction" class="coach-intro">
                                            {{ item.introduction.length > 50 
                                                ? item.introduction.slice(0, 50) + '...' 
                                                : item.introduction }}
                                        </div>
                                        <div v-if="item.tags?.length" class="coach-tags">
                                            <a-tag 
                                                v-for="tag in item.tags.slice(0, 3)" 
                                                :key="tag" 
                                                size="small"
                                            >
                                                {{ tag }}
                                            </a-tag>
                                        </div>
                                    </div>
                                </a-card>
                            </a-list-item>
                        </template>
                    </a-list>
                </template>
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

.coach-card {
    text-align: center;
    cursor: pointer;
}

.coach-meta {
    padding: 12px;
}

.coach-name {
    font-size: 14px;
    font-weight: 500;
    margin-top: 8px;
}

.coach-avatar {
    margin: 16px auto 0;
}

.coach-intro {
    font-size: 12px;
    color: #666;
    line-height: 1.4;
    margin-top: 8px;
}

.coach-tags {
    margin-top: 8px;
}
</style>
