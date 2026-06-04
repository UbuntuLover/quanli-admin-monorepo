<template>
    <div class="disclaimer-list-page">
        <a-card :bordered="false">
            <template #title>
                <div class="page-title">
                    <span>免责声明管理</span>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="fetchDisclaimerList">刷新</a-button>
                    <a-button type="primary" @click="handleCreate">创建免责声明</a-button>
                </a-space>
            </template>

            <a-form class="filter-form" layout="vertical" :model="queryForm">
                <a-row :gutter="16">
                    <a-col :xs="24" :sm="12" :md="8" :lg="6">
                        <a-form-item label="文档名称/编号">
                            <a-input
                                v-model:value="queryForm.keyword"
                                allow-clear
                                placeholder="请输入文档名称/编号"
                                @press-enter="handleSearch"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="12" :md="8" :lg="5">
                        <a-form-item label="适用场景">
                            <a-select v-model:value="queryForm.sceneType" allow-clear placeholder="全部">
                                <a-select-option value="COURSE">课程预约</a-select-option>
                                <a-select-option value="VENUE">场地预约</a-select-option>
                                <a-select-option value="MEMBER">会员注册</a-select-option>
                                <a-select-option value="PAYMENT">支付协议</a-select-option>
                                <a-select-option value="OTHER">其他</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :sm="24" :md="24" :lg="13">
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
                :data-source="disclaimerList"
                :pagination="pagination"
                :scroll="{ x: 1200 }"
                @change="handleTableChange"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'docInfo'">
                        <div class="doc-cell">
                            <div class="doc-name">{{ record.name }}</div>
                            <div class="doc-code">编号：{{ record.code }}</div>
                            <div v-if="record.description" class="doc-desc">{{ record.description }}</div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'sceneType'">
                        <a-tag :color="getSceneTypeColor(record.sceneType)">
                            {{ getSceneTypeText(record.sceneType) }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.key === 'confirmMode'">
                        <span>{{ getConfirmModeText(record.confirmMode) }}</span>
                    </template>

                    <template v-else-if="column.key === 'settings'">
                        <div class="settings-cell">
                            <div v-if="record.requireCheckboxConfirm" class="setting-tag">需要勾选确认</div>
                            <div v-if="record.requireScrollToEnd" class="setting-tag">需要滚动到底</div>
                            <div v-if="record.forceReconfirmOnUpdate" class="setting-tag">更新需重新确认</div>
                            <div
                                v-if="!record.requireCheckboxConfirm && !record.requireScrollToEnd && !record.forceReconfirmOnUpdate"
                                class="setting-tag muted"
                            >
                                无额外设置
                            </div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'status'">
                        <a-tag :color="record.isPublished ? 'green' : 'orange'">
                            {{ record.isPublished ? '已发布' : '未发布' }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.key === 'currentVersion'">
                        <span>{{ record.currentVersionTitle || '-' }}</span>
                    </template>

                    <template v-else-if="column.key === 'createAt'">
                        <span>{{ formatDateTime(record.createAt) }}</span>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleDetail(record)">详情</a-button>
                            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                            <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue';
import {useRouter} from 'vue-router';
import {message, Modal} from 'ant-design-vue';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Table as ATable,
    Tag as ATag,
} from 'ant-design-vue';

import {
    deleteDisclaimerDoc,
    pageDisclaimerDocs,
    type DisclaimerDocListItemVO,
} from '#/api/disclaimer';

type SceneType = 'COURSE' | 'VENUE' | 'MEMBER' | 'PAYMENT' | 'OTHER' | string;
type ConfirmMode = 'CHECKBOX' | 'SCROLL' | 'BOTH' | string;

interface DisclaimerListItem extends DisclaimerDocListItemVO {
    sceneType: SceneType;
    confirmMode: ConfirmMode;
}

const router = useRouter();

const loading = ref(false);
const disclaimerList = ref<DisclaimerListItem[]>([]);

const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
});

const queryForm = reactive<{
    keyword: string;
    sceneType?: SceneType;
}>({
    keyword: '',
    sceneType: undefined,
});

