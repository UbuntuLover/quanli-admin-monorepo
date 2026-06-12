<template>
    <div class="metric-record-page">
        <ACard>
            <template #title>
                <div class="page-title">
                    <BarChartOutlined />
                    <span>用户指标记录</span>
                </div>
            </template>

            <div class="filter-form">
                <ARow :gutter="16">
                    <ACol :span="8">
                        <AFormItem label="会员搜索">
                            <AInputSearch
                                v-model:value="memberSearchKeyword"
                                placeholder="请输入手机号 / 姓名 / 昵称"
                                enter-button="搜索"
                                allow-clear
                                :loading="memberSearching"
                                @search="handleSearchMember"
                            />
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="已选择会员">
                            <AInput
                                :value="selectedMemberText"
                                placeholder="请先搜索并选择会员"
                                disabled
                            />
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="操作">
                            <ASpace>
                                <AButton @click="handleClearMember">清空会员</AButton>
                                <AButton type="primary" @click="handleCreate">
                                    <PlusOutlined />
                                    录入指标
                                </AButton>
                            </ASpace>
                        </AFormItem>
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
                                                        <span>匹配：{{ getMatchTypeText(item.matchType) }}</span>
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

                <ADivider />

                <ARow :gutter="16">
                    <ACol :span="8">
                        <AFormItem label="指标">
                            <ASelect
                                v-model:value="searchForm.metricCodes"
                                mode="multiple"
                                show-search
                                placeholder="请选择指标"
                                style="width: 100%"
                                :filter-option="filterMetricOption"
                            >
                                <ASelectOption
                                    v-for="metric in availableMetrics"
                                    :key="metric.metricCode"
                                    :value="metric.metricCode"
                                >
                                    {{ metric.metricName }}（{{ metric.metricCode }}）
                                </ASelectOption>
                            </ASelect>
                        </AFormItem>
                    </ACol>

                    <ACol :span="8">
                        <AFormItem label="时间范围">
                            <ARangePicker
                                v-model:value="searchForm.dateRange"
                                style="width: 100%"
                            />
                        </AFormItem>
                    </ACol>

                    <ACol :span="4">
                        <AFormItem label="周期">
                            <ASelect v-model:value="searchForm.periodType" style="width: 100%">
                                <ASelectOption value="">全部</ASelectOption>
                                <ASelectOption value="POINT">单点</ASelectOption>
                                <ASelectOption value="DAY">日</ASelectOption>
                                <ASelectOption value="WEEK">周</ASelectOption>
                                <ASelectOption value="MONTH">月</ASelectOption>
                                <ASelectOption value="QUARTER">季度</ASelectOption>
                                <ASelectOption value="YEAR">年</ASelectOption>
                            </ASelect>
                        </AFormItem>
                    </ACol>

                    <ACol :span="4">
                        <AFormItem label="查询">
                            <ASpace>
                                <AButton @click="handleReset">重置</AButton>
                                <AButton type="primary" :loading="loading" @click="handleSearch">
                                    查询
                                </AButton>
                            </ASpace>
                        </AFormItem>
                    </ACol>
                </ARow>
            </div>

            <ATable
                row-key="id"
                :columns="columns"
                :data-source="pagedRecordList"
                :pagination="pagination"
                :loading="loading"
                @change="handleTableChange"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'member'">
                        <div>
                            <div>{{ selectedMember?.name || selectedMember?.nickname || '-' }}</div>
                            <div class="table-sub-text">{{ selectedMember?.phone || '-' }}</div>
                        </div>
                    </template>

                    <template v-else-if="column.key === 'metricCode'">
                        <ATag color="blue">{{ record.metricCode }}</ATag>
                    </template>

                    <template v-else-if="column.key === 'value'">
            <span>
              {{ record.value }}
              <span>{{ record.unit }}</span>
            </span>
                    </template>

                    <template v-else-if="column.key === 'actions'">
                        <AButton type="link" size="small" @click="handleViewTrend(record)">
                            查看趋势
                        </AButton>
                    </template>
                </template>
            </ATable>
        </ACard>

        <AModal
            v-model:open="trendModalVisible"
            title="指标趋势"
            width="900px"
            :footer="null"
            destroy-on-close
            @cancel="disposeChart"
        >
            <div v-if="currentTrendMetric" class="trend-header">
                <ADescriptions bordered size="small" :column="3">
                    <ADescriptionsItem label="会员">
                        {{ selectedMember?.name || selectedMember?.nickname || '-' }}
                    </ADescriptionsItem>

                    <ADescriptionsItem label="手机号">
                        {{ selectedMember?.phone || '-' }}
                    </ADescriptionsItem>

                    <ADescriptionsItem label="指标">
                        {{ currentTrendMetric.metricName || currentTrendMetric.metricCode }}
                    </ADescriptionsItem>
                </ADescriptions>
            </div>

            <div ref="chartRef" class="chart-container"></div>
        </AModal>
    </div>
