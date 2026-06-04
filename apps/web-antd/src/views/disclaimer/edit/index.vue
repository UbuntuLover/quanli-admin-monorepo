<template>
    <div class="disclaimer-edit-page">
        <a-card :bordered="false" class="edit-card">
            <template #title>
                <div class="card-header">
                    <a-button type="link" @click="handleBack">
                        <a-icon component="ArrowLeft" />
                        返回
                    </a-button>
                    <span class="card-title">编辑免责声明</span>
                    <a-tag :color="detail?.isPublished ? 'green' : 'orange'" class="ml-2">
                        {{ detail?.isPublished ? '已发布' : '未发布' }}
                    </a-tag>
                </div>
            </template>

            <a-spin :spinning="loading">
                <template v-if="detail">
                    <a-steps :current="currentStep" class="mb-6">
                        <a-step title="文档信息" />
                        <a-step title="版本管理" />
                    </a-steps>

                    <template v-if="currentStep === 0">
                        <a-form layout="vertical" :model="docForm">
                            <a-row :gutter="16">
                                <a-col :xs="24" :sm="12">
                                    <a-form-item label="文档编号">
                                        <a-input
                                            v-model:value="docForm.code"
                                            :disabled="true"
                                        />
                                    </a-form-item>
                                </a-col>
                                <a-col :xs="24" :sm="12">
                                    <a-form-item label="文档名称" required>
                                        <a-input
                                            v-model:value="docForm.name"
                                            placeholder="请输入文档名称"
                                        />
                                    </a-form-item>
                                </a-col>
                            </a-row>

                            <a-row :gutter="16">
                                <a-col :xs="24" :sm="12">
                                    <a-form-item label="适用场景" required>
                                        <a-select
                                            v-model:value="docForm.sceneType"
                                            placeholder="请选择适用场景"
                                        >
                                            <a-select-option value="COURSE">课程预约</a-select-option>
                                            <a-select-option value="VENUE">场地预约</a-select-option>
                                            <a-select-option value="MEMBER">会员注册</a-select-option>
                                            <a-select-option value="PAYMENT">支付协议</a-select-option>
                                            <a-select-option value="OTHER">其他</a-select-option>
                                        </a-select>
                                    </a-form-item>
                                </a-col>
                                <a-col :xs="24" :sm="12">
                                    <a-form-item label="确认方式" required>
                                        <a-select
                                            v-model:value="docForm.confirmMode"
                                            placeholder="请选择确认方式"
                                        >
                                            <a-select-option value="CHECKBOX">勾选确认</a-select-option>
                                            <a-select-option value="SCROLL">滚动确认</a-select-option>
                                            <a-select-option value="BOTH">勾选+滚动</a-select-option>
                                        </a-select>
                                    </a-form-item>
                                </a-col>
                            </a-row>

                            <a-form-item label="设置选项">
                                <a-space :wrap="true">
                                    <a-checkbox v-model:checked="docForm.requireCheckboxConfirm">
                                        需要勾选确认
                                    </a-checkbox>
                                    <a-checkbox v-model:checked="docForm.requireScrollToEnd">
                                        需要滚动到底
                                    </a-checkbox>
                                    <a-checkbox v-model:checked="docForm.forceReconfirmOnUpdate">
                                        更新需重新确认
                                    </a-checkbox>
                                </a-space>
                            </a-form-item>

                            <a-form-item label="描述">
                                <a-textarea
                                    v-model:value="docForm.description"
                                    :rows="3"
                                    placeholder="请输入文档描述（可选）"
                                />
                            </a-form-item>
                        </a-form>
                    </template>

                    <template v-else-if="currentStep === 1">
                        <div class="version-section">
                            <div class="version-tabs">
                                <a-space>
                                    <a-button
                                        :type="activeVersionTab === 'current' ? 'primary' : 'default'"
                                        @click="activeVersionTab = 'current'"
                                    >
                                        当前版本
                                    </a-button>
                                    <a-button
                                        :type="activeVersionTab === 'history' ? 'primary' : 'default'"
                                        @click="activeVersionTab = 'history'"
                                    >
                                        历史版本
                                    </a-button>
                                    <a-button
                                        type="primary"
                                        @click="showNewVersionModal = true"
                                    >
                                        创建新版本
                                    </a-button>
                                </a-space>
                            </div>

                            <template v-if="activeVersionTab === 'current' && detail.currentVersion">
                                <a-descriptions :column="2" bordered class="mt-4">
                                    <a-descriptions-item label="版本ID">{{ detail.currentVersion.versionId }}</a-descriptions-item>
                                    <a-descriptions-item label="版本标题">{{ detail.currentVersion.title }}</a-descriptions-item>
                                    <a-descriptions-item label="确认按钮文字">{{ detail.currentVersion.confirmText || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="版本摘要">{{ detail.currentVersion.summary || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="版本备注">{{ detail.currentVersion.versionRemark || '-' }}</a-descriptions-item>
                                    <a-descriptions-item label="发布状态">
                                        <a-tag :color="detail.currentVersion.isPublished ? 'green' : 'orange'">
                                            {{ detail.currentVersion.isPublished ? '已发布' : '未发布' }}
                                        </a-tag>
                                    </a-descriptions-item>
                                </a-descriptions>
                                <div class="content-section mt-4">
                                    <h4>正文内容</h4>
                                    <div class="content-box">
                                        {{ detail.currentVersion.contentHtml }}
                                    </div>
                                </div>
                            </template>

                            <template v-else-if="activeVersionTab === 'history'">
                                <a-table
                                    row-key="versionId"
                                    :data-source="detail.allVersions.filter(v => v)"
                                    :columns="versionColumns"
                                    pagination="false"
                                >
                                    <template #bodyCell="{ column, record }">
                                        <template v-if="column.key === 'actions'">
                                            <a-space>
                                                <a-button
                                                    v-if="!record?.isPublished"
                                                    type="link"
                                                    size="small"
                                                    @click="handlePublishVersion(record)"
                                                >
                                                    发布此版本
                                                </a-button>
                                                <a-button
                                                    type="link"
                                                    size="small"
                                                    @click="handleViewVersion(record)"
                                                >
                                                    查看详情
                                                </a-button>
                                            </a-space>
                                        </template>
                                    </template>
                                </a-table>
                            </template>
                        </div>
                    </template>
                </template>
            </a-spin>

            <div class="footer-buttons">
                <a-space>
                    <a-button v-if="currentStep > 0" @click="handlePrev">上一步</a-button>
                    <a-button
                        v-if="currentStep < 1"
                        type="primary"
                        @click="handleNext"
                    >
                        下一步
                    </a-button>
                    <a-button
                        v-if="currentStep === 0"
                        type="primary"
                        :loading="submitting"
                        @click="handleUpdateDoc"
                    >
                        保存文档信息
                    </a-button>
                    <a-button @click="handleBack">返回列表</a-button>
                </a-space>
            </div>
        </a-card>

        <!-- 创建新版本弹窗 -->
        <a-modal
            v-model:open="showNewVersionModal"
            title="创建新版本"
            :footer="null"
            @cancel="showNewVersionModal = false"
        >
            <a-form layout="vertical" :model="newVersionForm">
                <a-form-item label="版本标题" required>
                    <a-input
                        v-model:value="newVersionForm.title"
                        placeholder="请输入版本标题"
                    />
                </a-form-item>

                <a-form-item label="正文内容" required>
                    <a-textarea
                        v-model:value="newVersionForm.contentHtml"
                        :rows="8"
                        placeholder="请输入免责声明正文内容"
                    />
                </a-form-item>

                <a-row :gutter="16">
                    <a-col :xs="24" :sm="12">
                        <a-form-item label="确认按钮文字" required>
                            <a-input
                                v-model:value="newVersionForm.confirmText"
                                placeholder="请输入确认按钮文字"
                            />
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :sm="12">
                        <a-form-item label="版本摘要">
                            <a-input
                                v-model:value="newVersionForm.summary"
                                placeholder="请输入版本摘要（可选）"
                            />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="版本备注">
                    <a-textarea
                        v-model:value="newVersionForm.versionRemark"
                        :rows="2"
                        placeholder="请输入版本备注（可选）"
                    />
                </a-form-item>
            </a-form>
            <div class="modal-footer">
                <a-button @click="showNewVersionModal = false">取消</a-button>
                <a-button type="primary" :loading="creatingVersion" @click="handleCreateVersion">
                    创建版本
                </a-button>
            </div>
        </a-modal>

        <!-- 版本详情弹窗 -->
        <a-modal
            v-model:open="showVersionDetailModal"
            title="版本详情"
            :footer="null"
            @cancel="showVersionDetailModal = false"
        >
            <template v-if="selectedVersion">
                <a-descriptions :column="2" bordered class="mb-4">
                    <a-descriptions-item label="版本ID">{{ selectedVersion.versionId }}</a-descriptions-item>
                    <a-descriptions-item label="版本标题">{{ selectedVersion.title }}</a-descriptions-item>
                    <a-descriptions-item label="确认按钮文字">{{ selectedVersion.confirmText || '-' }}</a-descriptions-item>
                    <a-descriptions-item label="版本摘要">{{ selectedVersion.summary || '-' }}</a-descriptions-item>
                    <a-descriptions-item label="版本备注">{{ selectedVersion.versionRemark || '-' }}</a-descriptions-item>
                    <a-descriptions-item label="发布状态">
                        <a-tag :color="selectedVersion.isPublished ? 'green' : 'orange'">
                            {{ selectedVersion.isPublished ? '已发布' : '未发布' }}
                        </a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="创建时间">{{ selectedVersion.createdAt || '-' }}</a-descriptions-item>
                    <a-descriptions-item label="发布时间">{{ selectedVersion.publishedAt || '-' }}</a-descriptions-item>
                </a-descriptions>
                <div class="content-section">
                    <h4>正文内容</h4>
                    <div class="content-box">
                        {{ selectedVersion.contentHtml }}
                    </div>
                </div>
            </template>
            <div class="modal-footer">
                <a-button @click="showVersionDetailModal = false">关闭</a-button>
            </div>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    Checkbox as ACheckbox,
    Col as ACol,
    Descriptions as ADescriptions,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    message,
    Modal as AModal,
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Spin as ASpin,
    Steps as ASteps,
    Step as AStep,
    Table as ATable,
    Tag as ATag,
    Textarea as ATextarea,
} from 'ant-design-vue';

import {
    getDisclaimerDocDetail,
    updateDisclaimerDoc,
    createDisclaimerVersion,
    publishDisclaimerVersion,
    type DisclaimerDocDetailVO,
    type DisclaimerVersionVO,
    type UpdateDisclaimerDocReq,
    type CreateDisclaimerVersionReq,
    type PublishDisclaimerVersionReq,
} from '#/api/disclaimer';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const creatingVersion = ref(false);
const currentStep = ref(0);
const activeVersionTab = ref('current');
const showNewVersionModal = ref(false);
const showVersionDetailModal = ref(false);
const selectedVersion = ref<DisclaimerVersionVO | null>(null);

const detail = ref<DisclaimerDocDetailVO | null>(null);

const docForm = reactive({
    code: '',
    name: '',
    sceneType: '',
    confirmMode: 'CHECKBOX',
    requireCheckboxConfirm: false,
    requireScrollToEnd: false,
    forceReconfirmOnUpdate: false,
    description: '',
});

const newVersionForm = reactive({
    title: '',
    contentHtml: '',
    confirmText: '我已阅读并同意',
    summary: '',
    versionRemark: '',
});

const versionColumns = [
    {title: '版本ID', dataIndex: 'versionId', key: 'versionId'},
    {title: '版本标题', dataIndex: 'title', key: 'title'},
    {title: '发布状态', key: 'isPublished', width: 120},
    {title: '创建时间', dataIndex: 'createdAt', key: 'createdAt'},
    {title: '操作', key: 'actions', width: 150},
];

async function fetchDetail(id: number) {
    loading.value = true;
    try {
        const res = await getDisclaimerDocDetail(id);
        detail.value = res;
        fillForm(res);
    } catch (e: any) {
        message.error(e?.message || '获取详情失败');
        detail.value = null;
    } finally {
        loading.value = false;
    }
}

function fillForm(data: DisclaimerDocDetailVO) {
    docForm.code = data.code;
    docForm.name = data.name;
    docForm.sceneType = data.sceneType;
    docForm.confirmMode = data.confirmMode;
    docForm.requireCheckboxConfirm = data.requireCheckboxConfirm ?? false;
    docForm.requireScrollToEnd = data.requireScrollToEnd ?? false;
    docForm.forceReconfirmOnUpdate = data.forceReconfirmOnUpdate ?? false;
    docForm.description = data.description || '';
}

function handlePrev() {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
}

function handleNext() {
    if (currentStep.value === 0) {
        if (!validateDocForm()) return;
    }
    currentStep.value++;
}

function validateDocForm(): boolean {
    if (!docForm.name.trim()) {
        message.error('请输入文档名称');
        return false;
    }
    if (!docForm.sceneType) {
        message.error('请选择适用场景');
        return false;
    }
    if (!docForm.confirmMode) {
        message.error('请选择确认方式');
        return false;
    }
    return true;
}

async function handleUpdateDoc() {
    if (!validateDocForm() || !detail.value) return;

    submitting.value = true;
    try {
        const req: UpdateDisclaimerDocReq = {
            id: detail.value.id,
            name: docForm.name,
            sceneType: docForm.sceneType,
            confirmMode: docForm.confirmMode,
            requireCheckboxConfirm: docForm.requireCheckboxConfirm,
            requireScrollToEnd: docForm.requireScrollToEnd,
            forceReconfirmOnUpdate: docForm.forceReconfirmOnUpdate,
            description: docForm.description || null,
        };

        await updateDisclaimerDoc(req);
        message.success('文档信息更新成功');
    } catch (e: any) {
        message.error(e?.message || '更新失败');
    } finally {
        submitting.value = false;
    }
}

function handleViewVersion(version: DisclaimerVersionVO | null) {
    if (!version) return;
    selectedVersion.value = version;
    showVersionDetailModal.value = true;
}

async function handleCreateVersion() {
    if (!newVersionForm.title.trim() || !newVersionForm.contentHtml.trim() || !detail.value) {
        message.error('请填写完整的版本信息');
        return;
    }

    creatingVersion.value = true;
    try {
        const req: CreateDisclaimerVersionReq = {
            docId: detail.value.id,
            title: newVersionForm.title,
            contentHtml: newVersionForm.contentHtml,
            confirmText: newVersionForm.confirmText,
            summary: newVersionForm.summary || null,
            versionRemark: newVersionForm.versionRemark || null,
        };

        await createDisclaimerVersion(req);
        message.success('版本创建成功');
        showNewVersionModal.value = false;
        newVersionForm.title = '';
        newVersionForm.contentHtml = '';
        newVersionForm.confirmText = '我已阅读并同意';
        newVersionForm.summary = '';
        newVersionForm.versionRemark = '';

        // 刷新详情
        await fetchDetail(detail.value.id);
    } catch (e: any) {
        message.error(e?.message || '创建版本失败');
    } finally {
        creatingVersion.value = false;
    }
}

async function handlePublishVersion(version: DisclaimerVersionVO | null) {
    if (!version || !detail.value) return;

    try {
        const req: PublishDisclaimerVersionReq = {
            docId: detail.value.id,
            versionId: version.versionId,
        };

        await publishDisclaimerVersion(req);
        message.success('版本发布成功');
        await fetchDetail(detail.value.id);
    } catch (e: any) {
        message.error(e?.message || '发布失败');
    }
}

function handleBack() {
    router.push({name: 'DisclaimerList'});
}

function getCurrentRouteId(): number | null {
    const id = route.params.id || route.query.id;
    return id == null ? null : Number(id);
}

function loadByRoute() {
    const id = getCurrentRouteId();
    if (!id) {
        detail.value = null;
        return;
    }
    fetchDetail(id);
}

onMounted(loadByRoute);
</script>

<style scoped>
.disclaimer-edit-page {
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

.version-section {
    padding: 16px;
}

.version-tabs {
    margin-bottom: 16px;
}

.content-section {
    margin-top: 12px;
}

.content-section h4 {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
}

.content-box {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 400px;
    overflow-y: auto;
}

.footer-buttons {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
}
</style>
