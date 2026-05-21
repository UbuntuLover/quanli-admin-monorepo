<script setup lang="ts">
import {computed, onMounted, reactive, ref} from 'vue';
import type {UploadFile, UploadProps} from 'ant-design-vue';
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
    getCategoryTreeApi,
} from '#/api/products/productCategory';

import { uploadByPolicy } from '#/utils/upload-by-policy';
import type { SysFileVO } from '#/api/file';

import type {CategoryDTO} from '#/types/category';

type ParentOption = {
    label: string;
    value: string;
    level: number;
    disabled?: boolean;
    rawName?: string;
    pathText?: string;
};

const loading = ref(false);
const categoryLoading = ref(false);

const parentOptions = ref<ParentOption[]>([
    {
        label: '顶级分类 [L0]',
        value: '0',
        level: 0,
        disabled: false,
        rawName: '顶级分类',
        pathText: '顶级分类',
    },
]);

const parentLevelMap = ref<Record<string, number>>({0: 0});

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

const selectedParentLevel = computed(() => parentLevelMap.value[form.parentId] ?? 0);
const willCreateLevel = computed(() => selectedParentLevel.value + 1);

// ----------- 分类树处理（核心修复）-----------
function buildTreeOptions(nodes: CategoryDTO[], parentPath = ''): ParentOption[] {
    const result: ParentOption[] = [];

    for (const node of nodes || []) {
        const level = Number(node.level || 1);
        const name = node.name || '';
        const currentPath = parentPath ? `${parentPath} / ${name}` : name;

        // 视觉缩进：L1 无缩进，L2/L3 递进
        const indent = level > 1 ? `${'　'.repeat(level - 2)}└─ ` : '';

        result.push({
            value: String(node.id),
            label: `${indent}${name} [L${level}]`,
            level,
            rawName: name,
            pathText: currentPath,
            // 父级只能选到L2；L3禁选，避免创建L4
            disabled: level >= 3,
        });

        if (node.children?.length) {
            result.push(...buildTreeOptions(node.children, currentPath));
        }
    }

    return result;
}

function filterParentOption(input: string, option: any) {
    const kw = input.trim().toLowerCase();
    if (!kw) return true;

    const label = String(option?.label ?? '').toLowerCase();
    const rawName = String(option?.rawName ?? '').toLowerCase();
    const pathText = String(option?.pathText ?? '').toLowerCase();

    return label.includes(kw) || rawName.includes(kw) || pathText.includes(kw);
}

async function loadCategories() {
    try {
        categoryLoading.value = true;

        // 使用树接口，确保展示关系准确
        const tree = (await getCategoryTreeApi()) as CategoryDTO[];

        const options: ParentOption[] = [
            {
                label: '顶级分类 [L0]',
                value: '0',
                level: 0,
                disabled: false,
                rawName: '顶级分类',
                pathText: '顶级分类',
            },
            ...buildTreeOptions(tree || []),
        ];

        parentOptions.value = options;

        const levelMap: Record<string, number> = {0: 0};
        options.forEach((o) => {
            levelMap[o.value] = o.level;
        });
        parentLevelMap.value = levelMap;

        // 若当前选中项无效或被禁用，回退顶级
        const selected = options.find((x) => x.value === form.parentId);
        if (!selected || selected.disabled) {
            form.parentId = '0';
        }
    } catch (e: any) {
        message.error(e?.message || '加载分类失败');
    } finally {
        categoryLoading.value = false;
    }
}



const beforeIconUpload: UploadProps['beforeUpload'] = async (raw) => {
    const file = raw as File;
    try {
        iconUploading.value = true;
        iconProgress.value = 0;

        const saved: SysFileVO = await uploadByPolicy(file, {
            bizType: 'product',
            mediaType: 'image',
            onProgress: (p) => {
                iconProgress.value = p;
            },
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
    form.parentId = '0';
    form.sort = 0;
    form.icon = '';
    iconFileList.value = [];
    iconProgress.value = 0;
}

async function handleSubmit() {
    try {
        if (!form.name.trim()) throw new Error('分类名称不能为空');

        const parentLevel = parentLevelMap.value[form.parentId] ?? 0;
        const newLevel = parentLevel + 1;
        if (newLevel > 3) {
            throw new Error('仅支持创建到第三级目录，请选择顶级/一级/二级分类作为父级');
        }

        loading.value = true;

        const res = await createCategoryApi({
            name: form.name.trim(),
            parentId: form.parentId,
            sort: Number(form.sort || 0),
            icon: form.icon,
        });

        message.success(`创建成功：${res.name}`);

        // 刷新当前页数据（非整页reload）
        resetForm();
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
                        :maxlength="50"
                        placeholder="请输入分类名称"
                    />
                </a-form-item>

                <a-form-item label="父分类">
                    <a-select
                        v-model:value="form.parentId"
                        :options="parentOptions"
                        :loading="categoryLoading"
                        show-search
                        :filter-option="filterParentOption"
                        option-filter-prop="label"
                        placeholder="请选择父分类（仅允许创建到第三级）"
                    />
                    <div style="margin-top: 6px; color: #999; font-size: 12px">
                        当前父级层级：L{{ selectedParentLevel }}，新建后层级：L{{ willCreateLevel }}（仅支持 L1~L3）
                    </div>
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

                    <a-progress v-if="iconUploading" :percent="iconProgress" size="small"/>
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