const columns = [
    {title: '文档信息', key: 'docInfo', width: 280},
    {title: '适用场景', key: 'sceneType', width: 120},
    {title: '确认方式', key: 'confirmMode', width: 120},
    {title: '设置项', key: 'settings', width: 220},
    {title: '状态', key: 'status', width: 100},
    {title: '当前发布版本', key: 'currentVersion', width: 180},
    {title: '创建时间', key: 'createAt', dataIndex: 'createAt', width: 180},
    {title: '操作', key: 'actions', width: 170, fixed: 'right' as const},
];

function getSceneTypeText(sceneType?: string): string {
    if (!sceneType) return '-';
    const typeMap: Record<string, string> = {
        COURSE: '课程预约',
        VENUE: '场地预约',
        MEMBER: '会员注册',
        PAYMENT: '支付协议',
        OTHER: '其他',
    };
    return typeMap[sceneType] || sceneType;
}

function getSceneTypeColor(sceneType?: string): string {
    if (!sceneType) return 'default';
    const colorMap: Record<string, string> = {
        COURSE: 'blue',
        VENUE: 'green',
        MEMBER: 'purple',
        PAYMENT: 'orange',
        OTHER: 'default',
    };
    return colorMap[sceneType] || 'default';
}

function getConfirmModeText(confirmMode?: string): string {
    if (!confirmMode) return '-';
    const modeMap: Record<string, string> = {
        CHECKBOX: '勾选确认',
        SCROLL: '滚动确认',
        BOTH: '勾选+滚动',
    };
    return modeMap[confirmMode] || confirmMode;
}

function formatDateTime(value?: string | null): string {
    if (!value) return '-';
    return String(value).replace('T', ' ').replace('Z', '');
}

async function fetchDisclaimerList() {
    loading.value = true;
    try {
        const data = await pageDisclaimerDocs({
            page: pagination.current,
            pageSize: pagination.pageSize,
            keyword: queryForm.keyword || undefined,
            sceneType: queryForm.sceneType || undefined,
        });

        // 对齐后端 PageResult
        disclaimerList.value = (data?.items || []) as DisclaimerListItem[];
        pagination.total = Number(data?.total || 0);
    } catch (e: any) {
        console.error('查询免责声明列表失败:', e);
        message.error(e?.message || '查询免责声明列表失败');
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    pagination.current = 1;
    fetchDisclaimerList();
}

function handleReset() {
    queryForm.keyword = '';
    queryForm.sceneType = undefined;
    pagination.current = 1;
    fetchDisclaimerList();
}

function handleTableChange(paginationInfo: { current?: number; pageSize?: number }) {
    pagination.current = paginationInfo.current || 1;
    pagination.pageSize = paginationInfo.pageSize || 10;
    fetchDisclaimerList();
}

function handleDetail(record: DisclaimerListItem) {
    router.push(`/disclaimer/detail/${record.id}`);
}

function handleEdit(record: DisclaimerListItem) {
    router.push(`/disclaimer/edit/${record.id}`);
}

function handleCreate() {
    router.push('/disclaimer/create');
}

function handleDelete(record: DisclaimerListItem) {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除免责声明「${record.name}」吗？删除后不可恢复。`,
        okText: '确认删除',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
            try {
                await deleteDisclaimerDoc(record.id);
                message.success('删除成功');
                // 如果删的是当前页最后一条，回退一页
                if (disclaimerList.value.length === 1 && pagination.current > 1) {
                    pagination.current -= 1;
                }
                await fetchDisclaimerList();
            } catch (e: any) {
                console.error('删除免责声明失败:', e);
                message.error(e?.message || '删除失败');
            }
        },
    });
}

onMounted(() => {
    fetchDisclaimerList();
});
</script>

<style scoped>
.disclaimer-list-page {
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

.doc-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.doc-name {
    font-size: 14px;
    font-weight: 500;
}

.doc-code {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.doc-desc {
    margin-top: 2px;
    font-size: 12px;
    color: #999;
    line-height: 1.4;
}

.settings-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.setting-tag {
    font-size: 12px;
    padding: 2px 8px;
    background: var(--color-bg-elevated);
    border-radius: 4px;
    color: var(--color-text-secondary);
}

.setting-tag.muted {
    opacity: 0.65;
}
</style>
