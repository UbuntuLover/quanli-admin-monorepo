<template>
    <div class="package-template-page">
        <a-card :bordered="false">
            <template #title>
                <div class="page-title">
                    <span>权益卡模板管理</span>
                    <a-tag v-if="activeStatusCount > 0" color="blue">
                        {{ activeStatusCount }} 个在售
                    </a-tag>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="fetchTemplateList">刷新</a-button>
                    <a-button type="primary" @click="handleCreate">
                        创建权益卡模板
                    </a-button>
                </a-space>
            </template>

            <a-form class="filter-form" layout="vertical" :model="queryForm">
                <a-row :gutter="16">
                    <a-col :xs="24" :sm="12" :md="8" :lg="6">
                        <a-form-item label="模板名称">
                            <a-input
                                v-model:value="queryForm.keyword"
                                allow-clear
                                placeholder="请输入模板名称"
                                @press-enter="handleSearch"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="卡类型">
                            <a-select v-model:value="queryForm.cardType" allow-clear placeholder="全部">
                                <a-select-option value="COURSE">课程卡</a-select-option>
                                <a-select-option value="VENUE">场地卡</a-select-option>
                                <a-select-option value="COMBO">组合卡</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="状态">
                            <a-select v-model:value="queryForm.status" allow-clear placeholder="全部">
                                <a-select-option :value="1">启用</a-select-option>
                                <a-select-option :value="2">停用</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="24" :md="24" :lg="8">
                        <a-form-item label=" ">
                            <a-space>
                                <a-button type="primary" @click="handleSearch">查询</a-button>
                                <a-button @click="handleReset">重置</a-button>
                            </a-space>
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>

            <a-table
                row-key="id"
                :loading="loading"
                :columns="columns"
                :data-source="templateList"
                :pagination="pagination"
                :scroll="{ x: 1200 }"
                @change="handleTableChange"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'template'">
                        <div class="template-cell">
                            <div class="template-name" @click="handleDetail(record)">
                                {{ record.name }}
                            </div>
                            <div class="template-no">编号：{{ record.templateNo }}</div>
                            <div class="template-type">
                                <a-tag :color="getCardTypeColor(record.cardType)">
                                    {{ getCardTypeText(record.cardType) }}
                                </a-tag>
                                <a-tag v-if="record.childCount > 0" color="purple">
                                    包含{{ record.childCount }}个子卡
                                </a-tag>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'validity'">
                        <div class="validity-cell">
                            <span>{{ record.validityDays }}天</span>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'price'">
                        <div class="price-cell">
                            <div class="price-row">
                                <span class="label">原价：</span>
                                <span class="original-price">¥{{ formatMoney(record.originalPrice) }}</span>
                            </div>
                            <div class="price-row">
                                <span class="label">售价：</span>
                                <span class="selling-price">¥{{ formatMoney(record.sellingPrice) }}</span>
                            </div>
                            <div v-if="record.courseTimes" class="price-row">
                                <span class="label">次数：</span>
                                <span>{{ record.courseTimes }}次</span>
                            </div>
                            <div v-if="record.venueTimes" class="price-row">
                                <span class="label">场地：</span>
                                <span>{{ record.venueTimes }}次</span>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'status'">
                        <a-switch
                            :checked="record.status === 1"
                            checked-color="#52c41a"
                            unchecked-color="#d9d9d9"
                            checked-text="启用"
                            unchecked-text="停用"
                            @change="(checked: boolean) => handleToggleStatus(record, checked)"
                        />
                    </template>

                    <template v-else-if="column.key === 'createdAt'">
                        <div class="time-cell">{{ formatDateTime(record.createdAt) }}</div>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleDetail(record)">详情</a-button>

                            <!-- 新增：发放按钮 -->
                            <a-button
                                type="link"
                                size="small"
                                @click="openGrantModal(record)"
                            >
                                发放
                            </a-button>

                            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>

                            <a-popconfirm
                                title="确定删除该模板吗？"
                                ok-text="确定"
                                cancel-text="取消"
                                @confirm="handleDelete(record)"
                            >
                                <a-button type="link" size="small" danger>删除</a-button>
                            </a-popconfirm>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </a-card>

        <!-- 发放流程弹窗 -->
        <a-modal
            v-model:open="grantModalVisible"
            :title="`发放权益卡：${grantContext.templateName || '-'}`"
            :width="820"
            :confirm-loading="grantSubmitting"
            :mask-closable="false"
            @cancel="handleGrantCancel"
        >
            <a-steps :current="grantStepCurrent" class="grant-steps">
                <a-step title="确认发放信息" description="确认本次免费发放" />
                <a-step title="搜索并选择用户" description="手机号/昵称搜索" />
            </a-steps>

            <div class="grant-step-content">
                <!-- Step 1 -->
                <div v-if="grantStepCurrent === 0" class="grant-confirm-block">
                    <a-alert
                        type="warning"
                        show-icon
                        message="你正在执行免费发放操作"
                        description="该操作会直接向用户发放权益卡，不产生订单，请确认模板信息无误。"
                    />
                    <div class="grant-template-summary">
                        <p><strong>模板名称：</strong>{{ grantContext.templateName }}</p>
                        <p><strong>模板编号：</strong>{{ grantContext.templateNo }}</p>
                        <p><strong>卡类型：</strong>{{ getCardTypeText(grantContext.cardType || '') }}</p>
                        <p><strong>有效期：</strong>{{ grantContext.validityDays || 0 }} 天</p>
                    </div>
                </div>

                <!-- Step 2 -->
                <div v-else class="grant-user-block">
                    <a-form layout="vertical">
                        <a-row :gutter="12">
                            <a-col :span="8">
                                <a-form-item label="搜索类型">
                                    <a-select v-model:value="userSearch.type">
                                        <a-select-option value="phone">手机号</a-select-option>
                                        <a-select-option value="nickname">昵称</a-select-option>
                                    </a-select>
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="关键词">
                                    <a-input
                                        v-model:value="userSearch.keyword"
                                        allow-clear
                                        :placeholder="userSearch.type === 'phone' ? '请输入手机号' : '请输入昵称'"
                                        @press-enter="handleSearchMembers"
                                    />
                                </a-form-item>
                            </a-col>
                            <a-col :span="4">
                                <a-form-item label=" ">
                                    <a-button type="primary" block @click="handleSearchMembers" :loading="searchingUsers">
                                        搜索
                                    </a-button>
                                </a-form-item>
                            </a-col>
                        </a-row>
                    </a-form>

                    <a-table
                        size="small"
                        row-key="id"
                        :loading="searchingUsers"
                        :data-source="memberSearchResults"
                        :pagination="memberPagination"
                        :row-selection="memberRowSelection"
                        @change="handleMemberTableChange"
                    >
                        <a-table-column title="会员ID" data-index="id" key="id" width="120" />
                        <a-table-column title="手机号" data-index="phone" key="phone" width="160" />
                        <a-table-column title="昵称" data-index="nickname" key="nickname" width="140" />
                        <a-table-column title="姓名" data-index="name" key="name" width="120" />
                        <a-table-column title="会员编号" data-index="memberNo" key="memberNo" width="180" />
                        <a-table-column title="状态" key="status" width="100">
                            <template #default="{ record }">
                                <a-tag :color="record.status === 1 ? 'green' : 'orange'">
                                    {{ record.status === 1 ? '正常' : '非正常' }}
                                </a-tag>
                            </template>
                        </a-table-column>
                    </a-table>

                    <div class="selected-member" v-if="selectedMember">
                        当前选择：
                        <a-tag color="blue">
                            {{ selectedMember.nickname || selectedMember.name || '-' }}（{{ selectedMember.phone }}）
                        </a-tag>
                    </div>
                </div>
            </div>

            <template #footer>
                <a-space>
                    <a-button @click="handleGrantCancel">取消</a-button>
                    <a-button v-if="grantStepCurrent > 0" @click="grantStepCurrent = grantStepCurrent - 1">
                        上一步
                    </a-button>
                    <a-button v-if="grantStepCurrent === 0" type="primary" @click="handleGrantStepOneConfirm">
                        我已确认，下一步
                    </a-button>
                    <a-button
                        v-if="grantStepCurrent === 1"
                        type="primary"
                        :loading="grantSubmitting"
                        @click="handleGrantSubmit"
                    >
                        发放
                    </a-button>
                </a-space>
            </template>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import type { TablePaginationConfig } from 'ant-design-vue';
