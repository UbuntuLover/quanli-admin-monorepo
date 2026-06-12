<template>
    <div class="metric-definition-page">
        <ACard>
            <template #title>
                <div class="page-title">
                    <UnorderedListOutlined/>
                    <span>指标定义管理</span>
                </div>
            </template>

            <div class="filter-form">
                <ARow :gutter="16">
                    <ACol :span="8">
                        <AInput
                            v-model:value="searchForm.keyword"
                            placeholder="输入指标名称或代码"
                            allow-clear
                            @keyup.enter="handleSearch"
                        />
                    </ACol>

                    <ACol :span="8">
                        <ASelect
                            v-model:value="searchForm.category"
                            placeholder="选择类别"
                            allow-clear
                            style="width: 100%"
                        >
                            <ASelectOption value="">全部类别</ASelectOption>
                            <ASelectOption
                                v-for="cat in categories"
                                :key="cat"
                                :value="cat"
                            >
                                {{ cat }}
                            </ASelectOption>
                        </ASelect>
                    </ACol>

                    <ACol :span="8" class="text-right">
                        <ASpace>
                            <AButton @click="handleReset">重置</AButton>
                            <AButton type="primary" @click="handleSearch">搜索</AButton>
                            <AButton type="primary" @click="handleCreate">
                                <PlusOutlined/>
                                新建指标
                            </AButton>
                        </ASpace>
                    </ACol>
                </ARow>
            </div>

            <ATable
                row-key="id"
                :columns="columns"
                :data-source="pagedList"
                :pagination="pagination"
                :loading="loading"
                @change="handleTableChange"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'metricCode'">
                        <ATag color="blue">{{ record.metricCode }}</ATag>
                    </template>

                    <template v-else-if="column.key === 'valueType'">
                        <ATag :color="getValueTypeColor(record.valueType)">
                            {{ getValueTypeText(record.valueType) }}
                        </ATag>
                    </template>

                    <template v-else-if="column.key === 'trendDirection'">
                        {{ getTrendDirectionText(record.trendDirection) }}
                    </template>

                    <template v-else-if="column.key === 'enabled'">
                        <ATag :color="record.enabled ? 'green' : 'red'">
                            {{ record.enabled ? '启用' : '禁用' }}
                        </ATag>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <ASpace>
                            <AButton type="link" size="small" @click="handleEdit(record)">
                                编辑
                            </AButton>

                            <AButton
                                type="link"
                                size="small"
                                @click="handleToggleEnabled(record)"
                            >
                                {{ record.enabled ? '禁用' : '启用' }}
                            </AButton>

                            <AButton
                                type="link"
                                size="small"
                                danger
                                @click="handleDelete(record)"
                            >
                                删除
                            </AButton>
                        </ASpace>
                    </template>
                </template>
            </ATable>
        </ACard>

        <AModal
            v-model:open="modalVisible"
            :title="editingDefinition ? '编辑指标' : '新建指标定义'"
            :confirm-loading="submitting"
            destroy-on-close
            @ok="handleSave"
            @cancel="handleCloseModal"
        >
            <AForm :model="form" layout="vertical">
                <ARow :gutter="16">
                    <ACol :span="12">
                        <AFormItem label="指标代码" required>
                            <AInput
                                v-model:value="form.metricCode"
                                placeholder="唯一标识，如 bmi"
                                :disabled="!!editingDefinition"
                            />
                        </AFormItem>
                    </ACol>

                    <ACol :span="12">
                        <AFormItem label="指标名称" required>
                            <AInput v-model:value="form.metricName" placeholder="显示名称"/>
                        </AFormItem>
                    </ACol>
                </ARow>

                <ARow :gutter="16">
                    <ACol :span="8">
                        <AFormItem label="类别">
                            <AInput v-model:value="form.category" placeholder="如 body"/>
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="值类型" required>
                            <ASelect v-model:value="form.valueType" style="width: 100%">
                                <ASelectOption value="NUMBER">数值</ASelectOption>
                                <ASelectOption value="TEXT">文本</ASelectOption>
                                <ASelectOption value="BOOLEAN">布尔</ASelectOption>
                                <ASelectOption value="ENUM">枚举</ASelectOption>
                            </ASelect>
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="单位">
                            <AInput v-model:value="form.unit" placeholder="kg / cm / %"/>
                        </AFormItem>
                    </ACol>
                </ARow>

                <ARow v-if="form.valueType === 'NUMBER'" :gutter="16">
                    <ACol :span="8">
                        <AFormItem label="最小值">
                            <AInputNumber v-model:value="form.minValue" style="width: 100%"/>
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="最大值">
                            <AInputNumber v-model:value="form.maxValue" style="width: 100%"/>
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="精度位数">
                            <AInputNumber
                                v-model:value="form.precisionDigits"
                                :min="0"
                                :max="10"
                                style="width: 100%"
                            />
                        </AFormItem>
                    </ACol>
                </ARow>

                <ARow v-if="form.valueType === 'NUMBER'" :gutter="16">
                    <ACol :span="12">
                        <AFormItem label="正常范围最小值">
                            <AInputNumber
                                v-model:value="form.normalMin"
                                style="width: 100%"
                            />
                        </AFormItem>
                    </ACol>

                    <ACol :span="12">
                        <AFormItem label="正常范围最大值">
                            <AInputNumber
                                v-model:value="form.normalMax"
                                style="width: 100%"
                            />
                        </AFormItem>
                    </ACol>
                </ARow>

                <ARow :gutter="16">
                    <ACol :span="8">
                        <AFormItem label="图表类型">
                            <ASelect v-model:value="form.chartType" style="width: 100%">
                                <ASelectOption value="LINE">折线图</ASelectOption>
                                <ASelectOption value="BAR">柱状图</ASelectOption>
                                <ASelectOption value="AREA">面积图</ASelectOption>
                                <ASelectOption value="SCATTER">散点图</ASelectOption>
                                <ASelectOption value="RADAR">雷达图</ASelectOption>
                            </ASelect>
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="趋势方向">
                            <ASelect
                                v-model:value="form.trendDirection"
                                allow-clear
                                style="width: 100%"
                            >
                                <ASelectOption value="HIGHER_BETTER">越高越好</ASelectOption>
                                <ASelectOption value="LOWER_BETTER">越低越好</ASelectOption>
                                <ASelectOption value="RANGE_BETTER">范围最优</ASelectOption>
                                <ASelectOption value="NEUTRAL">中性</ASelectOption>
                            </ASelect>
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="排序">
                            <AInputNumber
                                v-model:value="form.sortOrder"
                                :min="0"
                                style="width: 100%"
                            />
                        </AFormItem>
                    </ACol>
                </ARow>

                <AFormItem label="启用状态">
                    <ASwitch
                        v-model:checked="form.enabled"
                        checked-children="启用"
                        un-checked-children="禁用"
                    />
                </AFormItem>
            </AForm>
        </AModal>
    </div>