</template>

<script setup lang="ts">
import type {
    MetricDefinitionVO,
    UserMetricTrendResponseVO,
} from '#/api/metric/metrics';
import type { MemberSearchResultDTO } from '#/api/member/member';

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
    BarChartOutlined,
    PlusOutlined,
} from '@ant-design/icons-vue';
import type { Dayjs } from 'dayjs';
import * as echarts from 'echarts';

import {
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    Col as ACol,
    DatePicker,
    Descriptions as ADescriptions,
    DescriptionsItem as ADescriptionsItem,
    Divider as ADivider,
    FormItem as AFormItem,
    Input as AInput,
    InputSearch as AInputSearch,
    List as AList,
    ListItem as AListItem,
    Modal as AModal,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Table as ATable,
    Tag as ATag,
    message,
} from 'ant-design-vue';

import {
    MetricDefinitionApi,
    UserMetricRecordApi,
} from '#/api/metric/metrics';
import { searchAdminMembersApi } from '#/api/member/member';

const ARangePicker = DatePicker.RangePicker;

defineOptions({
    name: 'MetricRecordPage',
});

interface RecordRow {
    id: string;
    userId?: number;
    metricCode?: string;
    metricName?: string;
    unit?: string;
    time?: string;
    value?: number | string;
}

const router = useRouter();

const loading = ref(false);
const memberSearching = ref(false);

const availableMetrics = ref<MetricDefinitionVO[]>([]);
const trendData = ref<UserMetricTrendResponseVO | null>(null);
const recordList = ref<RecordRow[]>([]);

const memberSearchKeyword = ref('');
const memberSearchResult = ref<MemberSearchResultDTO[]>([]);
const selectedMember = ref<MemberSearchResultDTO | null>(null);

const trendModalVisible = ref(false);
const chartRef = ref<HTMLDivElement | null>(null);
const currentTrendMetric = ref<RecordRow | null>(null);

let chartInstance: echarts.ECharts | null = null;

const searchForm = reactive<{
    metricCodes: string[];
    dateRange?: [Dayjs, Dayjs];
    periodType: string;
}>({
    metricCodes: [],
    dateRange: undefined,
    periodType: '',
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
    {
        title: '会员',
        key: 'member',
        width: 180,
    },
    {
        title: '指标代码',
        dataIndex: 'metricCode',
        key: 'metricCode',
        width: 140,
    },
    {
        title: '指标名称',
        dataIndex: 'metricName',
        key: 'metricName',
        width: 160,
    },
    {
        title: '指标值',
        key: 'value',
        width: 140,
    },
    {
        title: '记录时间',
        dataIndex: 'time',
        key: 'time',
        width: 180,
    },
    {
        title: '操作',
        key: 'actions',
        width: 120,
    },
];

const selectedMemberText = computed(() => {
    if (!selectedMember.value) {
        return '';
    }

    const name = selectedMember.value.name || selectedMember.value.nickname || '未命名会员';
    return `${name} / ${selectedMember.value.phone} / ID: ${selectedMember.value.id}`;
});

const pagedRecordList = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    return recordList.value.slice(start, end);
});

async function loadMetrics() {
    availableMetrics.value = await MetricDefinitionApi.list({
        enabledOnly: true,
    });
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
    memberSearchKeyword.value =
        member.phone || member.name || member.nickname || '';

    message.success('已选择会员');

    handleSearch();
}

function handleClearMember() {
    selectedMember.value = null;
    memberSearchKeyword.value = '';
    memberSearchResult.value = [];
    recordList.value = [];
    trendData.value = null;
    pagination.current = 1;
    pagination.total = 0;
}

function handleCreate() {
    router.push('/metrics-management/record/create');
}

