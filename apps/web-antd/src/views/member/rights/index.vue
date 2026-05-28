<script setup lang="ts">
import { onMounted, ref, computed, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import {
    Card as ACard,
    Col as ACol,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    Drawer as ADrawer,
    Empty as AEmpty,
    Menu as AMenu,
    Modal as AModal,
    PageHeader as APageHeader,
    Row as ARow,
    Spin as ASpin,
    Tag as ATag,
    message,
} from 'ant-design-vue';

import {
    ArrowLeftOutlined as AArrowLeftOutlined,
    CalendarOutlined as ACalendarOutlined,
    MoreOutlined as AMoreOutlined,
    AlignRightOutlined as ASnowflakeOutlined,
    UnlockOutlined as AUnlockOutlined,
    ArrowsAltOutlined as AArrowsAltOutlined,
    DeleteOutlined as ADeleteOutlined,
} from '@ant-design/icons-vue';

import {
    getAdminPackagesByMemberIdApi,
    getAdminMemberPackageDetailApi,
    freezeAdminMemberPackageApi,
    unfreezeAdminMemberPackageApi,
    deleteAdminMemberPackageApi,
    extendAdminMemberPackageValidityApi,
    type AdminMemberPackageListDTO,
    type AdminMemberPackageDetailDTO,
} from '#/api/member-packages/member-packages';
import { getAdminMemberDetailApi, type AdminMemberDetailDTO } from '#/api/member/member';

defineOptions({name: 'MemberRights'});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const memberDetail = ref<AdminMemberDetailDTO | null>(null);
const memberPackages = ref<AdminMemberPackageListDTO[]>([]);
const detailDrawerOpen = ref(false);
const packageDetail = ref<AdminMemberPackageDetailDTO | null>(null);
const detailLoading = ref(false);
const subPackageModalOpen = ref(false);
const subPackageDetail = ref<AdminMemberPackageDetailDTO | null>(null);
const subPackageLoading = ref(false);
const actionMenuVisible = ref(false);
const actionMenuTarget = ref<{ pkg: AdminMemberPackageListDTO; event: MouseEvent } | null>(null);
const freezeModalVisible = ref(false);
const freezeDays = ref(7);
const freezeReason = ref('');
const deleteModalVisible = ref(false);
const deleteReason = ref('');
const extendModalVisible = ref(false);
const extendDays = ref(30);
const extendReason = ref('');
const currentActionPkg = ref<AdminMemberPackageListDTO | null>(null);


const memberId = computed(() => route.query.memberId as string | undefined);

function cardTypeText(cardType: string): string {
    switch (cardType) {
        case 'COURSE':
            return '课程卡';
        case 'VENUE':
            return '场地卡';
        case 'COMBO':
            return '组合卡';
        default:
            return cardType;
    }
}

function cardTypeColor(cardType: string): string {
    switch (cardType) {
        case 'COURSE':
            return 'blue';
        case 'VENUE':
            return 'purple';
        case 'COMBO':
            return 'orange';
        default:
            return 'default';
    }
}

function packageStatusText(status: number | undefined): string {
    if (!status) return '-';
    switch (status) {
        case 1:
            return '未激活';
        case 2:
            return '使用中';
        case 3:
            return '已过期';
        case 4:
            return '已冻结';
        case 5:
            return '已注销';
        default:
            return '未知';
    }
}

function packageStatusColor(status: number | undefined): string {
    if (!status) return 'default';
    switch (status) {
        case 1:
            return 'default';
        case 2:
            return 'success';
        case 3:
            return 'warning';
        case 4:
            return 'error';
        case 5:
            return 'default';
        default:
            return 'default';
    }
}

function formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    const date = dayjs(dateStr);
    if (!date.isValid()) return dateStr;
    return date.format('YYYY 年 MM 月 DD 日');
}

function formatMoney(amount: number | undefined | null): string {
    if (!amount) return '-';
    return `¥${(amount / 100).toFixed(2)}`;
}

