<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { UploadFile, UploadProps } from 'ant-design-vue';
import {
    Button as AButton,
    Card as ACard,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    InputNumber as AInputNumber,
    Progress as AProgress,
    Select as ASelect,
    Space as ASpace,
    Upload as AUpload,
    message,
} from 'ant-design-vue';

import {
    createCategoryApi,
    getAllCategoriesApi,
} from '#/api/products/productCategory';

import {
    completeUploadApi,
    getUploadPolicyApi,
    type FileUploadPolicyVO,
    type SysFileVO,
} from '#/api/file';

import { baseRequestClient } from '#/api/request';
import type { CategoryDTO } from '#/types/category';

const router = useRouter();

const loading = ref(false);
const categoryLoading = ref(false);

// 父分类下拉
const parentOptions = ref<Array<{ label: string; value: string }>>([
    { label: '顶级分类', value: '0' },
]);

// 图标上传状态
const iconUploading = ref(false);
const iconProgress = ref(0);
const iconFileList = ref<UploadFile[]>([]);

const form = reactive({
    name: '',
    parentId: '0',
    sort: 0,
    icon: '',
});

function flattenTree(list: CategoryDTO[], result: CategoryDTO[] = []): CategoryDTO[] {
    for (const item of list) {
        result.push(item);
        if (item.children?.length) {
            flattenTree(item.children, result);
        }
    }
    return result;
}

function buildCategoryLabel(category: CategoryDTO) {
    const level = Number(category.level || 1);
    const prefix = level > 1 ? '—'.repeat(level - 1) : '';
    return `${prefix}${category.name}`;
}

async function loadCategories() {
    try {
        categoryLoading.value = true;
        const list = (await getAllCategoriesApi()) as CategoryDTO[];
        const flat = flattenTree(list || []);

        parentOptions.value = [
            { label: '顶级分类', value: '0' },
            ...flat.map((item) => ({
                label: buildCategoryLabel(item),
                value: item.id
            })),
        ];
    } catch (e: any) {
        message.error(e?.message || '加载分类失败');
    } finally {
        categoryLoading.value = false;
    }
}

/**
 * 上传核心流程：
 * 1) 调业务接口拿 policy
 * 2) 走 OSS endpoint 直传（使用 baseRequestClient，避免业务拦截器污染）
 * 3) 调业务接口 complete
 */
async function uploadImageWithPolicy(
    file: File,
    onProgress?: (p: number) => void,
): Promise<SysFileVO> {
    const policy = (await getUploadPolicyApi({
        bizType: 'product',
        mediaType: 'image',
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
    })) as FileUploadPolicyVO;

    const fd = new FormData();
    fd.append('key', policy.objectKey);
    fd.append('policy', policy.policy);
    fd.append('OSSAccessKeyId', policy.accessKeyId);
    fd.append('signature', policy.signature);
    fd.append('success_action_status', '200');
    fd.append('file', file);

    // 重点：使用 baseRequestClient 上传到外部 endpoint
    await baseRequestClient.post(policy.endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt: ProgressEvent) => {
            const total = evt.total || 0;
            if (!total) return;
            const percent = Math.round((evt.loaded / total) * 100);
            onProgress?.(percent);
        },
    });

    const saved = (await completeUploadApi({
        bizType: 'product',
        mediaType: 'image',
        objectKey: policy.objectKey,
        originalName: file.name,
        size: file.size,
        mimeType: file.type || 'image/jpeg',
    })) as SysFileVO;

    return saved;
}

const beforeIconUpload: UploadProps['beforeUpload'] = async (raw) => {
    const file = raw as File;

    try {
        iconUploading.value = true;
        iconProgress.value = 0;

        const saved = await uploadImageWithPolicy(file, (p) => {
            iconProgress.value = p;
        });

        form.icon = saved.url;
        iconFileList.value = [
            {
                uid: String(saved.id),
                name: saved.originalName || file.name,
                status: 'done',
                url: saved.previewUrl || saved.url,
            },
        ];

        message.success('分类图标上传成功');
    } catch (e: any) {
        message.error(e?.message || '分类图标上传失败');
    } finally {
        iconUploading.value = false;
    }

    return false;
};

function handleRemoveIcon() {
    form.icon = '';
    iconFileList.value = [];
    iconProgress.value = 0;
    return true;
}

function resetForm() {
    form.name = '';
    form.parentId = '';
    form.sort = 0;
    form.icon = '';
    iconFileList.value = [];
    iconProgress.value = 0;
}

async function handleSubmit() {
    try {
        if (!form.name.trim()) throw new Error('分类名称不能为空');

        loading.value = true;

        const res = await createCategoryApi({
            name: form.name.trim(),
            parentId: form.parentId,
            sort: Number(form.sort || 0),
            icon: form.icon,
        });

        message.success(`创建成功：${res.name}`);
        // 1) 重置表单
        resetForm();

        // 2) 重新加载父分类下拉（相当于刷新当前页面关键数据）
        await loadCategories();
    } catch (e: any) {
        message.error(e?.message || '创建失败');
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadCategories();
});
</script>

<template>
    <div style="padding: 16px">
        <a-card title="新建商品分类" :bordered="false">
            <a-form layout="vertical">
                <a-form-item label="分类名称" required>
                    <a-input
                        v-model:value="form.name"
                        :maxlength=50
                        placeholder="请输入分类名称"
                    />
                </a-form-item>

                <a-form-item label="父分类">
                    <a-select
                        v-model:value="form.parentId"
                        :options="parentOptions"
                        :loading="categoryLoading"
                        :filter-option="true"
                        option-filter-prop="label"
                        placeholder="请选择父分类（不选即顶级）"
                    />
                </a-form-item>

                <a-form-item label="排序">
                    <a-input-number
                        v-model:value="form.sort"
                        :min="0"
                        :step="1"
                        style="width: 100%"
                    />
                </a-form-item>

                <a-form-item label="分类图标">
                    <a-upload
                        accept="image/*"
                        list-type="picture-card"
                        :file-list="iconFileList"
                        :before-upload="beforeIconUpload"
                        :max-count="1"
                        @remove="handleRemoveIcon"
                    >
                        <div v-if="iconFileList.length < 1">上传图标</div>
                    </a-upload>

                    <a-progress v-if="iconUploading" :percent="iconProgress" size="small" />
                </a-form-item>

                <a-form-item>
                    <a-space>
                        <a-button type="primary" :loading="loading" @click="handleSubmit">
                            创建分类
                        </a-button>
                        <a-button @click="resetForm">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </a-card>
    </div>
</template>
