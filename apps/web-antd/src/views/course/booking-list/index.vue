<template>
    <div class="booking-list-page">
        <a-card :bordered="false">
            <template #title>
                <div class="page-title">
                    <span>预约管理</span>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="fetchBookingList">刷新</a-button>
                </a-space>
            </template>

            <a-form class="filter-form" layout="vertical" :model="queryForm">
                <a-row :gutter="16">
                    <a-col :xs="24" :sm="12" :md="8" :lg="6">
                        <a-form-item label="预约编号/会员">
                            <a-input
                                v-model:value="queryForm.keyword"
                                allow-clear
                                placeholder="请输入预约编号/会员姓名/手机号"
                                @press-enter="handleSearch"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="状态">
                            <a-select
                                v-model:value="queryForm.status"
                                allow-clear
                                placeholder="全部"
                            >
                                <a-select-option :value="1">待确认</a-select-option>
                                <a-select-option :value="2">已确认</a-select-option>
                                <a-select-option :value="3">已签到</a-select-option>
                                <a-select-option :value="4">已完成</a-select-option>
                                <a-select-option :value="5">已取消</a-select-option>
                                <a-select-option :value="6">爽约</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="场馆">
                            <a-select
                                v-model:value="queryForm.venueId"
                                allow-clear
                                placeholder="全部"
                            >
                                <a-select-option
                                    v-for="venue in venueOptions"
                                    :key="venue.value"
                                    :value="venue.value"
                                >
                                    {{ venue.label }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="6">
                        <a-form-item label="日期范围">
                            <a-range-picker
                                v-model:value="dateRange"
                                format="YYYY-MM-DD"
                                :placeholder="['开始日期', '结束日期']"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="24" :md="24" :lg="8">
                        <a-form-item label=" ">
                            <a-space>
                                <a-button type="primary" @click="handleSearch">
                                    查询
                                </a-button>
                                <a-button @click="handleReset">
                                    重置
                                </a-button>
                            </a-space>
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>

            <a-table
                row-key="bookingId"
                :loading="loading"
                :columns="columns"
                :data-source="bookingList"
                :pagination="pagination"
                :scroll="{ x: 1400 }"
                @change="handleTableChange"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'bookingNo'">
                        <a-button type="link" @click="handleDetail(record)">
                            {{ record.bookingNo }}
                        </a-button>
                    </template>

                    <template v-else-if="column.key === 'member'">
                        <div class="member-cell">
                            <div class="member-avatar-wrapper">
                                <a-skeleton-avatar
                                    v-if="isAvatarLoading(record.member?.avatar)"
                                    active
                                    size="small"
                                />

                                <a-avatar
                                    v-else
                                    size="small"
                                    :src="getAvatarPreviewUrl(record.member?.avatar)"
                                >
                                    {{ getMemberAvatarText(record) }}
                                </a-avatar>
                            </div>

                            <div class="member-info">
                                <div class="member-name">
                                    {{ record.member?.name || '-' }}
                                </div>
                                <div class="member-phone">
                                    {{ record.memberPhone || '-' }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'bookingTime'">
                        <div class="time-cell">
                            <div>{{ record.bookingDate || '-' }}</div>
                            <div>
                                {{ record.startTime?.substring(0, 5) || '-' }}
                                -
                                {{ record.endTime?.substring(0, 5) || '-' }}
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'status'">
                        <a-tag :color="getStatusColor(record.status)">
                            {{ getStatusText(record.status) }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <a-space>
                            <a-button
                                type="link"
                                size="small"
                                @click="handleDetail(record)"
                            >
                                详情
                            </a-button>
                            <a-button
                                v-if="record.status === 6"
                                type="link"
                                size="small"
                                danger
                                @click="handleCancelNoShow(record)"
                            >
                                解除爽约
                            </a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </a-card>

        <!-- 解除爽约弹窗 -->
        <a-modal
            v-model:open="cancelNoShowModalVisible"
            title="解除爽约"
            :confirm-loading="cancelNoShowLoading"
            @ok="handleConfirmCancelNoShow"
            @cancel="handleCancelNoShowModalClose"
        >
            <div class="cancel-noshow-modal-content">
                <div class="info-row">
                    <span class="label">预约编号：</span>
                    <span class="value">{{ currentNoShowRecord?.bookingNo || '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">会员姓名：</span>
                    <span class="value">{{ currentNoShowRecord?.member?.name || currentNoShowRecord?.memberName || '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">预约时间：</span>
                    <span class="value">{{ currentNoShowRecord?.bookingDate }} {{ currentNoShowRecord?.startTime }}</span>
                </div>

                <a-divider />

                <div class="warning-box">
                    <span class="warning-icon">⚠️</span>
                    <div class="warning-text">
                        <p><strong>操作提示</strong></p>
                        <p>此操作将解除该预约的爽约状态，并恢复用户的权益（如扣减的课程次数）。</p>
                        <p>请确保用户已提供合理的理由，并在下方填写原因说明。</p>
                    </div>
                </div>

                <a-form-item label="解除原因" required style="margin-top: 16px;">
                    <a-textarea
                        v-model:value="cancelNoShowReason"
                        :rows="3"
                        placeholder="请输入解除爽约的原因（必填）"
                        :maxlength="200"
                        show-count
                    />
                </a-form-item>
            </div>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { Dayjs } from 'dayjs';

import {
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    Col as ACol,
    DatePicker as ADatePicker,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    Modal,
    message,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    SkeletonAvatar as ASkeletonAvatar,
    Space as ASpace,
    Table as ATable,
    Tag as ATag,
} from 'ant-design-vue';

const ATextarea = AInput.TextArea;

import {
    pageAdminBookingsNormalizedApi,
    type AdminBookingQueryDTO,
    type AdminBookingListItemVO,
    type BookingStatus,
    adminHandleNoShowApi,
    type NoShowHandleDTO,
} from '#/api/booking/bookings';
import type { NormalizedPageResult } from '#/api/_shared/page';
import { batchGetFilePreviewApi } from '#/api/file';
import { getAllVenuesApi, type VenueDetailDTO } from '#/api/venue/list';

const ARangePicker = ADatePicker.RangePicker;
const router = useRouter();

const loading = ref(false);
const bookingList = ref<AdminBookingListItemVO[]>([]);

const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
});

const queryForm = reactive<AdminBookingQueryDTO>({
    page: 1,
    pageSize: 10,
    keyword: '',
    status: undefined,
    venueId: undefined,
    startDate: undefined,
    endDate: undefined,
});

const dateRange = ref<[Dayjs, Dayjs] | []>([]);
const venueOptions = ref<Array<{ label: string; value: string }>>([]);

/**
 * 用户头像 fileId -> previewUrl。
 *
 * 注意：
 * reactive(new Map()) 可以响应 avatarPreviewMap.set/delete。
 */
const avatarPreviewMap = reactive(new Map<string, string>());

/**
 * 正在加载中的用户头像 fileId。
 *
 * 用于头像区域局部骨架屏。
 */
const avatarLoadingMap = reactive(new Set<string>());

/** 解除爽约弹窗相关状态 */
const cancelNoShowModalVisible = ref(false);
const cancelNoShowLoading = ref(false);
const currentNoShowRecord = ref<AdminBookingListItemVO | null>(null);
const cancelNoShowReason = ref('');

const columns = [
    {
        title: '预约编号',
        key: 'bookingNo',
        width: 160,
    },
    {
        title: '会员信息',
        key: 'member',
        width: 200,
    },
    {
        title: '场馆',
        dataIndex: 'venueName',
        key: 'venueName',
        width: 150,
    },
    {
        title: '教练',
        dataIndex: 'coachName',
        key: 'coachName',
        width: 100,
    },
    {
        title: '权益卡',
        dataIndex: 'packageName',
        key: 'packageName',
        width: 150,
    },
    {
        title: '预约时间',
        key: 'bookingTime',
        width: 180,
    },
    {
        title: '状态',
        key: 'status',
        width: 120,
    },
    {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 150,
    },
    {
        title: '操作',
        key: 'actions',
        width: 100,
    },
];

function getStatusText(status: BookingStatus | number | undefined): string {
    if (!status) {
        return '-';
    }

    const statusMap: Record<number, string> = {
        1: '待确认',
        2: '已确认',
        3: '已签到',
        4: '已完成',
        5: '已取消',
        6: '爽约',
    };

    return statusMap[Number(status)] || '-';
}

function getStatusColor(status: BookingStatus | number | undefined): string {
    if (!status) {
        return 'default';
    }

    const colorMap: Record<number, string> = {
        1: 'orange',
        2: 'blue',
        3: 'processing',
        4: 'success',
        5: 'default',
        6: 'error',
    };

    return colorMap[Number(status)] || 'default';
}

function formatDate(date?: Dayjs): string | undefined {
    return date ? date.format('YYYY-MM-DD') : undefined;
}

/**
 * 判断头像字段是否是 fileId。
 *
 * 规则：
 * - 空值不是 fileId；
 * - http/https 地址不是 fileId；
 * - 纯数字且大于 0 才认为是 fileId。
 */
function isFileId(value?: string | number | null): boolean {
    if (value === null || value === undefined || value === '') {
        return false;
    }

    const text = String(value);

    if (text.startsWith('http://') || text.startsWith('https://')) {
        return false;
    }

    return /^\d+$/.test(text) && Number(text) > 0;
}

/**
 * 判断当前头像是否正在加载。
 *
 * 只有 avatar 是 fileId，且还没有 previewUrl，同时处于 loadingMap 中，
 * 才显示 skeleton。
 */
function isAvatarLoading(avatar?: string | number | null): boolean {
    if (!isFileId(avatar)) {
        return false;
    }

    const fileId = String(avatar);

    return avatarLoadingMap.has(fileId) && !avatarPreviewMap.has(fileId);
}

/**
 * 获取用户头像真实渲染 URL。
 *
 * 情况：
 * - avatar 本身是 http/https：直接返回；
 * - avatar 是 fileId：从 avatarPreviewMap 获取 previewUrl；
 * - 未加载完成或没有头像：返回 undefined，让 a-avatar 显示文字兜底。
 */
function getAvatarPreviewUrl(
    avatar?: string | number | null,
): string | undefined {
    if (!avatar) {
        return undefined;
    }

    const text = String(avatar);

    if (text.startsWith('http://') || text.startsWith('https://')) {
        return text;
    }

    if (isFileId(text)) {
        return avatarPreviewMap.get(text) || undefined;
    }

    return undefined;
}

/**
 * 头像文字兜底。
 */
function getMemberAvatarText(record: AdminBookingListItemVO): string {
    const name = record.member?.name || record.memberPhone || '用';

    return String(name).slice(0, 1);
}

/**
 * 批量加载会员头像预览地址。
 *
 * 流程：
 * 1. 从主接口返回的 records 中提取 record.member.avatar；
 * 2. 判断 avatar 是否是 fileId；
 * 3. 跳过已经缓存过的 fileId；
 * 4. 标记 avatarLoadingMap，触发局部 skeleton；
 * 5. 调用 batchGetFilePreviewApi；
 * 6. 写入 avatarPreviewMap；
 * 7. 清理 avatarLoadingMap。
 */
async function loadAvatarPreviews(records: AdminBookingListItemVO[]) {
    const fileIdSet = new Set<string>();

    records.forEach((record) => {
        const avatar = record.member?.avatar;

        if (!isFileId(avatar)) {
            return;
        }

        const fileId = String(avatar);

        if (avatarPreviewMap.has(fileId)) {
            return;
        }

        fileIdSet.add(fileId);
    });

    const fileIds = [...fileIdSet];

    if (fileIds.length === 0) {
        return;
    }

    fileIds.forEach((fileId) => {
        avatarLoadingMap.add(fileId);
    });

    try {
        const previewResults = await batchGetFilePreviewApi({
            fileIds,
        });

        previewResults.forEach((item) => {
            const fileId = String(item.fileId);
            const previewUrl = item.previewUrl || item.thumbUrl || '';

            if (previewUrl) {
                avatarPreviewMap.set(fileId, previewUrl);
            }

            avatarLoadingMap.delete(fileId);
        });
    } catch (e) {
        console.error('批量获取会员头像预览失败:', e);
    } finally {
        /**
         * 防止后端没有返回某些 fileId 时 skeleton 一直显示。
         */
        fileIds.forEach((fileId) => {
            avatarLoadingMap.delete(fileId);
        });
    }
}

async function fetchBookingList() {
    loading.value = true;

    try {
        const params: AdminBookingQueryDTO = {
            ...queryForm,
            page: pagination.current,
            pageSize: pagination.pageSize,
        };

        if (dateRange.value.length === 2) {
            params.startDate = formatDate(dateRange.value[0]);
            params.endDate = formatDate(dateRange.value[1]);
        } else {
            params.startDate = undefined;
            params.endDate = undefined;
        }

        const res: NormalizedPageResult<AdminBookingListItemVO> =
            await pageAdminBookingsNormalizedApi(params);

        const records = res.list || [];

        /**
         * 第一阶段：
         * 主接口数据先赋值，表格主体先展示。
         */
        bookingList.value = records;
        pagination.total = res.total || 0;

        /**
         * 第二阶段：
         * 头像异步加载。
         *
         * 注意：
         * 这里不 await loadAvatarPreviews，
         * 避免头像接口阻塞表格主体渲染。
         */
        await nextTick();
        void loadAvatarPreviews(records);
    } catch (e: any) {
        console.error('查询预约列表失败:', e);
    } finally {
        /**
         * loading 只代表主表格数据加载状态，
         * 不代表头像加载状态。
         */
        loading.value = false;
    }
}

async function loadVenues() {
    try {
        const venues = await getAllVenuesApi();

        venueOptions.value = (venues || []).map((v: VenueDetailDTO) => ({
            label: v.name,
            value: String(v.id),
        }));
    } catch (e: any) {
        console.error('加载场馆失败:', e);
    }
}

function handleSearch() {
    pagination.current = 1;
    fetchBookingList();
}

function handleReset() {
    queryForm.keyword = '';
    queryForm.status = undefined;
    queryForm.venueId = undefined;
    queryForm.startDate = undefined;
    queryForm.endDate = undefined;

    dateRange.value = [];
    pagination.current = 1;

    fetchBookingList();
}

function handleTableChange(paginationInfo: {
    current?: number;
    pageSize?: number;
}) {
    pagination.current = paginationInfo.current || 1;
    pagination.pageSize = paginationInfo.pageSize || 10;

    fetchBookingList();
}

function handleDetail(record: AdminBookingListItemVO) {
    router.push({
        name: 'CourseBookingDetail',
        params: {
            id: record.bookingId,
        },
    });
}

/**
 * 打开解除爽约弹窗。
 * 
 * 当订单被标记为爽约（状态码 6）后，若用户提供合理理由，管理员可手动解除爽约，恢复用户权益。
 * 
 * @param record - 预约记录
 */
function handleCancelNoShow(record: AdminBookingListItemVO) {
    currentNoShowRecord.value = record;
    cancelNoShowReason.value = '';
    cancelNoShowModalVisible.value = true;
}

/** 关闭解除爽约弹窗 */
function handleCancelNoShowModalClose() {
    cancelNoShowModalVisible.value = false;
    currentNoShowRecord.value = null;
    cancelNoShowReason.value = '';
}

/** 确认解除爽约 */
async function handleConfirmCancelNoShow() {
    if (!currentNoShowRecord.value) {
        return;
    }

    // 验证原因是否填写
    if (!cancelNoShowReason.value.trim()) {
        message.warning('请输入解除爽约的原因');
        return;
    }

    cancelNoShowLoading.value = true;
    try {
        await adminHandleNoShowApi({
            bookingId: currentNoShowRecord.value.bookingId,
            handleType: 'CANCEL',  // CANCEL-取消预约（解除爽约状态）
            reason: cancelNoShowReason.value.trim(),
        });

        message.success('解除爽约成功，用户权益已恢复');
        handleCancelNoShowModalClose();
        fetchBookingList();
    } catch (error: any) {
        message.error(error?.message || '解除爽约失败');
    } finally {
        cancelNoShowLoading.value = false;
    }
}

onMounted(() => {
    loadVenues();
    fetchBookingList();
});
</script>

<style scoped>
.booking-list-page {
    padding: 16px;
}

.page-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-form {
    margin-bottom: 16px;
}

.member-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.member-avatar-wrapper {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.member-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.member-name {
    font-size: 14px;
    font-weight: 500;
}

.member-phone {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.time-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

/* 解除爽约弹窗样式 */
.cancel-noshow-modal-content {
    padding: 8px 0;
}

.cancel-noshow-modal-content .info-row {
    display: flex;
    margin-bottom: 8px;
}

.cancel-noshow-modal-content .label {
    color: var(--color-text-secondary);
    min-width: 80px;
}

.cancel-noshow-modal-content .value {
    color: var(--color-text);
    font-weight: 500;
}

.cancel-noshow-modal-content .warning-box {
    display: flex;
    padding: 12px 16px;
    border-radius: 8px;
    background: var(--color-warning-bg, #fffbe6);
    border: 1px solid var(--color-warning, #faad14);
    margin-bottom: 16px;
}

.cancel-noshow-modal-content .warning-icon {
    font-size: 20px;
    margin-right: 12px;
    flex-shrink: 0;
}

.cancel-noshow-modal-content .warning-text {
    flex: 1;
}

.cancel-noshow-modal-content .warning-text p {
    margin: 0;
    line-height: 1.6;
}

.cancel-noshow-modal-content .warning-text p:first-child {
    margin-bottom: 4px;
}
</style>
