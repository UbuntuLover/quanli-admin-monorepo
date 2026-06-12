<template>
    <div class="metric-record-create-page">
        <ACard>
            <template #title>
                <div class="page-title">
                    <PlusCircleOutlined/>
                    <span>录入用户指标</span>
                </div>
            </template>

            <div class="member-search-section">
                <ARow :gutter="16">
                    <ACol :span="10">
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

                    <ACol :span="6">
                        <AFormItem label="操作">
                            <AButton @click="handleClearMember">清空会员</AButton>
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
            </div>

            <AForm :model="form" layout="vertical">
                <ARow :gutter="16">
                    <ACol :span="12">
                        <AFormItem label="记录时间">
                            <ADatePicker
                                v-model:value="recordTime"
                                show-time
                                placeholder="选择记录时间"
                                style="width: 100%"
                            />
                        </AFormItem>
                    </ACol>

                    <ACol :span="12">
                        <AFormItem label="来源">
                            <ASelect v-model:value="form.source" style="width: 100%">
                                <ASelectOption value="MANUAL">手动录入</ASelectOption>
                                <ASelectOption value="COACH">教练录入</ASelectOption>
                                <ASelectOption value="DEVICE">设备同步</ASelectOption>
                                <ASelectOption value="IMPORT">批量导入</ASelectOption>
                                <ASelectOption value="API">API接入</ASelectOption>
                            </ASelect>
                        </AFormItem>
                    </ACol>
                </ARow>

                <ARow :gutter="16">
                    <ACol :span="12">
                        <AFormItem label="场景">
                            <AInput v-model:value="form.scene" placeholder="如 BODY_TEST"/>
                        </AFormItem>
                    </ACol>

                    <ACol :span="12">
                        <AFormItem label="备注">
                            <AInput v-model:value="form.remark" placeholder="请输入备注"/>
                        </AFormItem>
                    </ACol>
                </ARow>

                <ADivider>指标项</ADivider>

                <div class="metric-items">
                    <div
                        v-for="(item, index) in form.items"
                        :key="index"
                        class="metric-item-row"
                    >
                        <ARow :gutter="16">
                            <ACol :span="6">
                                <AFormItem :label="`指标 ${index + 1}`" required>
                                    <ASelect
                                        v-model:value="item.metricCode"
                                        show-search
                                        placeholder="选择指标"
                                        style="width: 100%"
                                        :filter-option="filterMetricOption"
                                        @change="handleMetricChange(item)"
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

                            <ACol :span="4">
                                <AFormItem label="周期类型">
                                    <ASelect v-model:value="item.periodType" style="width: 100%">
                                        <ASelectOption value="POINT">单点</ASelectOption>
                                        <ASelectOption value="DAY">日</ASelectOption>
                                        <ASelectOption value="WEEK">周</ASelectOption>
                                        <ASelectOption value="MONTH">月</ASelectOption>
                                        <ASelectOption value="QUARTER">季度</ASelectOption>
                                        <ASelectOption value="YEAR">年</ASelectOption>
                                    </ASelect>
                                </AFormItem>
                            </ACol>

                            <ACol :span="6">
                                <AFormItem label="指标值" required>
                                    <ASelect
                                        v-if="getMetric(item.metricCode)?.valueType === 'BOOLEAN'"
                                        v-model:value="item.value"
                                        style="width: 100%"
                                    >
                                        <ASelectOption value="true">是</ASelectOption>
                                        <ASelectOption value="false">否</ASelectOption>
                                    </ASelect>

                                    <AInput
                                        v-else
                                        v-model:value="item.value"
                                        :placeholder="getPlaceholder(item)"
                                    />
                                </AFormItem>
                            </ACol>

                            <ACol :span="4">
                                <AFormItem label="单位">
                                    <AInput :value="getMetricUnit(item.metricCode)" disabled/>
                                </AFormItem>
                            </ACol>

                            <ACol :span="4">
                                <AFormItem label="操作">
                                    <ASpace>
                                        <AButton
                                            v-if="index === form.items.length - 1"
                                            type="link"
                                            @click="addMetricItem"
                                        >
                                            <PlusOutlined/>
                                        </AButton>

                                        <AButton
                                            v-if="form.items.length > 1"
                                            type="link"
                                            danger
                                            @click="removeMetricItem(index)"
                                        >
                                            <MinusOutlined/>
                                        </AButton>
                                    </ASpace>
                                </AFormItem>
                            </ACol>
                        </ARow>

                        <ARow v-if="item.metricCode" :gutter="16">
                            <ACol :span="24">
                                <div class="metric-info">
                  <span>
                    <strong>类型：</strong>
                    {{ getValueTypeText(getMetric(item.metricCode)?.valueType) }}
                  </span>
                                    <span>
                    <strong>范围：</strong>
                    {{ getValueRange(item.metricCode) }}
                  </span>
                                    <span>
                    <strong>趋势：</strong>
                    {{ getTrendDirectionText(getMetric(item.metricCode)?.trendDirection) }}
                  </span>
                                </div>
                            </ACol>
                        </ARow>
                    </div>
                </div>

                <ADivider/>

                <div class="form-actions">
                    <ASpace>
                        <AButton @click="handleCancel">取消</AButton>
                        <AButton type="primary" :loading="submitting" @click="handleSubmit">
                            提交
                        </AButton>
                    </ASpace>
                </div>
            </AForm>
        </ACard>
    </div>