</template>

<script setup lang="ts">
import type {
    MetricDefinitionDTO,
    MetricDefinitionVO,
} from '#/api/metric/metrics';

import {computed, onMounted, reactive, ref} from 'vue';

import {
    PlusOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons-vue';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    InputNumber as AInputNumber,
    Modal as AModal,
    Popconfirm,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Switch as ASwitch,
    Table as ATable,
    Tag as ATag,
    message,
    Modal,
} from 'ant-design-vue';

import {MetricDefinitionApi} from '#/api/metric/metrics';

defineOptions({
    name: 'MetricDefinitionPage',
});

const loading = ref(false);
const submitting = ref(false);
const modalVisible = ref(false);
const editingDefinition = ref<MetricDefinitionVO | null>(null);

const rawList = ref<MetricDefinitionVO[]>([]);
const definitionList = ref<MetricDefinitionVO[]>([]);

const searchForm = reactive({
    keyword: '',
    category: '',
});

const form = reactive<MetricDefinitionDTO>({
    metricCode: '',
    metricName: '',
    category: '',
    valueType: 'NUMBER',
    unit: '',
    precisionDigits: 2,
    minValue: undefined,
    maxValue: undefined,
    normalMin: undefined,
    normalMax: undefined,
    chartType: 'LINE',
    trendDirection: 'NEUTRAL',
    isDerived: false,
    formulaCode: '',
    enabled: true,
    sortOrder: 0,
});

const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
});

const columns = [
    {title: 'ID', dataIndex: 'id', key: 'id', width: 70},
    {title: '指标代码', dataIndex: 'metricCode', key: 'metricCode', width: 140},
    {title: '指标名称', dataIndex: 'metricName', key: 'metricName', width: 140},
    {title: '类别', dataIndex: 'category', key: 'category', width: 100},
    {title: '值类型', dataIndex: 'valueType', key: 'valueType', width: 100},
    {title: '单位', dataIndex: 'unit', key: 'unit', width: 80},
    {
        title: '趋势方向',
        dataIndex: 'trendDirection',
        key: 'trendDirection',
        width: 120,
    },
    {title: '状态', dataIndex: 'enabled', key: 'enabled', width: 90},
    {title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80},
    {title: '操作', key: 'actions', width: 180, fixed: 'right'},
];

