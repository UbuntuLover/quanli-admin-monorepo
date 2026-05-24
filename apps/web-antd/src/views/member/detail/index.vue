<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    Divider as ADivider,
    Image as AImage,
    PageHeader as APageHeader,
    Row as ARow,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    message,
} from 'ant-design-vue';
import {
    getAdminMemberDetailApi,
    type AdminMemberDetailDTO,
} from '#/api/member/member';

defineOptions({ name: 'MemberDetail' });

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const memberDetail = ref<AdminMemberDetailDTO | null>(null);

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

function formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    const date = dayjs(dateStr);
    if (!date.isValid()) return dateStr;
    return date.format('YYYY 年 MM 月 DD 日');
}

function formatMoney(amount: number): string {
    return `¥${(amount / 100).toFixed(2)}`;
}

function formatDuration(minutes: number | undefined | null): string {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours} 小时 ${mins} 分钟`;
    }
    return `${mins} 分钟`;
}

async function loadMemberDetail(id: number) {
    loading.value = true;
    try {
        const data = await getAdminMemberDetailApi(id);
        memberDetail.value = data;
    } catch (e: any) {
        message.error(e?.message || '加载会员详情失败');
    } finally {
        loading.value = false;
    }
}

function handleBack() {
    router.push({ name: 'MemberList' });
}

onMounted(() => {
    const id = route.query.id;
    if (id) {
        loadMemberDetail(Number(id));
    } else {
        message.error('会员ID不存在');
        router.push({ name: 'MemberList' });
    }
});
</script>

<template>
    <div class="member-detail-page">
        <a-spin :spinning="loading">
            <a-page-header title="会员详情" @back="handleBack">
                <template #extra>
                    <a-space>
                        <a-button @click="handleBack">返回列表</a-button>
                    </a-space>
                </template>
            </a-page-header>

            <div v-if="memberDetail" class="p-4">
                <!-- 基本信息卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">基本信息</span>
                    </template>

                    <a-row :gutter="24">
                        <!-- 左侧头像区域 -->
                        <a-col :xs="24" :md="6" class="text-center">
                            <a-avatar :src="memberDetail.avatar" :size="120">
                                {{ (memberDetail.name || memberDetail.nickname || '用户')[0] }}
                            </a-avatar>
                            <div class="mt-4">
                                <a-tag :color="statusColor(memberDetail.status)" class="text-sm">
                                    {{ statusText(memberDetail.status) }}
                                </a-tag>
                            </div>
                        </a-col>

                        <!-- 右侧信息区域 -->
                        <a-col :xs="24" :md="18">
                            <a-descriptions :column="2" bordered>
                                <a-descriptions-item label="会员编号">
                                    {{ memberDetail.memberNo }}
                                </a-descriptions-item>
                                <a-descriptions-item label="手机号">
                                    {{ memberDetail.phone }}
                                </a-descriptions-item>
                                <a-descriptions-item label="姓名">
                                    {{ memberDetail.name || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="昵称">
                                    {{ memberDetail.nickname || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="性别">
                                    {{ genderText(memberDetail.gender) }}
                                </a-descriptions-item>
                                <a-descriptions-item label="生日">
                                    {{ memberDetail.birthday || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="省份">
                                    {{ memberDetail.province || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="城市">
                                    {{ memberDetail.city || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="国家/地区">
                                    {{ memberDetail.country || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="注册来源">
                                    {{ memberDetail.registerSource || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="注册时间" :span="2">
                                    {{ formatDateTime(memberDetail.registerTime) }}
                                </a-descriptions-item>
                            </a-descriptions>
                        </a-col>
                    </a-row>
                </a-card>

                <!-- 消费与课程卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">消费与课程</span>
                    </template>

                    <a-row :gutter="16">
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">累计消费</div>
                                <div class="stat-value text-red-500">
                                    {{ formatMoney(memberDetail.totalConsumption) }}
                                </div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">购买课程数</div>
                                <div class="stat-value">{{ memberDetail.totalCourseCount }}</div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">场馆访问次数</div>
                                <div class="stat-value">{{ memberDetail.totalVenueVisitCount }}</div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">最后访问时间</div>
                                <div class="stat-value text-sm">
                                    {{ formatDateTime(memberDetail.lastVisitTime) }}
                                </div>
                            </div>
                        </a-col>
                    </a-row>
                </a-card>

                <!-- 训练数据卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">训练数据</span>
                    </template>

                    <a-row :gutter="16">
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">累计训练次数</div>
                                <div class="stat-value">{{ memberDetail.totalTrainingCount }}</div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">累计训练天数</div>
                                <div class="stat-value">{{ memberDetail.totalTrainingDays }} 天</div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">累计训练时长</div>
                                <div class="stat-value">
                                    {{ formatDuration(memberDetail.totalTrainingMinutes) }}
                                </div>
                            </div>
                        </a-col>
                        <a-col :xs="24" :md="6">
                            <div class="stat-item">
                                <div class="stat-label">最后训练时间</div>
                                <div class="stat-value text-sm">
                                    {{ formatDateTime(memberDetail.lastTrainingTime) }}
                                </div>
                            </div>
                        </a-col>
                    </a-row>
                </a-card>

                <!-- 时间信息卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">系统信息</span>
                    </template>

                    <a-descriptions :column="2" bordered>
                        <a-descriptions-item label="创建时间">
                            {{ formatDateTime(memberDetail.createdAt) }}
                        </a-descriptions-item>
                        <a-descriptions-item label="更新时间">
                            {{ formatDateTime(memberDetail.updatedAt) }}
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>
            </div>
        </a-spin>
    </div>
</template>

<style scoped>
.member-detail-page {
    width: 100%;
}
.stat-item {
    padding: 16px;
    text-align: center;
    background: var(--color-bg-container);
    border-radius: 8px;
    border: 1px solid var(--ant-color-border-secondary, rgba(120, 120, 120, 0.25));
}
.stat-label {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
}
.stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text);
}
.text-sm {
    font-size: 12px;
}
</style>
