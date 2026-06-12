<template>
    <div class="metric-radar-page">
        <ACard>
            <template #title>
                <div class="page-title">
                    <RadarChartOutlined/>
                    <span>雷达图管理</span>
                </div>
            </template>

            <div class="filter-form">
                <ARow :gutter="16">
                    <ACol :span="8">
                        <AInput
                            v-model:value="searchForm.keyword"
                            placeholder="输入模板名称或代码"
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
                                新建模板
                            </AButton>
                        </ASpace>
                    </ACol>
                </ARow>
            </div>

            <ATable
                row-key="id"
                :columns="columns"
                :data-source="templateList"
                :pagination="pagination"
                :loading="loading"
                @change="handleTableChange"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'templateCode'">
                        <ATag color="blue">{{ record.templateCode }}</ATag>
                    </template>

                    <template v-else-if="column.key === 'scoreRange'">
                        {{ record.scoreMin ?? 0 }} - {{ record.scoreMax ?? 100 }}
                    </template>

                    <template v-else-if="column.key === 'enabled'">
                        <ATag :color="record.enabled ? 'green' : 'red'">
                            {{ record.enabled ? '启用' : '禁用' }}
                        </ATag>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <ASpace>
                            <AButton type="link" size="small" @click="handlePreview(record)">
                                预览
                            </AButton>

                            <AButton
                                type="link"
                                size="small"
                                @click="handleConfigure(record)"
                            >
                                配置维度
                            </AButton>

                            <AButton type="link" size="small" @click="handleEdit(record)">
                                编辑
                            </AButton>
                        </ASpace>
                    </template>
                </template>
            </ATable>
        </ACard>

        <AModal
            v-model:open="templateModalVisible"
            :title="editingTemplate ? '编辑模板' : '新建雷达图模板'"
            :confirm-loading="submitting"
            destroy-on-close
            @ok="handleSaveTemplate"
            @cancel="handleCloseTemplateModal"
        >
            <AForm :model="templateForm" layout="vertical">
                <ARow :gutter="16">
                    <ACol :span="12">
                        <AFormItem label="模板代码" required>
                            <AInput
                                v-model:value="templateForm.templateCode"
                                placeholder="如 comprehensive_fitness"
                                :disabled="!!editingTemplate"
                            />
                        </AFormItem>
                    </ACol>

                    <ACol :span="12">
                        <AFormItem label="模板名称" required>
                            <AInput
                                v-model:value="templateForm.templateName"
                                placeholder="显示名称"
                            />
                        </AFormItem>
                    </ACol>
                </ARow>

                <ARow :gutter="16">
                    <ACol :span="8">
                        <AFormItem label="类别">
                            <AInput v-model:value="templateForm.category"/>
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="最低分">
                            <AInputNumber
                                v-model:value="templateForm.scoreMin"
                                style="width: 100%"
                            />
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="最高分">
                            <AInputNumber
                                v-model:value="templateForm.scoreMax"
                                style="width: 100%"
                            />
                        </AFormItem>
                    </ACol>
                </ARow>

                <AFormItem label="描述">
                    <ATextarea
                        v-model:value="templateForm.description"
                        :rows="3"
                    />
                </AFormItem>

                <AFormItem label="启用状态">
                    <ASwitch
                        v-model:checked="templateForm.enabled"
                        checked-children="启用"
                        un-checked-children="禁用"
                    />
                </AFormItem>
            </AForm>
        </AModal>

        <AModal
            v-model:open="metricModalVisible"
            title="配置雷达图维度"
            width="1100px"
            :footer="null"
            destroy-on-close
        >
            <div v-if="currentTemplate">
                <ADescriptions bordered size="small" :column="3">
                    <ADescriptionsItem label="模板代码">
                        {{ currentTemplate.templateCode }}
                    </ADescriptionsItem>
                    <ADescriptionsItem label="模板名称">
                        {{ currentTemplate.templateName }}
                    </ADescriptionsItem>
                    <ADescriptionsItem label="分数范围">
                        {{ currentTemplate.scoreMin ?? 0 }} - {{ currentTemplate.scoreMax ?? 100 }}
                    </ADescriptionsItem>
                </ADescriptions>

                <ADivider>维度列表</ADivider>

                <ARow :gutter="12" class="metric-header">
                    <ACol :span="4" class="col-divider">
                        <span class="header-label">指标 <span class="required">*</span></span>
                        <span class="header-desc">选择要展示的指标</span>
                    </ACol>
                    <ACol :span="2" class="col-divider">
                        <span class="header-label">轴编码</span>
                        <span class="header-desc">雷达图轴标识</span>
                    </ACol>
                    <ACol :span="2" class="col-divider">
                        <span class="header-label">轴名称</span>
                        <span class="header-desc">雷达图显示名称</span>
                    </ACol>
                    <ACol :span="3" class="col-divider">
                        <span class="header-label">评分方式</span>
                        <span class="header-desc">指标评分策略</span>
                    </ACol>
                    <ACol :span="1" class="col-divider">
                        <span class="header-label">权重</span>
                        <span class="header-desc">权重占比</span>
                    </ACol>
                    <ACol :span="5" class="col-divider">
                        <span class="header-label">评分范围</span>
                        <span class="header-desc">评分上下限</span>
                    </ACol>
                    <ACol :span="3" class="col-divider">
                        <span class="header-label">缺失策略</span>
                        <span class="header-desc">数据缺失处理</span>
                    </ACol>
                    <ACol :span="4">
                        <span class="header-label">操作</span>
                    </ACol>
                </ARow>

                <div
                    v-for="(metric, index) in metricList"
                    :key="metric.localKey"
                    class="metric-item"
                >
                    <ARow :gutter="12">
                        <ACol :span="4" class="col-divider">
                            <ASelect
                                v-model:value="metric.metricCode"
                                show-search
                                placeholder="请选择指标"
                                style="width: 100%"
                                @change="handleMetricSelect(metric)"
                            >
                                <ASelectOption
                                    v-for="m in availableMetrics"
                                    :key="m.metricCode"
                                    :value="m.metricCode"
                                >
                                    {{ m.metricName }}
                                </ASelectOption>
                            </ASelect>
                        </ACol>

                        <ACol :span="2" class="col-divider">
                            <AInput v-model:value="metric.axisCode" placeholder="轴编码"/>
                        </ACol>

                        <ACol :span="2" class="col-divider">
                            <AInput v-model:value="metric.axisName" placeholder="轴名称"/>
                        </ACol>

                        <ACol :span="3" class="col-divider">
                            <ASelect v-model:value="metric.scoreMethod" style="width: 100%">
                                <ASelectOption value="HIGHER_BETTER">越高越好</ASelectOption>
                                <ASelectOption value="LOWER_BETTER">越低越好</ASelectOption>
                                <ASelectOption value="RANGE_BETTER">范围最优</ASelectOption>
                            </ASelect>
                        </ACol>

                        <ACol :span="1" class="col-divider">
                            <AInputNumber
                                v-model:value="metric.weight"
                                :min="0"
                                style="width: 100%"
                                placeholder="权重"
                            />
                        </ACol>

                        <ACol :span="5" class="col-divider">
                            <ASpace>
                                <AInputNumber
                                    v-model:value="metric.scoreMinValue"
                                    placeholder="下限"
                                    style="width: 100px"
                                />
                                <AInputNumber
                                    v-model:value="metric.scoreMaxValue"
                                    placeholder="上限"
                                    style="width: 100px"
                                />
                            </ASpace>
                        </ACol>

                        <ACol :span="3" class="col-divider">
                            <ASelect
                                v-model:value="metric.missingStrategy"
                                style="width: 100%"
                            >
                                <ASelectOption value="IGNORE">忽略</ASelectOption>
                                <ASelectOption value="ZERO">设为0</ASelectOption>
                                <ASelectOption value="DEFAULT">默认值</ASelectOption>
                            </ASelect>
                        </ACol>

                        <ACol :span="4" class="action-col">
                            <div class="action-buttons">
                                <AButton size="small" type="primary" @click="saveMetric(metric)">
                                    保存
                                </AButton>
                                <AButton size="small" danger @click="removeMetric(index)">
                                    删除
                                </AButton>
                            </div>
                        </ACol>
                    </ARow>

                    <ARow
                        v-if="metric.scoreMethod === 'RANGE_BETTER'"
                        :gutter="12"
                        class="sub-row"
                    >
                        <ACol :span="24">
                            <ASpace>
                                <span>目标范围：</span>
                                <AInputNumber
                                    v-model:value="metric.targetMinValue"
                                    placeholder="目标最小值"
                                />
                                <span>-</span>
                                <AInputNumber
                                    v-model:value="metric.targetMaxValue"
                                    placeholder="目标最大值"
                                />
                            </ASpace>
                        </ACol>
                    </ARow>

                    <ARow
                        v-if="metric.missingStrategy === 'DEFAULT'"
                        :gutter="12"
                        class="sub-row"
                    >
                        <ACol :span="24">
                            <ASpace>
                                <span>默认分：</span>
                                <AInputNumber
                                    v-model:value="metric.defaultScore"
                                    placeholder="默认分数"
                                />
                            </ASpace>
                        </ACol>
                    </ARow>
                </div>

                <AButton type="dashed" block @click="addMetric">
                    <PlusOutlined/>
                    添加维度
                </AButton>
            </div>
        </AModal>

        <AModal
            v-model:open="previewModalVisible"
            title="雷达图预览"
            width="900px"
            :footer="null"
            destroy-on-close
            @cancel="disposeChart"
        >
            <ARow :gutter="16" class="preview-form">
                <ACol :span="10">
                    <AInputSearch
                        v-model:value="memberSearchKeyword"
                        placeholder="请输入手机号 / 姓名 / 昵称"
                        enter-button="搜索"
                        allow-clear
                        :loading="memberSearching"
                        @search="handleSearchMember"
                    />
                </ACol>
                <ACol :span="6">
                    <AInput
                        :value="selectedMemberText"
                        placeholder="请先搜索并选择会员"
                        disabled
                    />
                </ACol>
                <ACol :span="8">
                    <ASpace>
                        <ADatePicker
                            v-model:value="previewDate"
                            style="width: 140px"
                            placeholder="统计日期"
                        />
                        <AButton type="primary" :loading="previewLoading" @click="loadPreview">
                            生成预览
                        </AButton>
                    </ASpace>
                </ACol>
            </ARow>

            <ARow v-if="memberSearchResult.length > 0" :gutter="16">
                <ACol :span="24">
                    <div class="member-result-box">
                        <div class="member-result-title">会员搜索结果</div>

                        <AList
                            bordered
                            size="small"
                            :data-source="memberSearchResult"
                        >
                            <template #renderItem="{ item }">
                                <AListItem>
                                    <div class="member-item">
                                        <div class="member-main">
                                            <AAvatar :src="item.avatar || undefined">
                                                {{ getMemberAvatarText(item) }}
                                            </AAvatar>

                                            <div class="member-info">
                                                <div class="member-name">
                                                    {{ item.name || item.nickname || '未命名会员' }}
                                                    <ATag class="ml-2" :color="getMemberStatusColor(item.status)">
                                                        {{ getMemberStatusText(item.status) }}
                                                    </ATag>
                                                </div>

                                                <div class="member-meta">
                                                    <span>手机号：{{ item.phone }}</span>
                                                    <span>会员号：{{ item.memberNo }}</span>
                                                    <span>昵称：{{ item.nickname || '-' }}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <AButton type="link" @click="handleSelectMember(item)">
                                            选择
                                        </AButton>
                                    </div>
                                </AListItem>
                            </template>
                        </AList>
                    </div>
                </ACol>
            </ARow>

            <div ref="chartRef" class="chart-container"></div>
        </AModal>
    </div>
