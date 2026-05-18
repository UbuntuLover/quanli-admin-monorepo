<template>
    <div class="product-edit-page">
        <a-card :bordered="false" class="edit-card">
            <template #title>
                <div class="page-title">
                    <a-space>
                        <a-button @click="handleBack">返回</a-button>
                        <span>编辑商品</span>
                        <a-tag color="blue">ID: {{ productIdText }}</a-tag>
                    </a-space>
                </div>
            </template>

            <template #extra>
                <a-space>
                    <a-button @click="fetchDetail" :loading="loading">刷新</a-button>
                    <a-button type="primary" :loading="submitting" @click="handleSubmit">
                        保存
                    </a-button>
                </a-space>
            </template>

            <a-spin :spinning="loading">
                <a-form ref="formRef" :model="formState" layout="vertical">
                    <a-row :gutter="16">
                        <a-col :xs="24" :md="12">
                            <a-form-item
                                label="商品名称"
                                name="name"
                                :rules="[{ required: true, message: '请输入商品名称' }]"
                            >
                                <a-input v-model:value="formState.name" placeholder="请输入商品名称" />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item
                                label="分类ID"
                                name="categoryId"
                                :rules="[{ required: true, message: '请输入分类ID' }]"
                            >
                                <a-input-number
                                    v-model:value="formState.categoryId"
                                    style="width: 100%"
                                    :min="1"
                                    :precision="0"
                                    placeholder="请输入分类ID（后续可改成分类选择器）"
                                />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="品牌ID" name="brandId">
                                <a-input-number
                                    v-model:value="formState.brandId"
                                    style="width: 100%"
                                    :min="1"
                                    :precision="0"
                                    placeholder="可选"
                                />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="商品状态" name="status">
                                <a-select v-model:value="formState.status" placeholder="请选择状态">
                                    <a-select-option value="ACTIVE">在售</a-select-option>
                                    <a-select-option value="INACTIVE">下架</a-select-option>
                                    <a-select-option value="SOLD_OUT">售罄</a-select-option>
                                </a-select>
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24">
                            <a-form-item label="副标题" name="subtitle">
                                <a-input v-model:value="formState.subtitle" placeholder="请输入副标题" />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24">
                            <a-form-item label="商品描述" name="description">
                                <a-textarea
                                    v-model:value="formState.description"
                                    :rows="5"
                                    placeholder="请输入商品描述"
                                />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="主图URL" name="mainImage">
                                <a-input v-model:value="formState.mainImage" placeholder="https://..." />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="视频URL" name="videoUrl">
                                <a-input v-model:value="formState.videoUrl" placeholder="https://..." />
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="新品" name="isNew">
                                <a-radio-group v-model:value="formState.isNew">
                                    <a-radio :value="1">是</a-radio>
                                    <a-radio :value="0">否</a-radio>
                                </a-radio-group>
                            </a-form-item>
                        </a-col>

                        <a-col :xs="24" :md="12">
                            <a-form-item label="热销" name="isHot">
                                <a-radio-group v-model:value="formState.isHot">
                                    <a-radio :value="1">是</a-radio>
                                    <a-radio :value="0">否</a-radio>
                                </a-radio-group>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <div class="footer-actions">
                        <a-space>
                            <a-button @click="handleBack">取消</a-button>
                            <a-button type="primary" :loading="submitting" @click="handleSubmit">保存</a-button>
                        </a-space>
                    </div>
                </a-form>
            </a-spin>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import type { FormInstance } from 'ant-design-vue';
import type { UpdateProductRequest } from '#/types/product';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Form as AForm,
    Input as AInput,
    InputNumber as AInputNumber,
    message,
    Radio as ARadio,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
} from 'ant-design-vue';

import { getProductDetailApi, updateProductApi } from '#/api/products/product';

const AFormItem = AForm.Item;
const ASelectOption = ASelect.Option;
const ATextarea = AInput.TextArea;
const ARadioGroup = ARadio.Group;

const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();

const loading = ref(false);
const submitting = ref(false);

const productId = computed(() => Number(route.params.id));
const productIdText = computed(() => (Number.isFinite(productId.value) ? productId.value : '-'));

const formState = reactive<UpdateProductRequest & { categoryId?: number }>({
    name: '',
    categoryId: undefined,
    brandId: undefined,
    subtitle: '',
    description: '',
    status: 'ACTIVE',
    isNew: 0,
    isHot: 0,
    mainImage: '',
    videoUrl: '',
});

onMounted(() => {
    fetchDetail();
});

async function fetchDetail() {
    if (!Number.isFinite(productId.value)) {
        message.error('商品ID无效');
        return;
    }

    loading.value = true;
    try {
        const detail = await getProductDetailApi(productId.value);

        formState.name = detail.name || '';
        formState.categoryId = detail.categoryId;
        formState.brandId = detail.brandId;
        formState.subtitle = detail.subtitle || '';
        formState.description = detail.description || '';
        formState.status = detail.status || 'ACTIVE';
        formState.isNew = detail.isNew ?? 0;
        formState.isHot = detail.isHot ?? 0;
        formState.mainImage = detail.mainImage || '';
        formState.videoUrl = detail.videoUrl || '';
    } catch (e) {
        message.error('获取商品详情失败');
    } finally {
        loading.value = false;
    }
}

async function handleSubmit() {
    if (!Number.isFinite(productId.value)) {
        message.error('商品ID无效');
        return;
    }

    try {
        await formRef.value?.validate();

        submitting.value = true;

        const payload: UpdateProductRequest = {
            name: formState.name?.trim(),
            categoryId: formState.categoryId,
            brandId: formState.brandId,
            subtitle: formState.subtitle?.trim() || undefined,
            description: formState.description?.trim() || undefined,
            status: formState.status,
            isNew: formState.isNew,
            isHot: formState.isHot,
            mainImage: formState.mainImage?.trim() || undefined,
            videoUrl: formState.videoUrl?.trim() || undefined,
        };

        await updateProductApi(productId.value, payload);
        message.success('保存成功');
        router.push(`/products/detail/${productId.value}`);
    } catch (e) {
        if ((e as any)?.errorFields) return;
        message.error('保存失败');
    } finally {
        submitting.value = false;
    }
}

function handleBack() {
    if (Number.isFinite(productId.value)) {
        router.push(`/products/detail/${productId.value}`);
        return;
    }
    router.push('/products/list');
}
</script>

<style scoped>
.product-edit-page {
    min-height: 100%;
    padding: 16px;
    color: hsl(var(--foreground));
    background: hsl(var(--background));
}

.edit-card {
    background: hsl(var(--card));
}

.page-title {
    color: hsl(var(--foreground));
}

.footer-actions {
    margin-top: 12px;
    text-align: right;
}
</style>