function handleReset() {
    searchForm.metricCodes = [];
    searchForm.dateRange = undefined;
    searchForm.periodType = '';

    recordList.value = [];
    trendData.value = null;

    pagination.current = 1;
    pagination.total = 0;
}

async function handleSearch() {
    if (!selectedMember.value) {
        message.warning('请先搜索并选择会员');
        return;
    }

    const userId = Number(selectedMember.value.id);

    if (!Number.isFinite(userId)) {
        message.error('当前会员ID不是有效数字，无法查询指标记录');
        return;
    }

    const metricCodes = searchForm.metricCodes.length > 0
        ? searchForm.metricCodes
        : availableMetrics.value.map((m) => m.metricCode);

    if (metricCodes.length === 0) {
        message.warning('当前没有可用的指标');
        return;
    }

    loading.value = true;

    try {
        const [start, end] = searchForm.dateRange || [];

        trendData.value = await UserMetricRecordApi.trend({
            userId,
            metricCodes,
            startDate: start?.format('YYYY-MM-DD'),
            endDate: end?.format('YYYY-MM-DD'),
            periodType: searchForm.periodType || undefined,
        });

        recordList.value = flattenTrendData(trendData.value);
        pagination.current = 1;
        pagination.total = recordList.value.length;
    } finally {
        loading.value = false;
    }
}

function flattenTrendData(data: UserMetricTrendResponseVO): RecordRow[] {
    const rows: RecordRow[] = [];

    data.series.forEach((series) => {
        series.data.forEach((point, index) => {
            rows.push({
                id: `${series.metricCode}-${point.time}-${index}`,
                userId: data.userId,
                metricCode: series.metricCode,
                metricName: series.metricName,
                unit: series.unit,
                time: point.time,
                value: point.value ?? point.textValue ?? formatBoolValue(point.boolValue),
            });
        });
    });

    return rows;
}

function formatBoolValue(value?: boolean) {
    if (value === undefined || value === null) {
        return '';
    }

    return value ? '是' : '否';
}

function handleTableChange(page: any) {
    pagination.current = page.current;
    pagination.pageSize = page.pageSize;
}

async function handleViewTrend(record: RecordRow) {
    if (!trendData.value) {
        return;
    }

    currentTrendMetric.value = record;
    trendModalVisible.value = true;

    await nextTick();

    const series = trendData.value.series.filter(
        (item) => item.metricCode === record.metricCode,
    );

    renderChart({
        userId: trendData.value.userId,
        series,
    });
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return dateStr;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function renderChart(data: UserMetricTrendResponseVO) {
    if (!chartRef.value) {
        return;
    }

    disposeChart();

    chartInstance = echarts.init(chartRef.value);

    const xAxisData = Array.from(
        new Set(
            data.series.flatMap((series) =>
                series.data.map((point) => point.time || ''),
            ),
        ),
    ).filter(Boolean).map((time) => formatDate(time));

    chartInstance.setOption({
        tooltip: {
            trigger: 'axis',
        },
        legend: {
            top: 0,
            data: data.series.map((item) => item.metricName || item.metricCode),
        },
        grid: {
            left: 48,
            right: 24,
            top: 48,
            bottom: 40,
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLabel: {
                rotate: 30,
                formatter: (value: string) => {
                    return formatDate(value);
                },
            },
        },
        yAxis: {
            type: 'value',
        },
        series: data.series.map((item) => ({
            name: item.metricName || item.metricCode,
            type: item.chartType === 'BAR' ? 'bar' : 'line',
            smooth: true,
            data: xAxisData.map((formattedTime) => {
                const originalTime = item.data.find((p) => formatDate(p.time || '') === formattedTime);
                return originalTime?.value ?? null;
            }),
        })),
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

function filterMetricOption(input: string, option: any) {
    return String(option?.children || '')
        .toLowerCase()
        .includes(input.toLowerCase());
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

function getMatchTypeText(type?: string) {
    const map: Record<string, string> = {
        PHONE: '手机号',
        NAME: '姓名',
        NICKNAME: '昵称',
    };

    return map[type || ''] || type || '-';
}

onMounted(async () => {
    await loadMetrics();
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    disposeChart();
});
</script>

<style scoped>
.metric-record-page {
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

.table-sub-text {
    color: var(--color-text-secondary);
    font-size: 12px;
}

.trend-header {
    margin-bottom: 16px;
}

.chart-container {
    width: 100%;
    height: 420px;
}
</style>