</template>

<script setup lang="ts">
import type {
    MetricDefinitionVO,
    RadarTemplateDTO,
    RadarTemplateMetricDTO,
    RadarTemplateMetricVO,
    RadarTemplateVO,
    UserRadarResultVO,
} from '#/api/metric/metrics';
import type { MemberSearchResultDTO } from '#/api/member/member';

import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref} from 'vue';

import {
    PlusOutlined,
    RadarChartOutlined,
} from '@ant-design/icons-vue';
import { searchAdminMembersApi } from '#/api/member/member';
import dayjs, {type Dayjs} from 'dayjs';
import * as echarts from 'echarts';

import {
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    Col as ACol,
    DatePicker as ADatePicker,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    InputNumber as AInputNumber,
    InputSearch as AInputSearch,
    List as AList,
    ListItem as AListItem,
    Modal as AModal,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Switch as ASwitch,
    Table as ATable,
    Tag as ATag,
    Textarea as ATextarea,
    message,
    Modal,
} from 'ant-design-vue';

import {
    MetricDefinitionApi,
    RadarTemplateApi,
    RadarTemplateMetricApi,
    UserRadarApi,
} from '#/api/metric/metrics';

defineOptions({
    name: 'MetricRadarPage',
});

type MetricFormItem = RadarTemplateMetricDTO & {
    id?: number;
    localKey: string;
};

