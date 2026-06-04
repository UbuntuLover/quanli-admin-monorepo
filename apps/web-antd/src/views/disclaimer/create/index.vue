<template>
    <div class="disclaimer-create-page">
        <a-card :bordered="false" class="create-card">
            <template #title>
                <div class="card-header">
                    <a-button type="link" @click="handleBack">
                        <a-icon component="ArrowLeft" />
                        返回
                    </a-button>
                    <span class="card-title">创建免责声明</span>
                </div>
            </template>

            <a-steps :current="currentStep" class="mb-6">
                <a-step title="文档信息" />
                <a-step title="版本内容" />
                <a-step title="确认发布" />
            </a-steps>

            <a-spin :spinning="loading">
                <template v-if="currentStep === 0">
                    <a-form layout="vertical" :model="docForm">
                        <a-row :gutter="16">
                            <a-col :xs="24" :sm="12">
                                <a-form-item label="文档编号" required>
                                    <a-input
                                        v-model:value="docForm.code"
                                        placeholder="请输入文档编号（如 DIS-COURSE-001）"
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
                    <a-form layout="vertical" :model="versionForm">
                        <a-form-item label="版本标题" required>
                            <a-input
                                v-model:value="versionForm.title"
                                placeholder="请输入版本标题"
                            />
                        </a-form-item>

                        <a-form-item label="正文内容" required>
                            <a-textarea
                                v-model:value="versionForm.contentHtml"
                                :rows="12"
                                placeholder="请输入免责声明正文内容"
                            />
                        </a-form-item>

                        <a-row :gutter="16">
                            <a-col :xs="24" :sm="12">
                                <a-form-item label="确认按钮文字" required>
                                    <a-input
                                        v-model:value="versionForm.confirmText"
                                        placeholder="请输入确认按钮文字（如：我已阅读并同意）"
                                    />
                                </a-form-item>
                            </a-col>
                            <a-col :xs="24" :sm="12">
                                <a-form-item label="版本摘要">
                                    <a-input
                                        v-model:value="versionForm.summary"
                                        placeholder="请输入版本摘要（可选）"
                                    />
                                </a-form-item>
                            </a-col>
                        </a-row>

                        <a-form-item label="版本备注">
                            <a-textarea
                                v-model:value="versionForm.versionRemark"
                                :rows="2"
                                placeholder="请输入版本备注（可选）"
                            />
                        </a-form-item>
                    </a-form>
                </template>

                <template v-else-if="currentStep === 2">
                    <div class="summary-section">
                        <h3 class="summary-title">文档信息</h3>
                        <a-descriptions :column="2" bordered class="mb-4">
                            <a-descriptions-item label="文档编号">{{ docForm.code }}</a-descriptions-item>
                            <a-descriptions-item label="文档名称">{{ docForm.name }}</a-descriptions-item>
                            <a-descriptions-item label="适用场景">{{ getSceneTypeText(docForm.sceneType) }}</a-descriptions-item>
                            <a-descriptions-item label="确认方式">{{ getConfirmModeText(docForm.confirmMode) }}</a-descriptions-item>
                            <a-descriptions-item label="需要勾选确认">{{ docForm.requireCheckboxConfirm ? '是' : '否' }}</a-descriptions-item>
                            <a-descriptions-item label="需要滚动到底">{{ docForm.requireScrollToEnd ? '是' : '否' }}</a-descriptions-item>
                            <a-descriptions-item label="更新需重新确认">{{ docForm.forceReconfirmOnUpdate ? '是' : '否' }}</a-descriptions-item>
                            <a-descriptions-item label="描述">{{ docForm.description || '-' }}</a-descriptions-item>
                        </a-descriptions>

                        <h3 class="summary-title">版本信息</h3>
                        <a-descriptions :column="2" bordered>
                            <a-descriptions-item label="版本标题">{{ versionForm.title }}</a-descriptions-item>
                            <a-descriptions-item label="确认按钮文字">{{ versionForm.confirmText }}</a-descriptions-item>
                            <a-descriptions-item label="版本摘要">{{ versionForm.summary || '-' }}</a-descriptions-item>
                            <a-descriptions-item label="版本备注">{{ versionForm.versionRemark || '-' }}</a-descriptions-item>
                        </a-descriptions>

                        <div class="content-preview mt-4">
                            <h4>正文预览</h4>
                            <div class="preview-content">
                                {{ versionForm.contentHtml || '暂无内容' }}
                            </div>
                        </div>
                    </div>
                </template>
            </a-spin>

            <div class="footer-buttons">
                <a-space>
                    <a-button v-if="currentStep > 0" @click="handlePrev">上一步</a-button>
                    <a-button
                        v-if="currentStep < 2"
                        type="primary"
                        @click="handleNext"
                    >
                        下一步
                    </a-button>
                    <a-button
                        v-if="currentStep === 2"
                        type="primary"
                        :loading="submitting"
                        @click="handleSubmit"
                    >
                        创建并发布
                    </a-button>
                    <a-button @click="handleBack">取消</a-button>
                </a-space>
            </div>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue';