</template>

<script setup lang="ts">
import type {
    MetricDefinitionVO,
    UserMetricBatchCreateDTO,
    UserMetricItemDTO,
} from '#/api/metric/metrics';
import type { MemberSearchResultDTO } from '#/api/member/member';

import {computed, onMounted, reactive, ref} from 'vue';
import {useRouter} from 'vue-router';

import {
    MinusOutlined,
    PlusCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons-vue';
import dayjs, {type Dayjs} from 'dayjs';

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
    InputSearch as AInputSearch,
    List as AList,
    ListItem as AListItem,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Tag as ATag,
    message,
} from 'ant-design-vue';

import {
    MetricDefinitionApi,
    UserMetricRecordApi,
} from '#/api/metric/metrics';
import {searchAdminMembersApi} from '#/api/member/member';

defineOptions({
    name: 'MetricRecordCreatePage',
});

type MetricItemForm = UserMetricItemDTO & {
    unit?: string;
};

const router = useRouter();
const submitting = ref(false);
const memberSearching = ref(false);

const availableMetrics = ref<MetricDefinitionVO[]>([]);
const recordTime = ref<Dayjs>(dayjs());

const memberSearchKeyword = ref('');
const memberSearchResult = ref<MemberSearchResultDTO[]>([]);
const selectedMember = ref<MemberSearchResultDTO | null>(null);

const form = reactive<UserMetricBatchCreateDTO & { items: MetricItemForm[] }>({
    userId: undefined,
    recordTime: '',
    scene: 'BODY_TEST',
    source: 'MANUAL',
    operatorId: undefined,
    remark: '',
    extra: undefined,
    items: [
        {
            metricCode: undefined,
            value: '',
            periodType: 'POINT',
            remark: '',
        },
    ],
});

