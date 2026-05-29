<template>
    <div class="booking-detail-page">
        <a-card :bordered="false" class="detail-card">
            <template #title>
                <div class="card-header">
                    <a-button type="link" @click="handleBack">← 返回</a-button>
                    <span class="card-title">预约详情</span>
                    <a-tag :color="getStatusColor(bookingDetail?.status)" class="ml-2">
                        {{ getStatusText(bookingDetail?.status) }}
                    </a-tag>
                </div>
            </template>

            <a-spin :spinning="loading">
                <template v-if="bookingDetail">
                    <a-descriptions :column="2" bordered class="mb-6">
                        <a-descriptions-item label="预约编号">
                            {{ bookingDetail.bookingNo || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="预约状态">
                            <a-tag :color="getStatusColor(bookingDetail.status)">
                                {{ getStatusText(bookingDetail.status) }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="会员姓名">
                            {{ bookingDetail.member?.name || bookingDetail.memberName || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="会员手机号">
                            {{ bookingDetail.member?.phone || bookingDetail.memberPhone || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="场馆名称">
                            {{ bookingDetail.venue.name || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="教练姓名">
                            {{ bookingDetail.coach.name || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="权益卡名称">
                            {{ bookingDetail.packageInfo.name || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="预约日期">
                            {{ bookingDetail.bookingDate || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="开始时间">
                            {{ bookingDetail.startTime?.substring(0, 8) || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="结束时间">
                            {{ bookingDetail.endTime?.substring(0, 8) || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="课程时长(分钟)">
                            {{ bookingDetail.courseDuration || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item label="备注">
                            {{ bookingDetail.remark || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item v-if="bookingDetail.cancelReason" label="取消原因">
                            {{ bookingDetail.cancelReason }}
                        </a-descriptions-item>
                        <a-descriptions-item label="创建时间">
                            {{ bookingDetail.createdAt || '-' }}
                        </a-descriptions-item>
                        <a-descriptions-item v-if="bookingDetail.updatedAt" label="更新时间">
                            {{ bookingDetail.updatedAt }}
                        </a-descriptions-item>
                    </a-descriptions>

                    <a-divider/>

                    <div class="action-buttons">
                        <a-space>
                            <a-button @click="handleBack">返回列表</a-button>
                            <a-button v-if="bookingDetail.status === 1" type="primary" @click="handleConfirm">
                                确认预约
                            </a-button>
                            <a-button
                                v-if="bookingDetail.status === 1 || bookingDetail.status === 2"
                                danger
                                @click="handleCancel"
                            >
                                取消预约
                            </a-button>
                        </a-space>
                    </div>
                </template>
            </a-spin>
        </a-card>

        <!-- 取消预约弹窗 -->
        <a-modal
            v-model:open="cancelModalVisible"
            title="取消预约"
            :footer="null"
            @cancel="cancelModalVisible = false"
        >
            <a-form layout="vertical">
                <a-form-item label="取消原因" required>
                    <a-textarea
                        v-model:value="cancelReason"
                        :rows="3"
                        placeholder="请输入取消原因"
                    />
                </a-form-item>
            </a-form>
            <div class="modal-footer">
                <a-button @click="cancelModalVisible = false">取消</a-button>
                <a-button type="primary" danger @click="confirmCancel">确认取消</a-button>
            </div>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    Descriptions as ADescriptions,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    message,
    Modal as AModal,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
} from 'ant-design-vue';

import {
    type BookingDetailVO,
    type BookingStatus,
    cancelAdminBookingApi,
    getAdminBookingDetailApi,
    updateAdminBookingStatusApi,
} from '#/api/booking/bookings';

const ATextarea = AInput.TextArea;

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const bookingDetail = ref<BookingDetailVO | null>(null);
const cancelModalVisible = ref(false);
const cancelReason = ref('');

function getStatusText(status: BookingStatus | number | undefined): string {
    if (!status) return '-';
    const statusMap: Record<number, string> = {
        1: '已预约/待确认',
        2: '已确认',
        3: '进行中',
        9: '已取消',
    };
    return statusMap[status] || '-';
}

function getStatusColor(status: BookingStatus | number | undefined): string {
    if (!status) return 'default';
    const colorMap: Record<number, string> = {
        1: 'orange',
        2: 'blue',
        3: 'green',
        9: 'red',
    };
    return colorMap[status] || 'default';
}

async function fetchDetail(id: string) {
    loading.value = true;
    try {
        debugger
        bookingDetail.value = await getAdminBookingDetailApi(id);
    } catch (e: any) {
        await message.error(e?.message || '获取预约详情失败');
        bookingDetail.value = null;
    } finally {
        loading.value = false;
    }
}

function handleBack() {
    router.push({name: 'CourseBookingList'});
}

async function handleConfirm() {
    if (!bookingDetail.value?.bookingId) return;

    try {
        await updateAdminBookingStatusApi({
            bookingId: bookingDetail.value.bookingId,
            status: 2,
        });
        message.success('预约已确认');
        bookingDetail.value.status = 2;
    } catch (e: any) {
        message.error(e?.message || '确认预约失败');
    }
}

function handleCancel() {
    cancelModalVisible.value = true;
}

async function confirmCancel() {
    if (!bookingDetail.value?.bookingId || !cancelReason.value.trim()) {
        message.error('请输入取消原因');
        return;
    }

    try {
        await cancelAdminBookingApi({
            bookingId: bookingDetail.value.bookingId,
            reason: cancelReason.value,
        });
        message.success('预约已取消');
        cancelModalVisible.value = false;
        bookingDetail.value.status = 9;
        bookingDetail.value.cancelReason = cancelReason.value;
        cancelReason.value = '';
    } catch (e: any) {
        message.error(e?.message || '取消预约失败');
    }
}

function getCurrentRouteId(): string | null {
    const id = route.params.id;
    return id == null ? null : String(id);
}

function loadByRoute() {
    const id = getCurrentRouteId();
    if (!id) {
        bookingDetail.value = null;
        return;
    }
    fetchDetail(id);
}

onMounted(loadByRoute);
</script>

<style scoped>
.booking-detail-page {
    padding: 16px;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.card-title {
    font-size: 18px;
    font-weight: 600;
}

.action-buttons {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
}
</style>