import {useRouter} from 'vue-router';
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
    Row as ARow,
    Select as ASelect,
    SelectOption as ASelectOption,
    Space as ASpace,
    Spin as ASpin,
    Steps as ASteps,
    Step as AStep,
    Textarea as ATextarea,
} from 'ant-design-vue';

import {
    createPublishBindDisclaimer,
    type CreatePublishBindDisclaimerReq,
} from '#/api/disclaimer';

const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const currentStep = ref(0);

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

const versionForm = reactive({
    title: '',
    contentHtml: '',
    confirmText: '我已阅读并同意',
    summary: '',
    versionRemark: '',
});

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

function getConfirmModeText(confirmMode?: string): string {
    if (!confirmMode) return '-';
    const modeMap: Record<string, string> = {
        CHECKBOX: '勾选确认',
        SCROLL: '滚动确认',
        BOTH: '勾选+滚动',
    };
    return modeMap[confirmMode] || confirmMode;
}

function validateStep0(): boolean {
    if (!docForm.code.trim()) {
        message.error('请输入文档编号');
        return false;
    }
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

function validateStep1(): boolean {
    if (!versionForm.title.trim()) {
        message.error('请输入版本标题');
        return false;
    }
    if (!versionForm.contentHtml.trim()) {
        message.error('请输入正文内容');
        return false;
    }
    if (!versionForm.confirmText.trim()) {
        message.error('请输入确认按钮文字');
        return false;
    }
    return true;
}

function handlePrev() {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
}

function handleNext() {
    if (currentStep.value === 0) {
        if (!validateStep0()) return;
    } else if (currentStep.value === 1) {
        if (!validateStep1()) return;
    }
    currentStep.value++;
}

async function handleSubmit() {
    if (!validateStep0() || !validateStep1()) return;

    submitting.value = true;
    try {
        const req: CreatePublishBindDisclaimerReq = {
            doc: {
                code: docForm.code,
                name: docForm.name,
                sceneType: docForm.sceneType,
                confirmMode: docForm.confirmMode,
                requireCheckboxConfirm: docForm.requireCheckboxConfirm,
                requireScrollToEnd: docForm.requireScrollToEnd,
                forceReconfirmOnUpdate: docForm.forceReconfirmOnUpdate,
                description: docForm.description || null,
            },
            version: {
                title: versionForm.title,
                contentHtml: versionForm.contentHtml,
                confirmText: versionForm.confirmText,
                summary: versionForm.summary || null,
                versionRemark: versionForm.versionRemark || null,
            },
        };

        await createPublishBindDisclaimer(req);
        message.success('免责声明创建并发布成功');
        router.push({name: 'DisclaimerList'});
    } catch (e: any) {
        message.error(e?.message || '创建失败');
    } finally {
        submitting.value = false;
    }
}

function handleBack() {
    router.push({name: 'DisclaimerList'});
}

onMounted(() => {});
</script>

<style scoped>
.disclaimer-create-page {
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

.summary-section {
    padding: 16px;
}

.summary-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--color-text);
}

.content-preview {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px;
}

.content-preview h4 {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
}

.preview-content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);
    white-space: pre-wrap;
    word-break: break-all;
}

.footer-buttons {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
}
</style>
