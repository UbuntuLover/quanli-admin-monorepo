<template>
    <div class="p-4">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <div class="text-base font-semibold">教练离职审批</div>
                        <div class="mt-1 text-xs font-normal text-gray-400">
                            查看教练离职申请，并进行审批通过或驳回处理
                        </div>
                    </div>

                    <a-space wrap>
                        <a-input
                            v-model:value="searchForm.keyword"
                            allow-clear
                            style="width: 260px"
                            placeholder="请输入教练姓名/手机号"
                            @pressEnter="handleSearch"
                        />

                        <a-select
                            v-model:value="searchForm.applyStatus"
                            :options="statusFilterOptions"
                            allow-clear
                            style="width: 150px"
                            placeholder="申请状态"
                            @change="handleSearch"
                        />

                        <a-button type="primary" :loading="loading" @click="handleSearch">搜索</a-button>
                        <a-button :loading="loading" @click="handleResetSearch">重置</a-button>

                        <a-tag v-if="ENABLE_MOCK" color="orange">Mock 模式</a-tag>
                        <a-button v-if="ENABLE_MOCK" @click="switchMockData(false)">模拟有数据</a-button>
                        <a-button v-if="ENABLE_MOCK" @click="switchMockData(true)">模拟空数据</a-button>

                        <a-button :loading="loading" @click="fetchList">刷新</a-button>
                    </a-space>
                </div>
            </template>

            <a-alert
                v-if="ENABLE_MOCK"
                class="mb-4"
                message="当前页面正在使用 Mock 数据，用于验证页面效果。接入真实接口时，请将 ENABLE_MOCK 改为 false。"
                show-icon
                type="warning"
            />

            <a-table
                v-if="loading || hasApplications"
                :columns="columns"
                :data-source="applicationList"
                :loading="loading"
                :pagination="false"
                :row-key="(record) => record.id"
                bordered
                size="middle"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'coachInfo'">
                        <div class="font-medium">{{ record.coachName || '-' }}</div>
                        <div class="text-xs text-gray-400">{{ record.coachPhone || '-' }}</div>
                    </template>

                    <template v-else-if="column.key === 'reason'">
                        <div class="line-clamp-2 max-w-[300px]">{{ record.reason || '-' }}</div>
                    </template>

                    <template v-else-if="column.key === 'applyStatus'">
                        <a-tag :color="getStatusColor(record.applyStatus)">
                            {{ formatApplyStatus(record.applyStatus) }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.key === 'expectedResignDate'">
                        {{ record.expectedResignDate || '-' }}
                    </template>

                    <template v-else-if="column.key === 'createdAt'">
                        {{ formatDateTime(record.createdAt) }}
                    </template>

                    <template v-else-if="column.key === 'approvedAt'">
                        {{ formatDateTime(record.approvedAt) }}
                    </template>

                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" @click="openDetail(record)">详情</a-button>

                            <a-button :disabled="!canApprove(record)" type="link" @click="handleApprove(record)">
                                通过
                            </a-button>

                            <a-button :disabled="!canReject(record)" danger type="link" @click="openRejectModal(record)">
                                驳回
                            </a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <div v-if="hasApplications" class="mt-4 flex justify-end">
                <a-pagination
                    v-model:current="pagination.current"
                    v-model:page-size="pagination.pageSize"
                    :total="pagination.total"
                    :show-size-changer="true"
                    :show-total="(total:number)=>`共 ${total} 条`"
                    @change="handlePageChange"
                    @showSizeChange="handlePageSizeChange"
                />
            </div>

            <div
                v-else-if="!loading"
                class="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-12"
            >
                <a-empty :description="searchForm.keyword || searchForm.applyStatus ? '未找到匹配申请' : '暂无教练离职申请'" />
                <div class="mt-6 flex items-center gap-3">
                    <a-button :loading="loading" type="primary" @click="fetchList">重新查询</a-button>
                    <a-button @click="handleResetSearch">清空筛选条件</a-button>
                </div>
            </div>
        </a-card>

        <a-drawer
            v-model:open="detailVisible"
            :destroy-on-close="true"
            :width="720"
            title="离职申请详情"
        >
            <a-spin :spinning="detailLoading">
                <a-empty v-if="!currentDetail && !detailLoading" description="暂无详情" />

                <template v-if="currentDetail">
                    <a-descriptions bordered :column="1" size="small">
                        <a-descriptions-item label="申请 ID">{{ currentDetail.id }}</a-descriptions-item>
                        <a-descriptions-item label="申请编号">{{ currentDetail.applicationNo || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="教练姓名">{{ currentDetail.coachName || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="手机号">{{ currentDetail.coachPhone || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="离职原因">
                            <div class="whitespace-pre-wrap">{{ currentDetail.reason || '-' }}</div>
                        </a-descriptions-item>
                        <a-descriptions-item label="期望离职日期">{{ currentDetail.expectedResignDate || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="申请状态">
                            <a-tag :color="getStatusColor(currentDetail.applyStatus)">
                                {{ formatApplyStatus(currentDetail.applyStatus) }}
                            </a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="审批备注">
                            <div class="whitespace-pre-wrap">{{ currentDetail.approveRemark || '-' }}</div>
                        </a-descriptions-item>
                        <a-descriptions-item label="审批人用户 ID">{{ currentDetail.approverUserId || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="审批时间">{{ formatDateTime(currentDetail.approvedAt) }}</a-descriptions-item>
                        <a-descriptions-item label="申请时间">{{ formatDateTime(currentDetail.createdAt) }}</a-descriptions-item>
                    </a-descriptions>

                    <div class="mt-5 flex justify-end gap-2">
                        <a-button @click="detailVisible = false">关闭</a-button>
                        <a-button v-if="canApprove(currentDetail)" type="primary" @click="handleApprove(currentDetail)">审批通过</a-button>
                        <a-button v-if="canReject(currentDetail)" danger @click="openRejectModal(currentDetail)">驳回申请</a-button>
                    </div>
                </template>
            </a-spin>
        </a-drawer>

        <a-modal
            v-model:open="rejectVisible"
            :confirm-loading="rejectLoading"
            :destroy-on-close="true"
            title="驳回离职申请"
            ok-text="确认驳回"
            cancel-text="取消"
            @ok="submitReject"
        >
            <a-form layout="vertical">
                <a-form-item label="驳回对象">
                    <a-input :value="currentRejectRecordName" disabled />
                </a-form-item>
                <a-form-item label="驳回备注" required>
                    <a-textarea
                        v-model:value="rejectForm.approveRemark"
                        :maxlength="300"
                        :rows="5"
                        placeholder="请输入驳回备注，例如：请先完成会员交接后再提交离职申请。"
                        show-count
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';
import type { CoachResignationVO } from '#/api/coach/resignation';

import { computed, onMounted, reactive, ref } from 'vue';
import {
    Alert as AAlert,
    Button as AButton,
    Card as ACard,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    Drawer as ADrawer,
    Empty as AEmpty,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    Modal as AModal,
    Pagination as APagination,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Table as ATable,
    Tag as ATag,
    Textarea as ATextarea,
    message,
    Modal,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
    approveCoachResignationApi,
    getCoachResignationDetailApi,
    listCoachResignationsApi,
    rejectCoachResignationApi,
} from '#/api/coach/resignation';

defineOptions({ name: 'CoachResignationApproval' });

const ENABLE_MOCK = true;
const mockEmptyMode = ref(false);

const loading = ref(false);
const detailLoading = ref(false);
const rejectLoading = ref(false);

const detailVisible = ref(false);
const rejectVisible = ref(false);

const applicationList = ref<CoachResignationVO[]>([]);
const currentDetail = ref<CoachResignationVO | null>(null);
const currentRejectRecord = ref<CoachResignationVO | null>(null);

const rejectForm = reactive({ approveRemark: '' });

const searchForm = reactive({
    keyword: '',
    applyStatus: undefined as string | undefined,
});

const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
});

const statusFilterOptions = [
    { label: '全部状态', value: undefined },
    { label: '待审批', value: 'PENDING' },
    { label: '已通过', value: 'APPROVED' },
    { label: '已驳回', value: 'REJECTED' },
    { label: '已取消', value: 'CANCELLED' },
];

const hasApplications = computed(() => applicationList.value.length > 0);

const mockResignationApplications: CoachResignationVO[] = [
    {
        id: 1,
        applicationNo: 'RESIGN202605100001',
        coachId: 101,
        coachName: '张伟',
        coachPhone: '13800000001',
        reason: '个人职业规划调整，计划转型发展。',
        expectedResignDate: '2026-05-25',
        applyStatus: 'PENDING',
        approverUserId: null,
        approveRemark: null,
        approvedAt: null,
        cancelledAt: null,
        createdAt: '2026-05-10T09:20:00',
    },
    {
        id: 2,
        applicationNo: 'RESIGN202605090003',
        coachId: 102,
        coachName: '李娜',
        coachPhone: '13800000002',
        reason: '家庭原因，无法继续全职排班。',
        expectedResignDate: '2026-05-20',
        applyStatus: 'REJECTED',
        approverUserId: 1,
        approveRemark: '请先完成会员课程交接后再提交。',
        approvedAt: '2026-05-09T18:10:00',
        cancelledAt: null,
        createdAt: '2026-05-09T10:00:00',
    },
    {
        id: 3,
        applicationNo: 'RESIGN202605080002',
        coachId: 103,
        coachName: '王强',
        coachPhone: '13800000003',
        reason: '长期异地通勤，申请离职。',
        expectedResignDate: '2026-05-18',
        applyStatus: 'APPROVED',
        approverUserId: 1,
        approveRemark: '已完成交接，同意离职。',
        approvedAt: '2026-05-08T16:30:00',
        cancelledAt: null,
        createdAt: '2026-05-08T09:30:00',
    },
];

const columns: TableColumnsType<CoachResignationVO> = [
    { title: '申请编号', dataIndex: 'applicationNo', key: 'applicationNo', width: 190 },
    { title: '教练信息', key: 'coachInfo', width: 170 },
    { title: '离职原因', key: 'reason', width: 320 },
    { title: '期望离职日期', key: 'expectedResignDate', width: 140 },
    { title: '申请状态', key: 'applyStatus', width: 120 },
    { title: '申请时间', key: 'createdAt', width: 180 },
    { title: '审批时间', key: 'approvedAt', width: 180 },
    { title: '操作', key: 'action', width: 210, fixed: 'right' },
];

const currentRejectRecordName = computed(() => {
    if (!currentRejectRecord.value) return '-';
    return (
        currentRejectRecord.value.coachName ||
        currentRejectRecord.value.coachPhone ||
        `申请 ID：${currentRejectRecord.value.id}`
    );
});

function sleep(time = 500) {
    return new Promise((resolve) => window.setTimeout(resolve, time));
}

function normalizeKeyword(value?: string) {
    return String(value || '').trim().toLowerCase();
}
function normalizeStatus(status?: string | null) {
    return String(status || '').toUpperCase();
}

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const date = dayjs(value);
    if (!date.isValid()) return value;
    return date.format('YYYY-MM-DD HH:mm');
}

function formatApplyStatus(status?: string | null) {
    const map: Record<string, string> = {
        PENDING: '待审批',
        APPROVED: '已通过',
        REJECTED: '已驳回',
        CANCELLED: '已取消',
    };
    return map[normalizeStatus(status)] || status || '-';
}

function getStatusColor(status?: string | null) {
    const map: Record<string, string> = {
        PENDING: 'processing',
        APPROVED: 'success',
        REJECTED: 'error',
        CANCELLED: 'default',
    };
    return map[normalizeStatus(status)] || 'processing';
}

function canApprove(record: CoachResignationVO) {
    return normalizeStatus(record.applyStatus) === 'PENDING';
}
function canReject(record: CoachResignationVO) {
    return normalizeStatus(record.applyStatus) === 'PENDING';
}

function handleSearch() {
    pagination.current = 1;
    fetchList();
}

function handleResetSearch() {
    searchForm.keyword = '';
    searchForm.applyStatus = undefined;
    pagination.current = 1;
    fetchList();
}

function switchMockData(empty: boolean) {
    mockEmptyMode.value = empty;
    pagination.current = 1;
    fetchList();
}

function filterLocal(list: CoachResignationVO[], keyword: string, applyStatus?: string) {
    const k = normalizeKeyword(keyword);
    return list.filter((item) => {
        const name = normalizeKeyword(item.coachName || '');
        const phone = normalizeKeyword(item.coachPhone || '');
        const keywordMatched = !k || name.includes(k) || phone.includes(k);
        const statusMatched = !applyStatus || normalizeStatus(item.applyStatus) === normalizeStatus(applyStatus);
        return keywordMatched && statusMatched;
    });
}

async function fetchList() {
    loading.value = true;
    try {
        const keyword = searchForm.keyword.trim();
        const applyStatus = searchForm.applyStatus;

        if (ENABLE_MOCK) {
            await sleep(350);
            const source = mockEmptyMode.value ? [] : mockResignationApplications.map((i) => ({ ...i }));
            const filtered = filterLocal(source, keyword, applyStatus);
            pagination.total = filtered.length;

            const start = (pagination.current - 1) * pagination.pageSize;
            const end = start + pagination.pageSize;
            applicationList.value = filtered.slice(start, end);
            return;
        }

        const data = await listCoachResignationsApi({
            keyword,
            applyStatus,
            page: pagination.current,
            pageSize: pagination.pageSize,
        });

        const rows = Array.isArray(data) ? data : (data?.items || []);
        const total = Array.isArray(data) ? rows.length : (data?.total || 0);

        applicationList.value = rows;
        pagination.total = total;
    } catch (error) {
        console.error('查询离职申请列表失败：', error);
    } finally {
        loading.value = false;
    }
}

function handlePageChange(page: number) {
    pagination.current = page;
    fetchList();
}

function handlePageSizeChange(_current: number, size: number) {
    pagination.pageSize = size;
    pagination.current = 1;
    fetchList();
}

async function openDetail(record: CoachResignationVO) {
    detailVisible.value = true;
    detailLoading.value = true;
    currentDetail.value = null;

    try {
        if (ENABLE_MOCK) {
            await sleep(200);
            currentDetail.value = { ...record };
            return;
        }
        currentDetail.value = await getCoachResignationDetailApi(record.id);
    } catch (error) {
        console.error('查询离职申请详情失败：', error);
    } finally {
        detailLoading.value = false;
    }
}

function handleApprove(record: CoachResignationVO) {
    Modal.confirm({
        title: '确认审批通过？',
        content: `确定通过教练「${record.coachName || record.coachPhone || record.id}」的离职申请吗？`,
        okText: '确认通过',
        cancelText: '取消',
        async onOk() {
            try {
                if (ENABLE_MOCK) {
                    await sleep(250);
                    applicationList.value = applicationList.value.map((item) => {
                        if (item.id !== record.id) return item;
                        return {
                            ...item,
                            applyStatus: 'APPROVED',
                            approvedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
                            approverUserId: 1,
                            approveRemark: '审批通过',
                        };
                    });
                    if (currentDetail.value?.id === record.id) {
                        currentDetail.value.applyStatus = 'APPROVED';
                        currentDetail.value.approvedAt = dayjs().format('YYYY-MM-DDTHH:mm:ss');
                        currentDetail.value.approverUserId = 1;
                        currentDetail.value.approveRemark = '审批通过';
                    }
                    message.success('Mock：审批通过成功');
                    return;
                }

                await approveCoachResignationApi(record.id);
                message.success('审批通过成功');
                detailVisible.value = false;
                currentDetail.value = null;
                await fetchList();
            } catch (error) {
                console.error('审批通过失败：', error);
            }
        },
    });
}

function openRejectModal(record: CoachResignationVO) {
    currentRejectRecord.value = record;
    rejectForm.approveRemark = '';
    rejectVisible.value = true;
}

async function submitReject() {
    if (!currentRejectRecord.value) return message.warning('请选择要驳回的申请');

    const approveRemark = rejectForm.approveRemark.trim();
    if (!approveRemark) return message.warning('请输入驳回备注');

    rejectLoading.value = true;
    try {
        if (ENABLE_MOCK) {
            await sleep(250);
            const id = currentRejectRecord.value.id;
            applicationList.value = applicationList.value.map((item) => {
                if (item.id !== id) return item;
                return {
                    ...item,
                    applyStatus: 'REJECTED',
                    approveRemark,
                    approvedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
                    approverUserId: 1,
                };
            });

            if (currentDetail.value?.id === id) {
                currentDetail.value.applyStatus = 'REJECTED';
                currentDetail.value.approveRemark = approveRemark;
                currentDetail.value.approvedAt = dayjs().format('YYYY-MM-DDTHH:mm:ss');
                currentDetail.value.approverUserId = 1;
            }

            message.success('Mock：驳回成功');
            rejectVisible.value = false;
            currentRejectRecord.value = null;
            rejectForm.approveRemark = '';
            return;
        }

        await rejectCoachResignationApi(currentRejectRecord.value.id, { approveRemark });
        message.success('驳回成功');
        rejectVisible.value = false;
        detailVisible.value = false;
        currentRejectRecord.value = null;
        currentDetail.value = null;
        rejectForm.approveRemark = '';
        await fetchList();
    } catch (error) {
        console.error('驳回失败：', error);
    } finally {
        rejectLoading.value = false;
    }
}

onMounted(() => {
    fetchList();
});
</script>