const selectedMemberText = computed(() => {
    if (!selectedMember.value) {
        return '';
    }

    const name = selectedMember.value.name || selectedMember.value.nickname || '未命名会员';
    return `${name} / ${selectedMember.value.phone} / ID: ${selectedMember.value.id}`;
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
    memberSearchKeyword.value = member.phone || member.name || member.nickname || '';

    message.success('已选择会员');
}

function handleClearMember() {
    selectedMember.value = null;
    memberSearchKeyword.value = '';
    memberSearchResult.value = [];
}

function addMetricItem() {
    form.items.push({
        metricCode: undefined,
        value: '',
        periodType: 'POINT',
        remark: '',
    });
}

function removeMetricItem(index: number) {
    form.items.splice(index, 1);
}

function getMetric(metricCode?: string) {
    return availableMetrics.value.find((item) => item.metricCode === metricCode);
}

function handleMetricChange(item: MetricItemForm) {
    item.value = '';
    item.unit = getMetric(item.metricCode)?.unit;
}

function getMetricUnit(metricCode?: string) {
    return getMetric(metricCode)?.unit || '';
}

function getPlaceholder(item: MetricItemForm) {
    const metric = getMetric(item.metricCode);
    if (!metric) return '请输入指标值';

    if (metric.valueType === 'NUMBER') {
        const unit = metric.unit ? `，单位：${metric.unit}` : '';
        return `请输入数值${unit}`;
    }

    if (metric.valueType === 'TEXT') return '请输入文本';
    if (metric.valueType === 'BOOLEAN') return '请选择 true/false';
    if (metric.valueType === 'ENUM') return '请输入枚举值';

    return '请输入指标值';
}

function getValueRange(metricCode?: string) {
    const metric = getMetric(metricCode);
    if (!metric || metric.valueType !== 'NUMBER') return '-';

    const min = metric.minValue ?? '-';
    const max = metric.maxValue ?? '-';
    return `${min} ~ ${max}${metric.unit || ''}`;
}

function getValueTypeText(type?: string) {
    const map: Record<string, string> = {
        NUMBER: '数值',
        TEXT: '文本',
        BOOLEAN: '布尔',
        ENUM: '枚举',
    };
    return map[type || ''] || '-';
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

function validateForm() {
    if (!selectedMember.value) {
        message.warning('请先搜索并选择会员');
        return false;
    }

    const userId = Number(selectedMember.value.id);
    if (!Number.isFinite(userId)) {
        message.error('当前会员ID不是有效数字');
        return false;
    }

    if (form.items.length === 0) {
        message.warning('请至少添加一个指标项');
        return false;
    }

    const codes = form.items.map((item) => item.metricCode).filter(Boolean);

    if (codes.length !== form.items.length) {
        message.warning('请选择所有指标');
        return false;
    }

    if (new Set(codes).size !== codes.length) {
        message.warning('不能重复选择指标');
        return false;
    }

    const emptyValue = form.items.some((item) => item.value === undefined || item.value === '');
    if (emptyValue) {
        message.warning('请输入所有指标值');
        return false;
    }

    return true;
}

async function handleSubmit() {
    if (!validateForm()) return;

    const userId = Number(selectedMember.value!.id);

    submitting.value = true;
    try {
        await UserMetricRecordApi.createBatch({
            userId,
            recordTime: recordTime.value
                ? recordTime.value.format('YYYY-MM-DDTHH:mm:ss')
                : undefined,
            scene: form.scene,
            source: form.source,
            remark: form.remark,
            items: form.items.map((item) => ({
                metricCode: item.metricCode,
                value: String(item.value),
                periodType: item.periodType || 'POINT',
                remark: item.remark,
                extra: item.extra,
            })),
        });

        message.success('录入成功');
        router.push('/metrics-management/record');
    } finally {
        submitting.value = false;
    }
}

function handleCancel() {
    router.back();
}

onMounted(loadMetrics);
</script>

<style scoped>
.metric-record-create-page {
    padding: 16px;
}

.page-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.member-search-section {
    margin-bottom: 16px;
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

.metric-item-row {
    padding: 12px;
    margin-bottom: 12px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 6px;
}

.metric-info {
    display: flex;
    gap: 24px;
    padding: 8px 12px;
    color: var(--color-text-secondary);
    background: var(--color-bg-container);
    border-radius: 4px;
    margin-top: 8px;
}

.form-actions {
    text-align: right;
}
</style>
