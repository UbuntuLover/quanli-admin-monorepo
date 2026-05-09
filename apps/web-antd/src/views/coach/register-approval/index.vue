<template>
    <div class="p-4">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <div class="text-base font-semibold">教练注册审批</div>
                        <div class="mt-1 text-xs font-normal text-gray-400">
                            查看教练入驻申请，并进行审批通过或驳回处理
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

                        <a-button type="primary" :loading="loading" @click="handleSearch">
                            搜索
                        </a-button>
                        <a-button :loading="loading" @click="handleResetSearch">
                            重置
                        </a-button>

                        <a-tag v-if="ENABLE_MOCK" color="orange">Mock 模式</a-tag>

                        <a-button v-if="ENABLE_MOCK" @click="switchMockData(false)">
                            模拟有数据
                        </a-button>

                        <a-button v-if="ENABLE_MOCK" @click="switchMockData(true)">
                            模拟空数据
                        </a-button>

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
                :pagination="pagination"
                :row-key="(record) => record.id"
                :scroll="{ x: 1500 }"
                bordered
                size="middle"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'avatar'">
                        <a-avatar v-if="record.avatar" :size="42" :src="record.avatar" />
                        <a-avatar v-else :size="42">
                            {{ record.name?.slice(0, 1) || '教' }}
                        </a-avatar>
                    </template>

                    <template v-else-if="column.key === 'name'">
                        <div class="font-medium">{{ record.name || '-' }}</div>
                        <div class="text-xs text-gray-400">{{ record.phone || '-' }}</div>
                    </template>

                    <template v-else-if="column.key === 'gender'">
                        {{ formatGender(record.gender) }}
                    </template>

                    <template v-else-if="column.key === 'specialties'">
                        <a-space v-if="record.specialties?.length" wrap>
                            <a-tag v-for="item in record.specialties" :key="item" color="blue">
                                {{ item }}
                            </a-tag>
                        </a-space>
                        <span v-else>-</span>
                    </template>

                    <template v-else-if="column.key === 'tags'">
                        <a-space v-if="record.tags?.length" wrap>
                            <a-tag v-for="item in record.tags" :key="item" color="purple">
                                {{ item }}
                            </a-tag>
                        </a-space>
                        <span v-else>-</span>
                    </template>

                    <template v-else-if="column.key === 'applyStatus'">
                        <a-tag :color="getStatusColor(record.applyStatus)">
                            {{ formatApplyStatus(record.applyStatus) }}
                        </a-tag>
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

                            <a-button
                                :disabled="!canApprove(record)"
                                type="link"
                                @click="handleApprove(record)"
                            >
                                通过
                            </a-button>

                            <a-button
                                :disabled="!canReject(record)"
                                danger
                                type="link"
                                @click="openRejectModal(record)"
                            >
                                驳回
                            </a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <div
                v-else
                class="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-12 dark:border-gray-700 dark:bg-gray-900"
            >
                <a-empty :description="searchForm.keyword || searchForm.applyStatus ? '未找到匹配申请' : '暂无教练注册申请'">
                    <template #image>
                        <div
                            class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-4xl dark:bg-blue-950"
                        >
                            🧘
                        </div>
                    </template>
                </a-empty>

                <div class="mt-4 max-w-md text-center text-sm leading-6 text-gray-500">
                    <template v-if="searchForm.keyword || searchForm.applyStatus">
                        未查询到符合当前筛选条件的教练申请，请调整关键词或状态后重试。
                    </template>
                    <template v-else>
                        当前没有待处理的教练入驻申请。新教练提交注册资料后，会显示在这里，管理员可以进行查看、通过或驳回处理。
                    </template>
                </div>

                <div class="mt-6 flex items-center gap-3">
                    <a-button :loading="loading" type="primary" @click="fetchList">
                        重新查询
                    </a-button>

                    <a-button @click="handleResetSearch">清空筛选条件</a-button>

                    <a-button v-if="ENABLE_MOCK" @click="switchMockData(false)">
                        加载 Mock 申请
                    </a-button>
                </div>
            </div>
        </a-card>

        <a-drawer
            v-model:open="detailVisible"
            :destroy-on-close="true"
            :width="780"
            title="教练申请详情"
        >
            <a-spin :spinning="detailLoading">
                <a-empty v-if="!currentDetail && !detailLoading" description="暂无详情" />

                <template v-if="currentDetail">
                    <div class="mb-4 flex items-center gap-4">
                        <a-avatar v-if="currentDetail.avatar" :size="72" :src="currentDetail.avatar" />
                        <a-avatar v-else :size="72">
                            {{ currentDetail.name?.slice(0, 1) || '教' }}
                        </a-avatar>

                        <div>
                            <div class="text-lg font-semibold">{{ currentDetail.name || '-' }}</div>
                            <div class="mt-1 text-sm text-gray-500">{{ currentDetail.phone || '-' }}</div>
                            <div class="mt-2">
                                <a-tag :color="getStatusColor(currentDetail.applyStatus)">
                                    {{ formatApplyStatus(currentDetail.applyStatus) }}
                                </a-tag>
                            </div>
                        </div>
                    </div>

                    <a-descriptions bordered :column="1" size="small">
                        <a-descriptions-item label="申请 ID">{{ currentDetail.id }}</a-descriptions-item>
                        <a-descriptions-item label="申请编号">{{ currentDetail.applicationNo || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="姓名">{{ currentDetail.name || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="手机号">{{ currentDetail.phone || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="性别">{{ formatGender(currentDetail.gender) }}</a-descriptions-item>
                        <a-descriptions-item label="生日">{{ currentDetail.birthday || '-' }}</a-descriptions-item>
                        <a-descriptions-item label="雇佣类型">{{ formatEmploymentType(currentDetail.employmentType) }}</a-descriptions-item>
                        <a-descriptions-item label="申请状态">
                            <a-tag :color="getStatusColor(currentDetail.applyStatus)">
                                {{ formatApplyStatus(currentDetail.applyStatus) }}
                            </a-tag>
                        </a-descriptions-item>

                        <a-descriptions-item label="证书">
                            <a-space v-if="currentDetail.certificates?.length" wrap>
                                <a-tag v-for="item in currentDetail.certificates" :key="item" color="green">
                                    {{ item }}
                                </a-tag>
                            </a-space>
                            <span v-else>-</span>
                        </a-descriptions-item>

                        <a-descriptions-item label="擅长项目">
                            <a-space v-if="currentDetail.specialties?.length" wrap>
                                <a-tag v-for="item in currentDetail.specialties" :key="item" color="blue">
                                    {{ item }}
                                </a-tag>
                            </a-space>
                            <span v-else>-</span>
                        </a-descriptions-item>

                        <a-descriptions-item label="教练标签">
                            <a-space v-if="currentDetail.tags?.length" wrap>
                                <a-tag v-for="item in currentDetail.tags" :key="item" color="purple">
                                    {{ item }}
                                </a-tag>
                            </a-space>
                            <span v-else>-</span>
                        </a-descriptions-item>

                        <a-descriptions-item label="申请场馆 ID">
                            <a-space v-if="currentDetail.applyVenueIds?.length" wrap>
                                <a-tag v-for="item in currentDetail.applyVenueIds" :key="item">
                                    {{ item }}
                                </a-tag>
                            </a-space>
                            <span v-else>-</span>
                        </a-descriptions-item>

                        <a-descriptions-item label="个人介绍">
                            <div class="whitespace-pre-wrap">{{ currentDetail.introduction || '-' }}</div>
                        </a-descriptions-item>

                        <a-descriptions-item label="教练照片">
                            <a-image-preview-group v-if="currentDetail.photos?.length">
                                <a-space wrap>
                                    <a-image
                                        v-for="photo in currentDetail.photos"
                                        :key="photo"
                                        :src="photo"
                                        :width="100"
                                    />
                                </a-space>
                            </a-image-preview-group>
                            <span v-else>-</span>
                        </a-descriptions-item>

                        <a-descriptions-item label="驳回原因">
                            <span class="text-red-500">{{ currentDetail.rejectReason || '-' }}</span>
                        </a-descriptions-item>

                        <a-descriptions-item label="审批人用户 ID">
                            {{ currentDetail.approverUserId || '-' }}
                        </a-descriptions-item>

                        <a-descriptions-item label="审批时间">
                            {{ formatDateTime(currentDetail.approvedAt) }}
                        </a-descriptions-item>

                        <a-descriptions-item label="关联教练 ID">
                            {{ currentDetail.linkedCoachId || '-' }}
                        </a-descriptions-item>

                        <a-descriptions-item label="备注">
                            <div class="whitespace-pre-wrap">{{ currentDetail.remark || '-' }}</div>
                        </a-descriptions-item>

                        <a-descriptions-item label="申请时间">
                            {{ formatDateTime(currentDetail.createdAt) }}
                        </a-descriptions-item>
                    </a-descriptions>

                    <div class="mt-5 flex justify-end gap-2">
                        <a-button @click="detailVisible = false">关闭</a-button>

                        <a-button
                            v-if="canApprove(currentDetail)"
                            type="primary"
                            @click="handleApprove(currentDetail)"
                        >
                            审批通过
                        </a-button>

                        <a-button
                            v-if="canReject(currentDetail)"
                            danger
                            @click="openRejectModal(currentDetail)"
                        >
                            驳回申请
                        </a-button>
                    </div>
                </template>
            </a-spin>
        </a-drawer>

        <a-modal
            v-model:open="rejectVisible"
            :confirm-loading="rejectLoading"
            :destroy-on-close="true"
            title="驳回教练申请"
            ok-text="确认驳回"
            cancel-text="取消"
            @ok="submitReject"
        >
            <a-alert
                class="mb-4"
                message="请填写明确的驳回原因，方便教练修改资料后重新提交。"
                show-icon
                type="warning"
            />

            <a-form layout="vertical">
                <a-form-item label="驳回对象">
                    <a-input :value="currentRejectRecordName" disabled />
                </a-form-item>

                <a-form-item label="驳回原因" required>
                    <a-textarea
                        v-model:value="rejectForm.rejectReason"
                        :maxlength="300"
                        :rows="5"
                        placeholder="请输入驳回原因，例如：资质材料不完整、证书图片不清晰、个人信息不完整等"
                        show-count
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';
import type { CoachApplicationVO } from '#/api/coach/application';

import { computed, onMounted, reactive, ref } from 'vue';
import {
    Alert as AAlert,
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    Drawer as ADrawer,
    Empty as AEmpty,
    Form as AForm,
    FormItem as AFormItem,
    Image as AImage,
    ImagePreviewGroup as AImagePreviewGroup,
    Input as AInput,
    Modal as AModal,
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
    approveCoachApplicationApi,
    getCoachApplicationDetailApi,
    listCoachApplicationsApi,
    rejectCoachApplicationApi,
} from '#/api/coach/application';

defineOptions({
    name: 'CoachRegisterApproval',
});

/**
 * Mock 开关：
 * ENABLE_MOCK = true  使用本地 Mock 数据
 * ENABLE_MOCK = false 使用真实后端接口
 */
const ENABLE_MOCK = true;
const mockEmptyMode = ref(false);

const loading = ref(false);
const detailLoading = ref(false);
const rejectLoading = ref(false);

const detailVisible = ref(false);
const rejectVisible = ref(false);

const applicationList = ref<CoachApplicationVO[]>([]);
const currentDetail = ref<CoachApplicationVO | null>(null);
const currentRejectRecord = ref<CoachApplicationVO | null>(null);

const rejectForm = reactive({
    rejectReason: '',
});

const searchForm = reactive({
    keyword: '',
    applyStatus: undefined as string | undefined,
});

const statusFilterOptions = [
    { label: '全部状态', value: undefined },
    { label: '待审批', value: 'PENDING' },
    { label: '审核中', value: 'REVIEWING' },
    { label: '已通过', value: 'APPROVED' },
    { label: '已驳回', value: 'REJECTED' },
];

const hasApplications = computed(() => applicationList.value.length > 0);

const pagination = {
    defaultPageSize: 10,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
};

const mockCoachApplications: CoachApplicationVO[] = [
    {
        id: 1,
        applicationNo: 'CA202605090001',
        phone: '13800000001',
        name: '张伟',
        gender: 1,
        birthday: '1992-03-16',
        avatar: '',
        certificates: ['国家健身教练职业资格证', 'CPR 急救证书'],
        specialties: ['增肌训练', '减脂塑形', '力量训练'],
        tags: ['五星好评', '私教经验丰富'],
        introduction: '拥有 8 年健身行业经验，擅长根据会员体测数据制定个性化训练计划。',
        photos: [],
        applyVenueIds: [1, 2],
        employmentType: 'FULL_TIME',
        applyStatus: 'PENDING',
        rejectReason: null,
        approverUserId: null,
        approvedAt: null,
        linkedCoachId: null,
        remark: '希望入驻核心门店。',
        createdAt: '2026-05-09T09:30:00',
    },
    {
        id: 2,
        applicationNo: 'CA202605090002',
        phone: '13800000002',
        name: '李娜',
        gender: 2,
        birthday: '1995-07-08',
        avatar: '',
        certificates: ['瑜伽教练认证', '普拉提指导认证'],
        specialties: ['瑜伽', '普拉提', '体态改善'],
        tags: ['女性塑形', '康复训练'],
        introduction: '专注女性体态改善和柔韧性训练，擅长小班课和一对一私教课程。',
        photos: [],
        applyVenueIds: [3],
        employmentType: 'PART_TIME',
        applyStatus: 'WAITING_APPROVAL',
        rejectReason: null,
        approverUserId: null,
        approvedAt: null,
        linkedCoachId: null,
        remark: '',
        createdAt: '2026-05-09T10:20:00',
    },
    {
        id: 3,
        applicationNo: 'CA202605080001',
        phone: '13800000003',
        name: '王强',
        gender: 1,
        birthday: '1989-11-22',
        avatar: '',
        certificates: ['功能性训练认证'],
        specialties: ['功能性训练', '运动康复'],
        tags: ['康复方向'],
        introduction: '曾服务多名运动损伤恢复会员，擅长基础评估和阶段性康复训练。',
        photos: [],
        applyVenueIds: [1],
        employmentType: 'COOPERATIVE',
        applyStatus: 'REJECTED',
        rejectReason: '证书图片不清晰，请重新上传资质材料。',
        approverUserId: 1,
        approvedAt: '2026-05-08T16:30:00',
        linkedCoachId: null,
        remark: '',
        createdAt: '2026-05-08T14:10:00',
    },
];

const columns: TableColumnsType<CoachApplicationVO> = [
    { title: '头像', key: 'avatar', width: 90, fixed: 'left' },
    { title: '申请编号', dataIndex: 'applicationNo', key: 'applicationNo', width: 180 },
    { title: '教练信息', key: 'name', width: 150 },
    { title: '性别', key: 'gender', width: 90 },
    { title: '擅长项目', key: 'specialties', width: 240 },
    { title: '标签', key: 'tags', width: 240 },
    {
        title: '雇佣类型',
        dataIndex: 'employmentType',
        key: 'employmentType',
        width: 130,
        customRender: ({ text }) => formatEmploymentType(text as string),
    },
    { title: '申请状态', key: 'applyStatus', width: 130 },
    { title: '申请时间', key: 'createdAt', width: 180 },
    { title: '审批时间', key: 'approvedAt', width: 180 },
    { title: '操作', key: 'action', width: 210, fixed: 'right' },
];

const currentRejectRecordName = computed(() => {
    if (!currentRejectRecord.value) return '-';
    return (
        currentRejectRecord.value.name ||
        currentRejectRecord.value.phone ||
        `申请 ID：${currentRejectRecord.value.id}`
    );
});

function sleep(time = 500) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, time);
    });
}

function switchMockData(empty: boolean) {
    mockEmptyMode.value = empty;
    fetchList();
}

function normalizeKeyword(value?: string) {
    return String(value || '').trim().toLowerCase();
}

function normalizeStatus(status?: string | null) {
    return String(status || '').toUpperCase();
}

function isStatusMatched(recordStatus?: string | null, filterStatus?: string) {
    if (!filterStatus) return true;

    const normalized = normalizeStatus(recordStatus);

    if (filterStatus === 'PENDING') {
        return ['PENDING', 'SUBMITTED', 'WAITING', 'WAITING_APPROVAL'].includes(normalized);
    }
    if (filterStatus === 'APPROVED') {
        return ['APPROVED', 'PASS', 'PASSED'].includes(normalized);
    }
    if (filterStatus === 'REJECTED') {
        return ['REJECTED', 'REJECT', 'FAILED'].includes(normalized);
    }
    if (filterStatus === 'REVIEWING') {
        return normalized === 'REVIEWING';
    }

    return normalized === filterStatus;
}

function filterByKeyword(list: CoachApplicationVO[], keyword: string, applyStatus?: string) {
    const k = normalizeKeyword(keyword);

    return list.filter((item) => {
        const name = normalizeKeyword(item.name || '');
        const phone = normalizeKeyword(item.phone || '');
        const keywordMatched = !k || name.includes(k) || phone.includes(k);
        const statusMatched = isStatusMatched(item.applyStatus, applyStatus);
        return keywordMatched && statusMatched;
    });
}

function handleSearch() {
    fetchList();
}

function handleResetSearch() {
    searchForm.keyword = '';
    searchForm.applyStatus = undefined;
    fetchList();
}

function formatGender(gender?: number | null) {
    if (gender === 1) return '男';
    if (gender === 2) return '女';
    if (gender === 0) return '未知';
    return '-';
}

function formatEmploymentType(value?: string | null) {
    if (!value) return '-';
    const normalizedValue = String(value).toUpperCase();

    const employmentTypeMap: Record<string, string> = {
        FULL_TIME: '全职',
        PART_TIME: '兼职',
        COOPERATIVE: '合作',
        CONTRACT: '签约',
    };

    return employmentTypeMap[normalizedValue] || value;
}

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const date = dayjs(value);
    if (!date.isValid()) return value;
    return date.format('YYYY-MM-DD HH:mm');
}

function formatApplyStatus(status?: string | null) {
    const normalizedStatus = normalizeStatus(status);
    const statusMap: Record<string, string> = {
        APPROVED: '已通过',
        PASS: '已通过',
        PASSED: '已通过',

        PENDING: '待审批',
        SUBMITTED: '待审批',
        WAITING: '待审批',
        WAITING_APPROVAL: '待审批',
        REVIEWING: '审核中',

        REJECT: '已驳回',
        REJECTED: '已驳回',
        FAILED: '已驳回',
    };
    return statusMap[normalizedStatus] || status || '待审批';
}

function getStatusColor(status?: string | null) {
    const normalizedStatus = normalizeStatus(status);
    const colorMap: Record<string, string> = {
        APPROVED: 'success',
        PASS: 'success',
        PASSED: 'success',

        PENDING: 'processing',
        SUBMITTED: 'processing',
        WAITING: 'processing',
        WAITING_APPROVAL: 'processing',
        REVIEWING: 'processing',

        REJECT: 'error',
        REJECTED: 'error',
        FAILED: 'error',
    };
    return colorMap[normalizedStatus] || 'processing';
}

function isPendingStatus(status?: string | null) {
    const normalizedStatus = normalizeStatus(status);
    return ['', 'PENDING', 'SUBMITTED', 'WAITING', 'WAITING_APPROVAL', 'REVIEWING'].includes(
        normalizedStatus,
    );
}

function canApprove(record: CoachApplicationVO) {
    return isPendingStatus(record.applyStatus);
}

function canReject(record: CoachApplicationVO) {
    return isPendingStatus(record.applyStatus);
}

async function fetchList() {
    loading.value = true;
    try {
        const keyword = searchForm.keyword.trim();
        const applyStatus = searchForm.applyStatus;

        if (ENABLE_MOCK) {
            await sleep();
            const source = mockEmptyMode.value
                ? []
                : mockCoachApplications.map((item) => ({ ...item }));

            applicationList.value = filterByKeyword(source, keyword, applyStatus);
            return;
        }

        // 后端未支持 keyword/applyStatus 前，先拉全量再本地过滤兜底
        const list = await listCoachApplicationsApi();
        const rows = Array.isArray(list) ? list : (list.items || []);
        applicationList.value = filterByKeyword(rows, keyword, applyStatus);

        // 后端支持后可替换为：
        // const pageData = await listCoachApplicationsApi({ keyword, applyStatus, page: 1, pageSize: 10 });
        // const rows = Array.isArray(pageData) ? pageData : (pageData.items || []);
        // applicationList.value = rows;
    } catch (error) {
        console.error('查询教练申请列表失败：', error);
    } finally {
        loading.value = false;
    }
}

async function openDetail(record: CoachApplicationVO) {
    detailVisible.value = true;
    detailLoading.value = true;
    currentDetail.value = null;

    try {
        if (ENABLE_MOCK) {
            await sleep(300);
            currentDetail.value = { ...record };
            return;
        }

        currentDetail.value = await getCoachApplicationDetailApi(record.id);
    } catch (error) {
        console.error('查询教练申请详情失败：', error);
    } finally {
        detailLoading.value = false;
    }
}

function handleApprove(record: CoachApplicationVO) {
    Modal.confirm({
        title: '确认审批通过？',
        content: `确定要通过教练「${record.name || record.phone || record.id}」的注册申请吗？`,
        okText: '确认通过',
        cancelText: '取消',
        async onOk() {
            try {
                if (ENABLE_MOCK) {
                    await sleep(300);

                    applicationList.value = applicationList.value.map((item) => {
                        if (item.id !== record.id) return item;
                        return {
                            ...item,
                            applyStatus: 'APPROVED',
                            approvedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
                            approverUserId: 1,
                        };
                    });

                    message.success('Mock：审批通过成功');
                    detailVisible.value = false;
                    currentDetail.value = null;
                    return;
                }

                await approveCoachApplicationApi(record.id);
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

function openRejectModal(record: CoachApplicationVO) {
    currentRejectRecord.value = record;
    rejectForm.rejectReason = '';
    rejectVisible.value = true;
}

async function submitReject() {
    if (!currentRejectRecord.value) {
        message.warning('请选择要驳回的申请');
        return;
    }

    const rejectReason = rejectForm.rejectReason.trim();
    if (!rejectReason) {
        message.warning('请输入驳回原因');
        return;
    }

    rejectLoading.value = true;
    try {
        if (ENABLE_MOCK) {
            await sleep(300);

            const rejectId = currentRejectRecord.value.id;
            applicationList.value = applicationList.value.map((item) => {
                if (item.id !== rejectId) return item;
                return {
                    ...item,
                    applyStatus: 'REJECTED',
                    rejectReason,
                    approvedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
                    approverUserId: 1,
                };
            });

            message.success('Mock：驳回成功');

            rejectVisible.value = false;
            detailVisible.value = false;
            currentRejectRecord.value = null;
            currentDetail.value = null;
            rejectForm.rejectReason = '';
            return;
        }

        await rejectCoachApplicationApi(currentRejectRecord.value.id, { rejectReason });
        message.success('驳回成功');

        rejectVisible.value = false;
        detailVisible.value = false;
        currentRejectRecord.value = null;
        currentDetail.value = null;
        rejectForm.rejectReason = '';

        await fetchList();
    } catch (error) {
        console.error('驳回申请失败：', error);
    } finally {
        rejectLoading.value = false;
    }
}

onMounted(() => {
    fetchList();
});
</script>