const categories = computed(() => {
    return Array.from(
        new Set(rawList.value.map((item) => item.category).filter(Boolean)),
    ) as string[];
});

const pagedList = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return definitionList.value.slice(start, end);
});

async function loadData() {
    loading.value = true;
    try {
        rawList.value = await MetricDefinitionApi.list({enabledOnly: false});
        handleSearch();
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    const keyword = searchForm.keyword.trim().toLowerCase();
    const category = searchForm.category;

    definitionList.value = rawList.value.filter((item) => {
        const matchKeyword =
            !keyword ||
            item.metricCode?.toLowerCase().includes(keyword) ||
            item.metricName?.toLowerCase().includes(keyword);

        const matchCategory = !category || item.category === category;

        return matchKeyword && matchCategory;
    });

    pagination.current = 1;
    pagination.total = definitionList.value.length;
}

function handleReset() {
    searchForm.keyword = '';
    searchForm.category = '';
    handleSearch();
}

function handleTableChange(page: any) {
    pagination.current = page.current;
    pagination.pageSize = page.pageSize;
}

function resetForm() {
    Object.assign(form, {
        metricCode: '',
        metricName: '',
        category: '',
        valueType: 'NUMBER',
        unit: '',
        precisionDigits: 2,
        minValue: undefined,
        maxValue: undefined,
        normalMin: undefined,
        normalMax: undefined,
        chartType: 'LINE',
        trendDirection: 'NEUTRAL',
        isDerived: false,
        formulaCode: '',
        enabled: true,
        sortOrder: 0,
    });
}

function handleCreate() {
    editingDefinition.value = null;
    resetForm();
    modalVisible.value = true;
}

function handleEdit(record: MetricDefinitionVO) {
    editingDefinition.value = record;
    Object.assign(form, {
        ...record,
    });
    modalVisible.value = true;
}

function handleCloseModal() {
    modalVisible.value = false;
}

function validateForm() {
    if (!form.metricCode?.trim()) {
        message.warning('请输入指标代码');
        return false;
    }

    if (!form.metricName?.trim()) {
        message.warning('请输入指标名称');
        return false;
    }

    if (
        form.valueType === 'NUMBER' &&
        form.minValue !== undefined &&
        form.maxValue !== undefined &&
        Number(form.maxValue) <= Number(form.minValue)
    ) {
        message.warning('最大值必须大于最小值');
        return false;
    }

    return true;
}

async function handleSave() {
    if (!validateForm()) return;

    submitting.value = true;
    try {
        if (editingDefinition.value?.id) {
            await MetricDefinitionApi.update(editingDefinition.value.id, form);
            message.success('修改成功');
        } else {
            await MetricDefinitionApi.create(form);
            message.success('创建成功');
        }

        modalVisible.value = false;
        await loadData();
    } finally {
        submitting.value = false;
    }
}

async function handleToggleEnabled(record: MetricDefinitionVO) {
    if (!record.id) return;

    if (record.enabled) {
        await MetricDefinitionApi.disable(record.id);
        message.success('禁用成功');
    } else {
        await MetricDefinitionApi.update(record.id, {
            ...record,
            enabled: true,
        });
        message.success('启用成功');
    }

    await loadData();
}

function handleDelete(record: MetricDefinitionVO) {
    if (!record.id) return;

    Modal.confirm({
        title: '确认删除',
        content: `确认删除指标「${record.metricName}」？仅未被使用的指标可删除。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
            await MetricDefinitionApi.remove(record.id!);
            message.success('删除成功');
            await loadData();
        },
    });
}

function getValueTypeColor(type?: string) {
    const map: Record<string, string> = {
        NUMBER: 'blue',
        TEXT: 'purple',
        BOOLEAN: 'green',
        ENUM: 'orange',
    };
    return map[type || ''] || 'default';
}

function getValueTypeText(type?: string) {
    const map: Record<string, string> = {
        NUMBER: '数值',
        TEXT: '文本',
        BOOLEAN: '布尔',
        ENUM: '枚举',
    };
    return map[type || ''] || type || '-';
}

function getTrendDirectionText(type?: string) {
    const map: Record<string, string> = {
        HIGHER_BETTER: '越高越好',
        LOWER_BETTER: '越低越好',
        RANGE_BETTER: '范围最优',
        NEUTRAL: '中性',
    };
    return map[type || ''] || '-';
}

onMounted(loadData);
</script>

<style scoped>
.metric-definition-page {
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

.text-right {
    text-align: right;
}
</style>