import type { AdminGrantPackageRequest } from '#/api/member-packages/member-packages';
import type { MemberSearchResultDTO } from '#/api/member/member';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Form as AForm,
    Input as AInput,
    message,
    Modal,
    Popconfirm as APopconfirm,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Steps as ASteps,
    Step as AStep,
    Switch as ASwitch,
    Table as ATable,
    Tag as ATag,
    Alert as AAlert,
} from 'ant-design-vue';

const AFormItem = AForm.Item;
const ASelectOption = ASelect.Option;

import {
    deletePackageTemplateApi,
    getPackageTemplateListApi,
    normalizePageResult,
    updatePackageTemplateStatusApi,
    type PackageTemplateQueryDTO,
    type PackageTemplateListDTO,
} from '#/api/template/template';

import { searchAdminMembersApi } from '#/api/member/member';
import { grantAdminMemberPackageApi } from '#/api/member-packages/member-packages';

const router = useRouter();

const loading = ref(false);
const templateList = ref<PackageTemplateListDTO[]>([]);
const total = ref(0);

const queryForm = reactive<PackageTemplateQueryDTO>({
    page: 1,
    pageSize: 10,
    keyword: undefined,
    cardType: undefined,
    status: undefined,
});

const columns = [
    { title: '模板信息', key: 'template', width: 280, fixed: 'left' },
    { title: '有效期', key: 'validity', width: 100 },
    { title: '价格信息', key: 'price', width: 180 },
    { title: '状态', key: 'status', width: 120 },
    { title: '创建时间', key: 'createdAt', width: 180 },
    { title: '操作', key: 'actions', width: 260, fixed: 'right' }, // 给发放按钮留空间
];