const loading = ref(false);
const submitting = ref(false);
const previewLoading = ref(false);

const rawTemplates = ref<RadarTemplateVO[]>([]);
const templateList = ref<RadarTemplateVO[]>([]);
const availableMetrics = ref<MetricDefinitionVO[]>([]);

const templateModalVisible = ref(false);
const metricModalVisible = ref(false);
const previewModalVisible = ref(false);

const editingTemplate = ref<RadarTemplateVO | null>(null);
const currentTemplate = ref<RadarTemplateVO | null>(null);

const metricList = ref<MetricFormItem[]>([]);

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const previewDate = ref<Dayjs>(dayjs());
const previewTemplate = ref<RadarTemplateVO | null>(null);
const memberSearching = ref(false);

const memberSearchKeyword = ref('');
const memberSearchResult = ref<MemberSearchResultDTO[]>([]);
const selectedMember = ref<MemberSearchResultDTO | null>(null);

const previewForm = reactive({
    userId: undefined as number | undefined,
});

const selectedMemberText = computed(() => {
    if (!selectedMember.value) {
        return '';
    }

    const name = selectedMember.value.name || selectedMember.value.nickname || '未命名会员';
    return `${name} / ${selectedMember.value.phone} / ID: ${selectedMember.value.id}`;
});

