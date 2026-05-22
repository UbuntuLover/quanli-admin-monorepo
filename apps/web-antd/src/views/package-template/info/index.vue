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

            <a-form
                class="filter-form"
                layout="vertical"
                :model="queryForm"
            >
                <a-row :gutter="16">
                    <a-col :xs="24" :sm="12" :md="8" :lg="6">
                        <a-form-item label="模板名称">
                            <a-input
                                v-model:value="queryForm.templateName"
                                allow-clear
                                placeholder="请输入模板名称"
                                @press-enter="handleSearch"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="卡类型">
                            <a-select
                                v-model:value="queryForm.cardType"
                                allow-clear
                                placeholder="全部"
                            >
                                <a-select-option value="COURSE">课程卡</a-select-option>
                                <a-select-option value="VENUE">场地卡</a-select-option>
                                <a-select-option value="COMBO">组合卡</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="状态">
                            <a-select
                                v-model:value="queryForm.status"
                                allow-clear
                                placeholder="全部"
                            >
                                <a-select-option :value="1">上架</a-select-option>
                                <a-select-option :value="0">下架</a-select-option>
                            </a-select>
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
                            <div class="template-no">
                                编号：{{ record.templateNo }}
                            </div>
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
                                <span class="original-price">
                                    ¥{{ formatMoney(record.originalPrice) }}
                                </span>
                            </div>
                            <div class="price-row">
                                <span class="label">售价：</span>
                                <span class="selling-price">
                                    ¥{{ formatMoney(record.sellingPrice) }}
                                </span>
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
                            :checked="record.isOnSale === 1"
                            checked-color="#52c41a"
                            unchecked-color="#d9d9d9"
                            checked-text="上架"
                            unchecked-text="下架"
                            @change="(checked: boolean) => handleToggleStatus(record, checked)"
                        />
                    </template>

                    <template v-else-if="column.key === 'createdAt'">
                        <div class="time-cell">
                            {{ formatDateTime(record.createdAt) }}
                        </div>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleDetail(record)">
                                详情
                            </a-button>

                            <a-button type="link" size="small" @click="handleEdit(record)">
                                编辑
                            </a-button>

                            <a-popconfirm
                                title="确定删除该模板吗？"
                                ok-text="确定"
                                cancel-text="取消"
                                @confirm="handleDelete(record)"
                            >
                                <a-button type="link" size="small" danger>
                                    删除
                                </a-button>
                            </a-popconfirm>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import type { TablePaginationConfig } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Form as AForm,
    Input as AInput,
    message,
    Popconfirm as APopconfirm,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Switch as ASwitch,
    Table as ATable,
    Tag as ATag,
} from 'ant-design-vue';

const AFormItem = AForm.Item;
const ASelectOption = ASelect.Option;

import {
    deletePackageTemplateApi,
    getPackageTemplateListApi,
    updatePackageTemplateStatusApi,
    type PackageTemplateQueryDTO,
    type PackageTemplateListDTO,
} from '#/api/template/template';

const router = useRouter();

const loading = ref(false);
const templateList = ref<PackageTemplateListDTO[]>([]);
const total = ref(0);

const queryForm = reactive<PackageTemplateQueryDTO>({
    page: 1,
    pageSize: 10,
    templateName: undefined,
    cardType: undefined,
    status: undefined,
    sortField: 'createdAt',
    sortDirection: 'DESC',
});

const columns = [
    {
        title: '模板信息',
        key: 'template',
        width: 280,
        fixed: 'left',
    },
    {
        title: '有效期',
        key: 'validity',
        width: 100,
    },
    {
        title: '价格信息',
        key: 'price',
        width: 180,
    },
    {
        title: '状态',
        key: 'status',
        width: 120,
    },
    {
        title: '创建时间',
        key: 'createdAt',
        width: 180,
    },
    {
        title: '操作',
        key: 'actions',
        width: 200,
        fixed: 'right',
    },
];

const pagination = computed<TablePaginationConfig>(() => ({
    current: queryForm.page,
    pageSize: queryForm.pageSize,
    total: total.value,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (value) => `共 ${value} 条`,
}));

const activeStatusCount = computed(() => {
    return templateList.value.filter((item) => item.isOnSale === 1).length;
});

onMounted(() => {
    fetchTemplateList();
});

async function fetchTemplateList() {
    loading.value = true;

    try {
        const res = await getPackageTemplateListApi({
            ...queryForm,
        });

        // 调试输出
        console.log('=== 权益卡模板列表响应 ===');
        console.log('完整响应:', JSON.stringify(res, null, 2));
        console.log('list 字段:', res?.list);
        console.log('data.list 字段:', (res as any)?.data?.list);
        console.log('items 字段:', (res as any)?.items);
        console.log('total 字段:', res?.total);

        // 尝试多种可能的数据结构
        const list = res?.list || (res as any)?.data?.list || (res as any)?.items || [];
        const total = res?.total || (res as any)?.data?.total || (res as any)?.totalCount || 0;

        templateList.value = list;
        total.value = total;

        queryForm.page = res?.page || (res as any)?.data?.page || queryForm.page;
        queryForm.pageSize = res?.pageSize || (res as any)?.data?.pageSize || queryForm.pageSize;
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
    queryForm.templateName = undefined;
    queryForm.cardType = undefined;
    queryForm.status = undefined;
    queryForm.sortField = 'createdAt';
    queryForm.sortDirection = 'DESC';

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
    router.push({ name: 'PackageTemplateInfo', query: { id: record.id } });
}

function handleEdit(record: PackageTemplateListDTO) {
    router.push({ name: 'PackageTemplateEdit', query: { id: record.id } });
}

async function handleToggleStatus(record: PackageTemplateListDTO, checked: boolean) {
    const newStatus = checked ? 1 : 0;
    try {
        await updatePackageTemplateStatusApi(record.id, newStatus);
        message.success(newStatus === 1 ? '模板已上架' : '模板已下架');
        record.isOnSale = newStatus;
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

function formatMoney(value?: number | null): string {
    if (value === undefined || value === null) {
        return '0.00';
    }
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
</style>