function formatDateTime(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    const date = dayjs(dateStr);
    if (!date.isValid()) return dateStr;
    return date.format('YYYY-MM-DD HH:mm:ss');
}

function handleBack() {
    router.back();
}

async function openPackageDetail(pkgId: string) {
    detailDrawerOpen.value = true;
    detailLoading.value = true;
    try {
        const detail = await getAdminMemberPackageDetailApi(pkgId);
        packageDetail.value = detail;
    } catch (e: any) {
        message.error(e?.message || '加载权益详情失败');
        detailDrawerOpen.value = false;
    } finally {
        detailLoading.value = false;
    }
}

function closeDetailDrawer() {
    detailDrawerOpen.value = false;
    packageDetail.value = null;
}

async function openSubPackageDetail(pkgId: string) {
    subPackageModalOpen.value = true;
    subPackageLoading.value = true;
    try {
        const detail = await getAdminMemberPackageDetailApi(pkgId);
        subPackageDetail.value = detail;
    } catch (e: any) {
        message.error(e?.message || '加载子卡详情失败');
        subPackageModalOpen.value = false;
    } finally {
        subPackageLoading.value = false;
    }
}

function closeSubPackageModal() {
    subPackageModalOpen.value = false;
    subPackageDetail.value = null;
}

function openActionMenu(pkg: AdminMemberPackageListDTO, event: MouseEvent) {
    event.stopPropagation();
    actionMenuTarget.value = { pkg, event };
    actionMenuVisible.value = true;
}

function closeActionMenu() {
    actionMenuVisible.value = false;
    actionMenuTarget.value = null;
}

async function handleFreeze(pkg: AdminMemberPackageListDTO) {
    currentActionPkg.value = pkg;
    closeActionMenu();
    freezeDays.value = 7;
    freezeReason.value = '';
    freezeModalVisible.value = true;
}

async function confirmFreeze() {
    const pkg = currentActionPkg.value;
    if (!pkg) return;

    try {
        await freezeAdminMemberPackageApi(pkg.id, {
            freezeDays: freezeDays.value,
            freezeReason: freezeReason.value || undefined,
        });
        message.success('冻结成功');
        freezeModalVisible.value = false;
        currentActionPkg.value = null;
        await loadData();
    } catch (e: any) {
        message.error(e?.message || '冻结失败');
    }
}

async function confirmDelete() {
    const pkg = currentActionPkg.value;
    if (!pkg) return;

    try {
        await deleteAdminMemberPackageApi(pkg.id, {
            deleteReason: deleteReason.value || undefined,
        });
        message.success('删除成功');
        deleteModalVisible.value = false;
        currentActionPkg.value = null;
        await loadData();
    } catch (e: any) {
        message.error(e?.message || '删除失败');
    }
}

async function handleUnfreeze(pkg: AdminMemberPackageListDTO) {
    currentActionPkg.value = pkg;
    closeActionMenu();
    try {
        await unfreezeAdminMemberPackageApi(pkg.id);
        message.success('解冻成功');
        currentActionPkg.value = null;
        await loadData();
    } catch (e: any) {
        message.error(e?.message || '解冻失败');
    }
}

async function handleExtend(pkg: AdminMemberPackageListDTO) {
    currentActionPkg.value = pkg;
    closeActionMenu();
    extendDays.value = 30;
    extendReason.value = '';
    extendModalVisible.value = true;
}

async function confirmExtend() {
    const pkg = currentActionPkg.value;
    if (!pkg) return;

    try {
        await extendAdminMemberPackageValidityApi(pkg.id, extendDays.value);
        message.success('延期成功');
        extendModalVisible.value = false;
        currentActionPkg.value = null;
        await loadData();
    } catch (e: any) {
        message.error(e?.message || '延期失败');
    }
}


async function handleDelete(pkg: AdminMemberPackageListDTO) {
    currentActionPkg.value = pkg;
    closeActionMenu();
    deleteReason.value = '';
    deleteModalVisible.value = true;
}