const pagination = computed<TablePaginationConfig>(() => ({
    current: queryForm.page,
    pageSize: queryForm.pageSize,
    total: total.value,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (value) => `共 ${value} 条`,
}));

const activeStatusCount = computed(() => templateList.value.filter((item) => item.status === 1).length);

onMounted(() => {
    fetchTemplateList();
});

async function fetchTemplateList() {
    loading.value = true;
    try {
        const res = await getPackageTemplateListApi({ ...queryForm });
        const page = normalizePageResult(res as any);

        templateList.value = (page.list || []).map((item: any) => ({
            ...item,
            id: item.id ? String(item.id) : item.id,
        }));
        total.value = page.total;
        queryForm.page = page.page;
        queryForm.pageSize = page.pageSize;
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    queryForm.page = 1;
    fetchTemplateList();
}

function handleReset() {
    queryForm.page = 1;
    queryForm.pageSize = 10;
    queryForm.keyword = undefined;
    queryForm.cardType = undefined;
    queryForm.status = undefined;
    fetchTemplateList();
}

function handleTableChange(pager: TablePaginationConfig) {
    queryForm.page = pager.current || 1;
    queryForm.pageSize = pager.pageSize || 10;
    fetchTemplateList();
}

function handleCreate() {
    router.push({ name: 'PackageTemplateTemplate' });
}

function handleDetail(record: PackageTemplateListDTO) {
    router.push({ name: 'PackageTemplateDetail', query: { id: record.id } });
}

function handleEdit(record: PackageTemplateListDTO) {
    router.push({ name: 'PackageTemplateEdit', query: { id: record.id } });
}

async function handleToggleStatus(record: PackageTemplateListDTO, checked: boolean) {
    // 你的后端 status: 1启用 2停用
    const newStatus = checked ? 1 : 2;
    try {
        await updatePackageTemplateStatusApi(record.id, newStatus);
        message.success(newStatus === 1 ? '模板已启用' : '模板已停用');
        record.status = newStatus;
        record.isOnSale = newStatus === 1 ? 1 : 0;
    } catch (e: any) {
        message.error(e?.message || '操作失败');
    }
}

async function handleDelete(record: PackageTemplateListDTO) {
    try {
        await deletePackageTemplateApi(record.id);
        message.success('删除成功');
        fetchTemplateList();
    } catch (e: any) {
        message.error(e?.message || '删除失败');
    }
}

/** =========================
 * 发放流程
 * ========================= */

const grantModalVisible = ref(false);
const grantStepCurrent = ref(0);
const grantSubmitting = ref(false);

const grantContext = reactive<{
    templateId: string;
    templateName: string;
    templateNo: string;
    cardType: string;
    validityDays: number;
}>({
    templateId: '',
    templateName: '',
    templateNo: '',
    cardType: '',
    validityDays: 0,
});

const userSearch = reactive<{
    type: 'phone' | 'nickname';
    keyword: string;
    page: number;
    pageSize: number;
}>({
    type: 'phone',
    keyword: '',
    page: 1,
    pageSize: 8,
});

const searchingUsers = ref(false);
const memberSearchResults = ref<MemberSearchResultDTO[]>([]);
const memberSearchTotal = ref(0);

const selectedMember = ref<MemberSearchResultDTO | null>(null);
const selectedMemberRowKeys = ref<string[]>([]);

const memberPagination = computed<TablePaginationConfig>(() => ({
    current: userSearch.page,
    pageSize: userSearch.pageSize,
    total: memberSearchTotal.value,
    showSizeChanger: true,
    showQuickJumper: false,
    showTotal: (v) => `共 ${v} 位用户`,
}));

const memberRowSelection = computed(() => ({
    type: 'radio' as const,
    selectedRowKeys: selectedMemberRowKeys.value,
    onChange: (keys: (number | string)[], rows: MemberSearchResultDTO[]) => {
        selectedMemberRowKeys.value = keys.map((k) => String(k));
        selectedMember.value = rows?.[0] || null;
    },
}));

function resetGrantState() {
    grantStepCurrent.value = 0;
    grantSubmitting.value = false;

    userSearch.type = 'phone';
    userSearch.keyword = '';
    userSearch.page = 1;
    userSearch.pageSize = 8;

    searchingUsers.value = false;
    memberSearchResults.value = [];
    memberSearchTotal.value = 0;

    selectedMember.value = null;
    selectedMemberRowKeys.value = [];
}

function openGrantModal(record: PackageTemplateListDTO) {
    if (record.status !== 1) {
        message.warning('模板未启用，暂不可发放');
        return;
    }

    grantContext.templateId = String(record.id);
    grantContext.templateName = record.name;
    grantContext.templateNo = record.templateNo;
    grantContext.cardType = record.cardType;
    grantContext.validityDays = record.validityDays || 0;

    resetGrantState();
    grantModalVisible.value = true;
}

function handleGrantCancel() {
    grantModalVisible.value = false;
    resetGrantState();
}

function handleGrantStepOneConfirm() {
    Modal.confirm({
        title: '确认进入发放流程',
        content: `你将免费发放【${grantContext.templateName}】给指定用户，是否继续？`,
        okText: '继续',
        cancelText: '取消',
        onOk: async () => {
            grantStepCurrent.value = 1;
            await handleSearchMembers();
        },
    });
}

async function handleSearchMembers() {
    const keyword = userSearch.keyword.trim();
    if (!keyword) {
        message.warning(`请输入${userSearch.type === 'phone' ? '手机号' : '昵称'}关键词`);
        return;
    }

    searchingUsers.value = true;
    try {
        const params =
            userSearch.type === 'phone'
                ? { phone: keyword, page: userSearch.page, pageSize: userSearch.pageSize }
                : { nickname: keyword, page: userSearch.page, pageSize: userSearch.pageSize };

        const res = await searchAdminMembersApi(params as any);
        const list = (res as any)?.list ?? (res as any)?.items ?? (res as any)?.records ?? [];
        const totalVal = Number((res as any)?.total || 0);

        memberSearchResults.value = (Array.isArray(list) ? list : []).map((m: any) => ({
            ...m,
            id: String(m.id),
        }));
        memberSearchTotal.value = totalVal;

        // 如果当前选中用户不在结果里，清空选中
        if (
            selectedMember.value &&
            !memberSearchResults.value.some((x) => String(x.id) === String(selectedMember.value?.id))
        ) {
            selectedMember.value = null;
            selectedMemberRowKeys.value = [];
        }
    } catch (e: any) {
        message.error(e?.message || '搜索用户失败');
    } finally {
        searchingUsers.value = false;
    }
}

function handleMemberTableChange(pager: TablePaginationConfig) {
    userSearch.page = pager.current || 1;
    userSearch.pageSize = pager.pageSize || 8;
    handleSearchMembers();
}

function buildGrantUniqueKey(memberId: string, templateId: string): string {
    // 前端也给一个可追踪 key，后端仍有兜底幂等键
    return `WEB-${templateId}-${memberId}-${Date.now()}`;
}

function handleGrantSubmit() {
    if (!selectedMember.value) {
        message.warning('请先选择要发放的用户');
        return;
    }

    const target = selectedMember.value;
    const memberName = target.nickname || target.name || target.phone;

    Modal.confirm({
        title: '二次确认发放',
        content: `确认将【${grantContext.templateName}】免费发放给用户【${memberName}】吗？`,
        okText: '确认发放',
        cancelText: '取消',
        onOk: async () => {
            grantSubmitting.value = true;
            try {
                const payload: AdminGrantPackageRequest = {
                    memberId: String(target.id),
                    templateId: String(grantContext.templateId),
                    remark: `后台手动发放，模板：${grantContext.templateName}`,
                    grantUniqueKey: buildGrantUniqueKey(String(target.id), String(grantContext.templateId)),
                };

                await grantAdminMemberPackageApi(payload);
                message.success('发放成功');
                grantModalVisible.value = false;
                resetGrantState();
            } catch (e: any) {
                message.error(e?.message || '发放失败');
            } finally {
                grantSubmitting.value = false;
            }
        },
    });
}

/** =========================
 * 工具方法
 * ========================= */

function formatMoney(value?: number | null): string {
    if (value === undefined || value === null) return '0.00';
    return (value / 100).toFixed(2);
}

function formatDateTime(dateStr?: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getCardTypeColor(cardType: string): string {
    switch (cardType) {
        case 'COURSE':
            return 'blue';
        case 'VENUE':
            return 'green';
        case 'COMBO':
            return 'purple';
        default:
            return 'default';
    }
}

function getCardTypeText(cardType: string): string {
    switch (cardType) {
        case 'COURSE':
            return '课程卡';
        case 'VENUE':
            return '场地卡';
        case 'COMBO':
            return '组合卡';
        default:
            return cardType || '-';
    }
}
</script>

<style scoped>
.package-template-page {
    padding: 16px;
}

.page-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-form {
    margin-bottom: 24px;
    padding: 16px;
    background: var(--color-bg-container);
    border-radius: 8px;
}

.template-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.template-name {
    max-width: 200px;
    overflow: hidden;
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s;
}

.template-name:hover {
    color: #1890ff;
}

.template-no {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.template-type {
    display: flex;
    gap: 4px;
    margin-top: 4px;
}

.validity-cell {
    color: var(--color-text-secondary);
}

.price-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.price-row {
    display: flex;
    align-items: center;
    gap: 4px;
}

.price-row .label {
    color: var(--color-text-secondary);
    font-size: 12px;
}

.original-price {
    color: var(--color-text-secondary);
    text-decoration: line-through;
    font-size: 12px;
}

.selling-price {
    color: #ff4d4f;
    font-weight: 500;
}

.time-cell {
    color: var(--color-text-secondary);
    font-size: 12px;
}

/* 发放弹窗 */
.grant-steps {
    margin-bottom: 20px;
}

.grant-step-content {
    min-height: 320px;
}

.grant-confirm-block {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.grant-template-summary {
    padding: 12px 14px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #fafafa;
}

.grant-template-summary p {
    margin: 6px 0;
}

.grant-user-block .selected-member {
    margin-top: 12px;
}
</style>