const searchForm = reactive({
    keyword: '',
    category: '',
});

const templateForm = reactive<RadarTemplateDTO>({
    templateCode: '',
    templateName: '',
    category: '',
    description: '',
    scoreMin: 0,
    scoreMax: 100,
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
    {
        title: '模板代码',
        dataIndex: 'templateCode',
        key: 'templateCode',
        width: 180,
    },
    {
        title: '模板名称',
        dataIndex: 'templateName',
        key: 'templateName',
        width: 180,
    },
    {title: '类别', dataIndex: 'category', key: 'category', width: 120},
    {title: '分数范围', key: 'scoreRange', width: 120},
    {title: '状态', dataIndex: 'enabled', key: 'enabled', width: 90},
    {title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80},
    {title: '操作', key: 'actions', width: 220, fixed: 'right'},
];

const categories = computed(() => {
    return Array.from(
        new Set(rawTemplates.value.map((item) => item.category).filter(Boolean)),
    ) as string[];
});

async function loadData() {
    loading.value = true;
    try {
        rawTemplates.value = await RadarTemplateApi.list({enabledOnly: false});
        handleSearch();
    } finally {
        loading.value = false;
    }
}

async function loadMetrics() {
    availableMetrics.value = await MetricDefinitionApi.list({
        enabledOnly: true,
    });
}

function handleSearch() {
    const keyword = searchForm.keyword.trim().toLowerCase();
    const category = searchForm.category;

    templateList.value = rawTemplates.value.filter((item) => {
        const matchKeyword =
            !keyword ||
            item.templateCode?.toLowerCase().includes(keyword) ||
            item.templateName?.toLowerCase().includes(keyword);

        const matchCategory = !category || item.category === category;

        return matchKeyword && matchCategory;
    });

    pagination.total = templateList.value.length;
    pagination.current = 1;
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

function resetTemplateForm() {
    Object.assign(templateForm, {
        templateCode: '',
        templateName: '',
        category: '',
        description: '',
        scoreMin: 0,
        scoreMax: 100,
        enabled: true,
        sortOrder: 0,
    });
}

function handleCreate() {
    editingTemplate.value = null;
    resetTemplateForm();
    templateModalVisible.value = true;
}

function handleEdit(record: RadarTemplateVO) {
    editingTemplate.value = record;
    Object.assign(templateForm, record);
    templateModalVisible.value = true;
}

function handleCloseTemplateModal() {
    templateModalVisible.value = false;
}

async function handleSaveTemplate() {
    if (!templateForm.templateCode?.trim()) {
        message.warning('请输入模板代码');
        return;
    }

    if (!templateForm.templateName?.trim()) {
        message.warning('请输入模板名称');
        return;
    }

    submitting.value = true;
    try {
        if (editingTemplate.value?.id) {
            await RadarTemplateApi.update(editingTemplate.value.id, templateForm);
            message.success('修改成功');
        } else {
            await RadarTemplateApi.create(templateForm);
            message.success('创建成功');
        }

        templateModalVisible.value = false;
        await loadData();
    } finally {
        submitting.value = false;
    }
}

async function handleConfigure(record: RadarTemplateVO) {
    currentTemplate.value = record;
    metricModalVisible.value = true;

    await loadMetrics();

    const list = await RadarTemplateApi.metrics(record.id!);
    metricList.value = list.map(toMetricFormItem);

    if (metricList.value.length === 0) {
        addMetric();
    }
}

function toMetricFormItem(item: RadarTemplateMetricVO): MetricFormItem {
    return {
        ...item,
        localKey: `saved-${item.id}`,
    };
}

function addMetric() {
    metricList.value.push({
        templateId: currentTemplate.value?.id,
        metricCode: undefined,
        axisCode: '',
        axisName: '',
        scoreMethod: 'HIGHER_BETTER',
        scoreMinValue: undefined,
        scoreMaxValue: undefined,
        targetMinValue: undefined,
        targetMaxValue: undefined,
        weight: 1,
        required: false,
        maxScore: 100,
        minScore: 0,
        missingStrategy: 'IGNORE',
        defaultScore: undefined,
        sortOrder: metricList.value.length + 1,
        localKey: `new-${Date.now()}-${Math.random()}`,
    });
}

function handleMetricSelect(metric: MetricFormItem) {
    const selected = availableMetrics.value.find(
        (item) => item.metricCode === metric.metricCode,
    );

    if (!selected) return;

    if (!metric.axisCode) {
        metric.axisCode = selected.metricCode;
    }

    if (!metric.axisName) {
        metric.axisName = selected.metricName;
    }

    metric.scoreMinValue = selected.minValue;
    metric.scoreMaxValue = selected.maxValue;

    if (selected.trendDirection === 'LOWER_BETTER') {
        metric.scoreMethod = 'LOWER_BETTER';
    } else if (selected.trendDirection === 'RANGE_BETTER') {
        metric.scoreMethod = 'RANGE_BETTER';
        metric.targetMinValue = selected.normalMin;
        metric.targetMaxValue = selected.normalMax;
    } else {
        metric.scoreMethod = 'HIGHER_BETTER';
    }
}

function validateMetric(metric: MetricFormItem) {
    if (!currentTemplate.value?.id) {
        message.warning('模板不存在');
        return false;
    }

    if (!metric.metricCode) {
        message.warning('请选择指标');
        return false;
    }

    if (!metric.axisCode?.trim()) {
        message.warning('请输入轴编码');
        return false;
    }

    if (!metric.axisName?.trim()) {
        message.warning('请输入轴名称');
        return false;
    }

    if (!metric.scoreMethod) {
        message.warning('请选择评分方式');
        return false;
    }

    if (
        metric.scoreMinValue === undefined ||
        metric.scoreMaxValue === undefined
    ) {
        message.warning('请输入评分范围');
        return false;
    }

    if (
        metric.scoreMethod === 'RANGE_BETTER' &&
        (metric.targetMinValue === undefined ||
            metric.targetMaxValue === undefined)
    ) {
        message.warning('范围最优需要填写目标范围');
        return false;
    }

    return true;
}

async function saveMetric(metric: MetricFormItem) {
    if (!validateMetric(metric)) return;

    const payload: RadarTemplateMetricDTO = {
        ...metric,
        templateId: currentTemplate.value?.id,
    };

    if (metric.id) {
        const updated = await RadarTemplateMetricApi.update(metric.id, payload);
        Object.assign(metric, updated);
        message.success('维度修改成功');
    } else {
        const saved = await RadarTemplateMetricApi.create(payload);
        metric.id = saved.id;
        metric.localKey = `saved-${saved.id}`;
        metric.metricName = saved.metricName;
        metric.unit = saved.unit;
        message.success('维度创建成功');
    }
}

async function removeMetric(index: number) {
    const item = metricList.value[index];

    if (!item.id) {
        metricList.value.splice(index, 1);
        return;
    }

    Modal.confirm({
        title: '确认删除',
        content: `确认删除维度「${item.axisName}」？`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
            await RadarTemplateMetricApi.remove(item.id!);
            message.success('删除成功');
            metricList.value.splice(index, 1);

            if (metricList.value.length === 0) {
                addMetric();
            }
        },
    });
}

async function handlePreview(record: RadarTemplateVO) {
    previewTemplate.value = record;
    previewForm.userId = undefined;
    previewDate.value = dayjs();
    previewModalVisible.value = true;

    await nextTick();
    renderEmptyChart();
}

async function handleSearchMember() {
    const keyword = memberSearchKeyword.value.trim();

    if (!keyword) {
        message.warning('请输入手机号、姓名或昵称');
        return;
    }

    memberSearching.value = true;

    try {
        const result = await searchAdminMembersApi({
            phone: keyword,
            name: keyword,
            nickname: keyword,
            page: 1,
            pageSize: 10,
        });

        memberSearchResult.value = result.items || [];

        if (memberSearchResult.value.length === 0) {
            message.info('未找到匹配会员');
        }
    } finally {
        memberSearching.value = false;
    }
}

function handleSelectMember(member: MemberSearchResultDTO) {
    selectedMember.value = member;
    memberSearchResult.value = [];
    memberSearchKeyword.value = member.phone || member.name || member.nickname || '';
    previewForm.userId = Number(member.id);

    message.success('已选择会员');
}

async function loadPreview() {
    if (!selectedMember.value) {
        message.warning('请先搜索并选择会员');
        return;
    }

    if (!previewTemplate.value?.templateCode) {
        message.warning('模板不存在');
        return;
    }

    previewLoading.value = true;
    try {
        const radar = await UserRadarApi.getUserRadar({
            userId: previewForm.userId!,
            templateCode: previewTemplate.value.templateCode,
            recordDate: previewDate.value?.format('YYYY-MM-DD'),
        });

        await nextTick();
        renderRadarChart(radar);
    } finally {
        previewLoading.value = false;
    }
}

function getMemberAvatarText(member: MemberSearchResultDTO) {
    const name = member.name || member.nickname || member.phone || '?';
    return name.slice(0, 1);
}

function getMemberStatusColor(status?: number) {
    const map: Record<number, string> = {
        1: 'green',
        2: 'orange',
        3: 'red',
    };
    return map[status || 0] || 'default';
}

function getMemberStatusText(status?: number) {
    const map: Record<number, string> = {
        1: '正常',
        2: '冻结',
        3: '注销',
    };
    return map[status || 0] || '未知';
}

function renderEmptyChart() {
    if (!chartRef.value) return;

    disposeChart();
    chartInstance = echarts.init(chartRef.value);
    chartInstance.setOption({
        title: {
            text: '请输入用户ID后生成预览',
            left: 'center',
            top: 'center',
            textStyle: {
                color: '#999',
                fontSize: 16,
            },
        },
    });
}

function renderRadarChart(data: UserRadarResultVO) {
    if (!chartRef.value) return;

    disposeChart();
    chartInstance = echarts.init(chartRef.value);

    chartInstance.setOption({
        title: {
            text: data.templateName || '雷达图',
            left: 'center',
        },
        tooltip: {
            trigger: 'item',
        },
        radar: {
            center: ['50%', '55%'],
            radius: '65%',
            indicator: data.indicators.map((item) => ({
                name: item.axisName,
                max: item.max ?? data.scoreMax ?? 100,
            })),
        },
        series: [
            {
                type: 'radar',
                areaStyle: {
                    opacity: 0.2,
                },
                data: data.series.map((item) => ({
                    name: item.name,
                    value: item.values.map((v) => v ?? 0),
                })),
            },
        ],
    });

    chartInstance.resize();
}

function disposeChart() {
    chartInstance?.dispose();
    chartInstance = null;
}

function handleResize() {
    chartInstance?.resize();
}

onMounted(async () => {
    await Promise.all([loadData(), loadMetrics()]);
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    disposeChart();
});
</script>

<style scoped>
.metric-radar-page {
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

.metric-item {
    padding: 12px;
    margin-bottom: 12px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 6px;
}

.metric-header {
    padding: 8px 12px;
    margin-bottom: 8px;
    background: var(--color-bg-container);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 12px;
}

.header-label {
    display: block;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 2px;
}

.header-desc {
    display: block;
    color: var(--color-text-secondary);
    font-size: 11px;
}

.required {
    color: var(--color-error);
}

.col-divider {
    border-right: 1px solid var(--color-border);
}

.action-col {
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.action-buttons {
    display: flex;
    gap: 4px;
    align-items: center;
}

.member-result-box {
    padding: 12px;
    margin: 8px 0 16px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 6px;
}

.member-result-title {
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--color-text);
}

.member-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.member-main {
    display: flex;
    align-items: center;
    gap: 12px;
}

.member-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.member-name {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: var(--color-text);
}

.member-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: var(--color-text-secondary);
    font-size: 12px;
}

.ml-2 {
    margin-left: 8px;
}

.sub-row {
    margin-top: 12px;
}

.preview-form {
    margin-bottom: 16px;
}

.chart-container {
    width: 100%;
    height: 460px;
}
</style>