async function loadData() {
    if (!memberId.value) {
        message.error('会员ID不存在');
        router.push({name: 'MemberList'});
        return;
    }

    loading.value = true;
    try {
        // 并行加载会员详情和权益卡列表
        const [member, packages] = await Promise.all([
            getAdminMemberDetailApi(memberId.value),
            getAdminPackagesByMemberIdApi(memberId.value),
        ]);
        memberDetail.value = member;
        memberPackages.value = packages || [];
    } catch (e: any) {
        message.error(e?.message || '加载数据失败');
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="member-rights-page">
        <a-spin :spinning="loading">
            <a-page-header title="会员权益信息" @back="handleBack">
                <template #extra>
                    <a-button @click="handleBack">
                        <a-arrow-left-outlined/>
                        返回
                    </a-button>
                </template>
            </a-page-header>

            <div v-if="memberDetail" class="p-4">
                <!-- 会员信息卡片 -->
                <a-card :bordered="false" class="mb-4">
                    <template #title>
                        <span class="text-base font-semibold">会员信息</span>
                    </template>
                    <a-row :gutter="24">
                        <a-col :xs="24" :md="8">
                            <a-descriptions :column="1" bordered size="small">
                                <a-descriptions-item label="会员编号">
                                    {{ memberDetail.memberNo }}
                                </a-descriptions-item>
                                <a-descriptions-item label="姓名">
                                    {{ memberDetail.name || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="昵称">
                                    {{ memberDetail.nickname || '-' }}
                                </a-descriptions-item>
                                <a-descriptions-item label="手机号">
                                    {{ memberDetail.phone }}
                                </a-descriptions-item>
                            </a-descriptions>
                        </a-col>
                        <a-col :xs="24" :md="8">
                            <a-descriptions :column="1" bordered size="small">
                                <a-descriptions-item label="累计消费">
                                    {{ formatMoney(memberDetail.totalConsumption) }}
                                </a-descriptions-item>
                                <a-descriptions-item label="购买课程数">
                                    {{ memberDetail.totalCourseCount }}
                                </a-descriptions-item>
                                <a-descriptions-item label="训练次数">
                                    {{ memberDetail.totalTrainingCount }}
                                </a-descriptions-item>
                                <a-descriptions-item label="注册时间">
                                    {{ formatDateTime(memberDetail.registerTime) }}
                                </a-descriptions-item>
                            </a-descriptions>
                        </a-col>
                        <a-col :xs="24" :md="8">
                            <div class="stats-card">
                                <div class="stat-item">
                                    <div class="stat-value">{{ memberPackages.length }}</div>
                                    <div class="stat-label">权益卡总数</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">
                                        {{ memberPackages.filter((p) => p.status === 2).length }}
                                    </div>
                                    <div class="stat-label">使用中</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">
                                        {{ memberPackages.filter((p) => p.status === 1).length }}
                                    </div>
                                    <div class="stat-label">未激活</div>
                                </div>
                            </div>
                        </a-col>
                    </a-row>
                </a-card>

                <!-- 权益卡列表 -->
                <a-card :bordered="false">
                    <template #title>
                        <span class="text-base font-semibold">权益卡列表</span>
                        <span class="ml-2 text-sm text-gray-500">共 {{ memberPackages.length }} 张</span>
                    </template>

                    <div v-if="memberPackages.length > 0" class="packages-container">
                        <a-row :gutter="16">
                            <a-col
                                v-for="pkg in memberPackages"
                                :key="pkg.id"
                                :xs="24"
                                :sm="12"
                                :lg="8"
                            >
                                <a-card
                                    :bordered="true"
                                    class="package-card"
                                    :class="{ 'disabled-card': pkg.status !== 2 }"
                                    hoverable
                                    @click="openPackageDetail(pkg.id)"
                                >
                                    <div class="package-header">
                                        <div class="package-title-row">
                                            <span class="package-name">{{ pkg.packageName }}</span>
                                            <div class="package-actions">
                                                <a-tag :color="cardTypeColor(pkg.cardType)">
                                                    {{ cardTypeText(pkg.cardType) }}
                                                </a-tag>
                                                <button
                                                    class="action-btn"
                                                    @click="openActionMenu(pkg, $event)"
                                                >
                                                    <a-more-outlined />
                                                </button>
                                            </div>
                                        </div>
                                        <div class="package-status-bar">
                                            <a-tag :color="packageStatusColor(pkg.status)">
                                                {{ packageStatusText(pkg.status) }}
                                            </a-tag>
                                            <span class="package-no">编号: {{ pkg.packageNo }}</span>
                                        </div>
                                    </div>

                                    <div class="package-body">
                                        <div v-if="pkg.startDate && pkg.endDate" class="package-info-item">
                                            <a-calendar-outlined class="info-icon" />
                                            <span class="info-text">
                                                {{ formatDate(pkg.startDate) }} - {{ formatDate(pkg.endDate) }}
                                            </span>
                                        </div>

                                        <div v-if="pkg.remainingDays" class="package-info-item">
                                            <span class="info-label">剩余天数:</span>
                                            <span class="info-value text-success">{{ pkg.remainingDays }} 天</span>
                                        </div>

                                        <div v-if="pkg.courseTotalTimes !== undefined" class="package-info-item">
                                            <span class="info-label">课程:</span>
                                            <span class="info-value">
                                                总{{ pkg.courseTotalTimes }} / 剩余<span class="text-success">{{ pkg.courseRemainingTimes || 0 }}</span> / 已用{{ pkg.courseUsedTimes }}
                                            </span>
                                        </div>

                                        <div v-if="pkg.venueTotalTimes !== undefined" class="package-info-item">
                                            <span class="info-label">场地:</span>
                                            <span class="info-value">
                                                总{{ pkg.venueTotalTimes }} / 剩余<span class="text-success">{{ pkg.venueRemainingTimes || 0 }}</span>
                                            </span>
                                        </div>

                                        <div class="package-info-item">
                                            <span class="info-label">购买:</span>
                                            <span class="info-value text-red-500">{{ formatMoney(pkg.paidPrice) }}</span>
                                        </div>
                                    </div>
                                </a-card>
                            </a-col>
                        </a-row>
                    </div>

                    <a-empty v-else class="py-12">
                        <template #description>该会员暂无权益卡</template>
                    </a-empty>
                </a-card>

                <!-- 权益详情抽屉 -->
                <a-drawer
                    v-model:open="detailDrawerOpen"
                    title="权益卡详情"
                    :width="600"
                    @close="closeDetailDrawer"
                >
                    <a-spin :spinning="detailLoading">
                        <div v-if="packageDetail" class="package-detail">
                            <a-card :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">{{ packageDetail.packageName }}</span>
                                </template>
                                <div class="detail-header">
                                    <a-tag :color="cardTypeColor(packageDetail.cardType)">
                                        {{ cardTypeText(packageDetail.cardType) }}
                                    </a-tag>
                                    <a-tag :color="packageStatusColor(packageDetail.status)">
                                        {{ packageStatusText(packageDetail.status) }}
                                    </a-tag>
                                    <span class="detail-no">编号: {{ packageDetail.packageNo }}</span>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">基本信息</span>
                                </template>
                                <a-descriptions :column="2" bordered size="small">
                                    <a-descriptions-item label="会员编号">
                                        {{ packageDetail.memberNo }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="会员姓名">
                                        {{ packageDetail.memberName || packageDetail.memberNickname || '-' }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="会员手机">
                                        {{ packageDetail.memberPhone }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="购买时间">
                                        {{ formatDateTime(packageDetail.purchaseTime) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="激活时间">
                                        {{ formatDateTime(packageDetail.activatedAt) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="购买来源">
                                        {{ packageDetail.purchaseSource || '-' }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="原价">
                                        {{ formatMoney(packageDetail.originalPrice) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="实付金额">
                                        <span class="text-red-500">{{ formatMoney(packageDetail.paidPrice) }}</span>
                                    </a-descriptions-item>
                                    <a-descriptions-item v-if="packageDetail.discountAmount" label="优惠金额">
                                        <span class="text-success">-{{ formatMoney(packageDetail.discountAmount) }}</span>
                                    </a-descriptions-item>
                                    <a-descriptions-item label="新客优惠">
                                        {{ packageDetail.isUsedNewCustomerDiscount ? '是' : '否' }}
                                    </a-descriptions-item>
                                </a-descriptions>
                            </a-card>

                            <a-card :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">有效期</span>
                                </template>
                                <a-descriptions :column="1" bordered size="small">
                                    <a-descriptions-item label="开始日期">
                                        {{ formatDate(packageDetail.startDate) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="结束日期">
                                        {{ formatDate(packageDetail.endDate) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item v-if="packageDetail.originalEndDate" label="原结束日期">
                                        {{ formatDate(packageDetail.originalEndDate) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item v-if="packageDetail.remainingDays" label="剩余天数">
                                        <span class="text-success font-medium">{{ packageDetail.remainingDays }} 天</span>
                                    </a-descriptions-item>
                                </a-descriptions>
                            </a-card>

                            <a-card :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">使用情况</span>
                                </template>
                                <a-descriptions :column="1" bordered size="small">
                                    <a-descriptions-item v-if="packageDetail.courseTotalTimes" label="课程次数">
                                        <div class="usage-bar">
                                            <div class="usage-info">
                                                <span>总计: {{ packageDetail.courseTotalTimes }}次</span>
                                                <span>已用: {{ packageDetail.courseUsedTimes }}次</span>
                                                <span class="text-success">剩余: {{ packageDetail.courseRemainingTimes }}次</span>
                                            </div>
                                            <div class="usage-progress">
                                                <div
                                                    class="progress-bar"
                                                    :style="{ width: `${(packageDetail.courseUsedTimes / packageDetail.courseTotalTimes) * 100}%` }"
                                                ></div>
                                            </div>
                                        </div>
                                    </a-descriptions-item>
                                    <a-descriptions-item v-if="packageDetail.venueTotalTimes" label="场地次数">
                                        <div class="usage-bar">
                                            <div class="usage-info">
                                                <span>总计: {{ packageDetail.venueTotalTimes }}次</span>
                                                <span>已用: {{ packageDetail.venueUsedTimes || 0 }}次</span>
                                                <span class="text-success">剩余: {{ packageDetail.venueRemainingTimes }}次</span>
                                            </div>
                                            <div class="usage-progress">
                                                <div
                                                    class="progress-bar"
                                                    :style="{ width: `${((packageDetail.venueUsedTimes || 0) / packageDetail.venueTotalTimes) * 100}%` }"
                                                ></div>
                                            </div>
                                        </div>
                                    </a-descriptions-item>
                                </a-descriptions>
                            </a-card>

                            <a-card v-if="packageDetail.cardType === 'COMBO' && packageDetail.subPackages?.length" :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">子卡详情</span>
                                </template>
                                <div class="sub-packages-list">
                                    <div
                                        v-for="subPkg in packageDetail.subPackages"
                                        :key="subPkg.id"
                                        class="sub-package-item cursor-pointer"
                                        @click="openSubPackageDetail(subPkg.id)"
                                    >
                                        <div class="sub-package-header">
                                            <span class="sub-package-name">{{ subPkg.packageName }}</span>
                                            <a-tag :color="packageStatusColor(subPkg.status)">
                                                {{ packageStatusText(subPkg.status) }}
                                            </a-tag>
                                        </div>
                                        <div class="sub-package-info">
                                            <span v-if="subPkg.courseTotalTimes">
                                                课程: 总{{ subPkg.courseTotalTimes }} / 剩余{{ subPkg.courseRemainingTimes || 0 }} / 已用{{ subPkg.courseUsedTimes }}
                                            </span>
                                            <span v-if="subPkg.venueTotalTimes">
                                                场地: 总{{ subPkg.venueTotalTimes }} / 剩余{{ subPkg.venueRemainingTimes || 0 }}
                                            </span>
                                        </div>
                                        <div class="sub-package-hint">点击查看详情</div>
                                    </div>
                                </div>
                            </a-card>

                            <a-card v-if="packageDetail.status === 4" :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">冻结信息</span>
                                </template>
                                <a-descriptions :column="1" bordered size="small">
                                    <a-descriptions-item label="冻结天数">
                                        {{ packageDetail.freezeDays }} 天
                                    </a-descriptions-item>
                                    <a-descriptions-item label="冻结开始">
                                        {{ formatDate(packageDetail.freezeStartDate) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="冻结结束">
                                        {{ formatDate(packageDetail.freezeEndDate) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="冻结原因">
                                        {{ packageDetail.freezeReason || '-' }}
                                    </a-descriptions-item>
                                </a-descriptions>
                            </a-card>

                            <a-card v-if="packageDetail.remark" :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">备注</span>
                                </template>
                                <p class="remark-text">{{ packageDetail.remark }}</p>
                            </a-card>
                        </div>
                    </a-spin>
                </a-drawer>

                <!-- 子卡详情弹窗 -->
                <a-modal
                    v-model:open="subPackageModalOpen"
                    title="子卡详情"
                    :width="500"
                    @cancel="closeSubPackageModal"
                >
                    <a-spin :spinning="subPackageLoading">
                        <div v-if="subPackageDetail" class="sub-package-detail">
                            <a-card :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">{{ subPackageDetail.packageName }}</span>
                                </template>
                                <div class="detail-header">
                                    <a-tag :color="cardTypeColor(subPackageDetail.cardType)">
                                        {{ cardTypeText(subPackageDetail.cardType) }}
                                    </a-tag>
                                    <a-tag :color="packageStatusColor(subPackageDetail.status)">
                                        {{ packageStatusText(subPackageDetail.status) }}
                                    </a-tag>
                                    <span class="detail-no">编号: {{ subPackageDetail.packageNo }}</span>
                                </div>
                            </a-card>

                            <a-card :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">有效期</span>
                                </template>
                                <a-descriptions :column="2" bordered size="small">
                                    <a-descriptions-item label="开始日期">
                                        {{ formatDate(subPackageDetail.startDate) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item label="结束日期">
                                        {{ formatDate(subPackageDetail.endDate) }}
                                    </a-descriptions-item>
                                    <a-descriptions-item v-if="subPackageDetail.remainingDays" label="剩余天数">
                                        <span class="text-success font-medium">{{ subPackageDetail.remainingDays }} 天</span>
                                    </a-descriptions-item>
                                </a-descriptions>
                            </a-card>

                            <a-card :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">使用情况</span>
                                </template>
                                <a-descriptions :column="1" bordered size="small">
                                    <a-descriptions-item v-if="subPackageDetail.courseTotalTimes" label="课程次数">
                                        <div class="usage-bar">
                                            <div class="usage-info">
                                                <span>总计: {{ subPackageDetail.courseTotalTimes }}次</span>
                                                <span>已用: {{ subPackageDetail.courseUsedTimes }}次</span>
                                                <span class="text-success">剩余: {{ subPackageDetail.courseRemainingTimes }}次</span>
                                            </div>
                                            <div class="usage-progress">
                                                <div
                                                    class="progress-bar"
                                                    :style="{ width: `${(subPackageDetail.courseUsedTimes / subPackageDetail.courseTotalTimes) * 100}%` }"
                                                ></div>
                                            </div>
                                        </div>
                                    </a-descriptions-item>
                                    <a-descriptions-item v-if="subPackageDetail.venueTotalTimes" label="场地次数">
                                        <div class="usage-bar">
                                            <div class="usage-info">
                                                <span>总计: {{ subPackageDetail.venueTotalTimes }}次</span>
                                                <span>已用: {{ subPackageDetail.venueUsedTimes || 0 }}次</span>
                                                <span class="text-success">剩余: {{ subPackageDetail.venueRemainingTimes }}次</span>
                                            </div>
                                            <div class="usage-progress">
                                                <div
                                                    class="progress-bar"
                                                    :style="{ width: `${((subPackageDetail.venueUsedTimes || 0) / subPackageDetail.venueTotalTimes) * 100}%` }"
                                                ></div>
                                            </div>
                                        </div>
                                    </a-descriptions-item>
                                </a-descriptions>
                            </a-card>

                            <a-card v-if="subPackageDetail.status === 4" :bordered="false" class="mb-4">
                                <template #title>
                                    <span class="text-base font-semibold">冻结信息</span>
                                </template>
                                <a-descriptions :column="1" bordered size="small">
                                    <a-descriptions-item label="冻结天数">
                                        {{ subPackageDetail.freezeDays }} 天
                                    </a-descriptions-item>
                                    <a-descriptions-item label="冻结原因">
                                        {{ subPackageDetail.freezeReason || '-' }}
                                    </a-descriptions-item>
                                </a-descriptions>
                            </a-card>

                            <a-card v-if="subPackageDetail.remark" :bordered="false">
                                <template #title>
                                    <span class="text-base font-semibold">备注</span>
                                </template>
                                <p class="remark-text">{{ subPackageDetail.remark }}</p>
                            </a-card>
                        </div>
                    </a-spin>
                </a-modal>

                <!-- 操作菜单 -->
                <a-menu
                    v-if="actionMenuVisible && actionMenuTarget"
                    :style="{
                        position: 'fixed',
                        top: `${actionMenuTarget.event.clientY}px`,
                        left: `${actionMenuTarget.event.clientX}px`,
                        zIndex: 1000,
                    }"
                    mode="vertical"
                    :items="[
                        {
                          key: 'extend',
                          label: '延长有效期',
                          icon: h(AArrowsAltOutlined),
                          onClick: () => {
                              handleExtend(actionMenuTarget.pkg)
                          }
                        },
                        {
                            key: 'freeze',
                            label: actionMenuTarget.pkg.status === 4 ? '解冻权益卡' : '冻结权益卡',
                            icon: actionMenuTarget.pkg.status === 4 ? h(AUnlockOutlined) : h(ASnowflakeOutlined),
                            onClick: () => actionMenuTarget.pkg.status === 4 ? handleUnfreeze(actionMenuTarget.pkg) : handleFreeze(actionMenuTarget.pkg),
                            disabled: actionMenuTarget.pkg.status === 3 || actionMenuTarget.pkg.status === 5,
                        },
                        {
                            key: 'delete',
                            label: '删除权益卡',
                            icon: h(ADeleteOutlined),
                            onClick: () => handleDelete(actionMenuTarget.pkg),
                            disabled: actionMenuTarget.pkg.status === 5,
                            danger: true,
                        },
                    ]"
                />

                <!-- 冻结弹窗 -->
                <a-modal
                    v-model:open="freezeModalVisible"
                    title="冻结权益卡"
                    :width="400"
                    @cancel="freezeModalVisible = false"
                    @ok="confirmFreeze"
                >
                    <div class="freeze-form">
                        <div class="form-item">
                            <label>冻结天数</label>
                            <a-input-number
                                v-model:value="freezeDays"
                                :min="1"
                                :max="365"
                                class="w-full"
                            />
                        </div>
                        <div class="form-item">
                            <label>冻结原因（选填）</label>
                            <a-textarea
                                v-model:value="freezeReason"
                                :rows="3"
                                placeholder="请输入冻结原因"
                            />
                        </div>
                    </div>
                </a-modal>

                <!-- 删除弹窗 -->
                <a-modal
                    v-model:open="deleteModalVisible"
                    title="删除权益卡"
                    :width="400"
                    @cancel="deleteModalVisible = false"
                    @ok="confirmDelete"
                >
                    <div class="delete-form">
                        <p class="delete-warning">删除后将无法恢复，确定要删除吗？</p>
                        <div class="form-item">
                            <label>删除原因（选填）</label>
                            <a-textarea
                                v-model:value="deleteReason"
                                :rows="3"
                                placeholder="请输入删除原因"
                            />
                        </div>
                    </div>
                </a-modal>

                <!-- 延期弹窗 -->
                <a-modal
                    v-model:open="extendModalVisible"
                    title="延长有效期"
                    :width="400"
                    @cancel="extendModalVisible = false"
                    @ok="confirmExtend"
                >
                    <div class="extend-form">
                        <div class="form-item">
                            <label>延长天数</label>
                            <a-input-number
                                v-model:value="extendDays"
                                :min="1"
                                :max="365"
                                class="w-full"
                            />
                        </div>
                        <div class="form-item">
                            <label>延期原因（选填）</label>
                            <a-textarea
                                v-model:value="extendReason"
                                :rows="3"
                                placeholder="请输入延期原因"
                            />
                        </div>
                    </div>
                </a-modal>
            </div>
        </a-spin>
    </div>
</template>

<style scoped>
.member-rights-page {
    width: 100%;
}

.stats-card {
    display: flex;
    justify-content: space-around;
    padding: 16px;
    background: var(--color-bg-container);
    border-radius: 8px;
}

.stat-item {
    text-align: center;
}

.stat-item .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text);
}

.stat-item .stat-label {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-top: 4px;
}

.packages-container {
    margin-top: 8px;
}

.package-card {
    height: 100%;
    transition: all 0.3s;
    cursor: pointer;
}

.package-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.package-card.disabled-card {
    opacity: 0.7;
    cursor: not-allowed;
}

.package-card.disabled-card:hover {
    transform: none;
    box-shadow: none;
}

.package-header {
    margin-bottom: 12px;
}

.package-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.package-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.action-btn {
    background: transparent;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.action-btn:hover {
    background: var(--ant-color-primary-bg);
    color: var(--ant-color-primary);
}

.package-name {
    font-weight: 600;
    font-size: 14px;
    flex: 1;
}

.package-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid var(--ant-color-border-secondary);
}

.package-no {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.package-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.package-info-item {
    display: flex;
    align-items: center;
    font-size: 13px;
}

.package-info-item .info-icon {
    margin-right: 6px;
    color: var(--color-text-secondary);
}

.package-info-item .info-label {
    color: var(--color-text-secondary);
    margin-right: 6px;
}

.package-info-item .info-text {
    flex: 1;
}

.package-info-item .info-value {
    flex: 1;
}

.detail-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
}

.detail-no {
    margin-left: auto;
    font-size: 12px;
    color: var(--color-text-secondary);
}

.usage-bar {
    width: 100%;
}

.usage-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
}

.usage-progress {
    width: 100%;
    height: 8px;
    background: var(--ant-color-border-secondary);
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: var(--ant-color-primary);
    transition: width 0.3s;
}

.sub-packages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.sub-package-item {
    padding: 12px;
    background: var(--color-bg-container);
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: 8px;
    transition: all 0.3s;
}

.sub-package-item.cursor-pointer {
    cursor: pointer;
}

.sub-package-item.cursor-pointer:hover {
    background: var(--ant-color-primary-bg);
    border-color: var(--ant-color-primary);
    transform: translateX(4px);
}

.sub-package-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.sub-package-name {
    font-weight: 500;
    font-size: 14px;
}

.sub-package-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
}

.sub-package-hint {
    margin-top: 8px;
    font-size: 12px;
    color: var(--ant-color-primary);
    text-align: right;
}

.remark-text {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
}

.text-success {
    color: #52c41a;
}

.text-red-500 {
    color: #ff4d4f;
}

.freeze-form,
.delete-form {
    padding: 16px 0;
}

.form-item {
    margin-bottom: 16px;
}

.form-item label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    font-size: 14px;
}

.delete-warning {
    color: #ff4d4f;
    margin-bottom: 16px;
    font-weight: 500;
}
</style>
