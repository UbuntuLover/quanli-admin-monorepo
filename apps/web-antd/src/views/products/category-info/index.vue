<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import type { TreeProps, UploadFile, UploadProps } from 'ant-design-vue';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Empty as AEmpty,
    Form as AForm,
    FormItem as AFormItem,
    Image as AImage,
    Input as AInput,
    InputNumber as AInputNumber,
    Modal as AModal,
    Progress as AProgress,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    Tree as ATree,
    Upload as AUpload,
    message,
} from 'ant-design-vue';

import {
    createCategoryApi,
    deleteCategoryApi,
    getCategoryDetailApi,
    getCategoryTreeApi,
    previewDeleteCategoryApi,
    updateCategoryApi,
} from '#/api/products/productCategory';

import type {
    CategoryDTO,
    CategoryDeletePreviewDTO,
    CreateCategoryRequest,
    UpdateCategoryRequest,
} from '#/types/category';

import { uploadByPolicy } from '#/utils/upload-by-policy';
import { getFilePreviewApi } from '#/api/file';
import type { SysFileVO } from '#/api/file';

type ParentOption = {
    label: string;
    value: string;
    level: number;
    disabled?: boolean;
    pathText?: string;
};

const treeLoading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const creating = ref(false);

const treeData = ref<CategoryDTO[]>([]);
const selectedKeys = ref<string[]>([]);
const manualExpandedKeys = ref<string[]>([]);
const autoExpandedBySearch = ref<string[]>([]);
const treeKeyword = ref('');

const currentId = ref<string | null>(null);
const currentDetail = ref<CategoryDTO | null>(null);

const editForm = reactive({
    name: '',
    parentId: '0',
    sort: 0,
    icon: '',
    status: 'ACTIVE',
});

const iconUploading = ref(false);
const iconProgress = ref(0);
const iconFileList = ref<UploadFile[]>([]);

const createChildModalVisible = ref(false);
const createChildParentId = ref<string>('0');
const createChildParentName = ref('');
const createChildForm = reactive({
    name: '',
    sort: 0,
    icon: '',
});
const createIconUploading = ref(false);
const createIconProgress = ref(0);
const createIconFileList = ref<UploadFile[]>([]);

const deletePreviewVisible = ref(false);
const deletePreviewLoading = ref(false);
const deletePreview = ref<CategoryDeletePreviewDTO | null>(null);
const deleting = ref(false);

// 站内预览状态
const previewVisible = ref(false);
const previewImage = ref('');

const parentOptions = ref<ParentOption[]>([
    { label: '顶级分类 [L0]', value: '0', level: 0, pathText: '顶级分类' },
]);

const levelMap = ref<Record<string, number>>({ '0': 0 });
const parentMap = ref<Record<string, string>>({});
const childrenMap = ref<Record<string, string[]>>({});

const currentLevel = computed(() => {
    if (!currentDetail.value) return 0;
    return Number(currentDetail.value.level || 1);
});

function normalize(s: string) {
    return (s || '').trim().toLowerCase();
}

function highlightText(text: string, keyword: string) {
    const kw = keyword.trim();
    if (!kw) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx < 0) return text;

    const pre = text.slice(0, idx);
    const hit = text.slice(idx, idx + kw.length);
    const post = text.slice(idx + kw.length);

    return h('span', [
        pre,
        h(
            'span',
            {
                style: {
                    color: '#1677ff',
                    fontWeight: 700,
                    background: 'rgba(22,119,255,0.12)',
                    padding: '0 2px',
                    borderRadius: '2px',
                },
            },
            hit,
        ),
        post,
    ]);
}

/**
 * 统一拿“可访问预览链接”，避免保存裸链 url
 */
async function resolveDisplayUrl(file: SysFileVO): Promise<string> {
    if (file.previewUrl && /^https?:\/\//i.test(file.previewUrl)) {
        return file.previewUrl;
    }
    try {
        const p = await getFilePreviewApi(file.id, 1200, 1200);
        if (p?.previewUrl) return p.previewUrl;
        if (p?.thumbUrl) return p.thumbUrl;
    } catch {
        // ignore
    }
    return file.url || '';
}

const treeNodes = computed<TreeProps['treeData']>(() => {
    const kw = normalize(treeKeyword.value);
    autoExpandedBySearch.value = [];

    const dfs = (nodes: CategoryDTO[]): any[] => {
        const result: any[] = [];

        for (const node of nodes || []) {
            const id = String(node.id);
            const titleText = `${node.name} [L${node.level}]`;
            const children = dfs(node.children || []);

            const selfMatched =
                !kw ||
                normalize(node.name).includes(kw) ||
                normalize(titleText).includes(kw);

            if (!selfMatched && children.length === 0) continue;

            if (kw && children.length > 0) {
                autoExpandedBySearch.value.push(id);
            }

            result.push({
                key: id,
                title: kw ? highlightText(titleText, treeKeyword.value) : titleText,
                children,
            });
        }

        return result;
    };

    return dfs(treeData.value);
});

const finalExpandedKeys = computed(() => {
    const kw = normalize(treeKeyword.value);
    if (!kw) return manualExpandedKeys.value;
    return Array.from(
        new Set([...manualExpandedKeys.value, ...autoExpandedBySearch.value]),
    );
});

function buildMapsFromTree(nodes: CategoryDTO[], parentId = '0') {
    for (const n of nodes || []) {
        const id = String(n.id);
        parentMap.value[id] = parentId;
        buildMapsFromTree(n.children || [], id);
    }
}

function getDescendants(id: string): string[] {
    const result: string[] = [];
    const dfs = (target: string) => {
        const children = Object.entries(parentMap.value)
            .filter(([, p]) => p === target)
            .map(([cid]) => cid);
        for (const c of children) {
            result.push(c);
            dfs(c);
        }
    };
    dfs(id);
    return result;
}

function rebuildTreeHelpers() {
    parentMap.value = {};
    childrenMap.value = {};
    levelMap.value = { '0': 0 };

    buildMapsFromTree(treeData.value, '0');

    const fillLevel = (nodes: CategoryDTO[]) => {
        nodes.forEach((n) => {
            levelMap.value[String(n.id)] = Number(n.level || 1);
            if (n.children?.length) fillLevel(n.children);
        });
    };
    fillLevel(treeData.value);

    Object.keys(parentMap.value).forEach((id) => {
        childrenMap.value[id] = getDescendants(id);
    });
}

function buildParentOptions() {
    const result: ParentOption[] = [
        { label: '顶级分类 [L0]', value: '0', level: 0, pathText: '顶级分类' },
    ];

    const dfs = (nodes: CategoryDTO[], path = '') => {
        for (const n of nodes || []) {
            const id = String(n.id);
            const lv = Number(n.level || 1);
            const currentPath = path ? `${path} / ${n.name}` : n.name;
            const indent = lv > 1 ? `${'　'.repeat(lv - 2)}└─ ` : '';

            result.push({
                value: id,
                level: lv,
                label: `${indent}${n.name} [L${lv}]`,
                pathText: currentPath,
            });

            if (n.children?.length) dfs(n.children, currentPath);
        }
    };

    dfs(treeData.value);
    parentOptions.value = result;
}

function filterParentOption(input: string, option: any) {
    const kw = input.trim().toLowerCase();
    if (!kw) return true;
    const label = String(option?.label ?? '').toLowerCase();
    const path = String(option?.pathText ?? '').toLowerCase();
    return label.includes(kw) || path.includes(kw);
}

function getCurrentParentOptions() {
    const id = currentId.value;
    if (!id) return parentOptions.value;

    const selfAndDesc = new Set<string>([id, ...(childrenMap.value[id] || [])]);

    return parentOptions.value.map((o) => {
        const isSelfOrDesc = selfAndDesc.has(o.value);
        const exceed3 = o.level + 1 > 3;
        return {
            ...o,
            disabled: isSelfOrDesc || exceed3,
        };
    });
}

async function loadTree(preserveSelection = true) {
    try {
        treeLoading.value = true;
        const tree = (await getCategoryTreeApi()) as CategoryDTO[];
        treeData.value = tree || [];

        rebuildTreeHelpers();
        buildParentOptions();

        const allIds: string[] = [];
        const collect = (nodes: CategoryDTO[]) => {
            nodes.forEach((n) => {
                allIds.push(String(n.id));
                if (n.children?.length) collect(n.children);
            });
        };
        collect(treeData.value);
        manualExpandedKeys.value = allIds;

        if (!preserveSelection) return;

        if (currentId.value) {
            const exists = allIds.includes(currentId.value);
            if (exists) {
                await loadDetail(currentId.value);
            } else {
                currentId.value = null;
                currentDetail.value = null;
                selectedKeys.value = [];
            }
        }
    } catch (e: any) {
        message.error(e?.message || '加载分类树失败');
    } finally {
        treeLoading.value = false;
    }
}

async function loadDetail(id: string) {
    try {
        detailLoading.value = true;
        const detail = (await getCategoryDetailApi(id as any)) as CategoryDTO;

        currentDetail.value = detail;
        currentId.value = String(detail.id);
        selectedKeys.value = [String(detail.id)];

        editForm.name = detail.name;
        editForm.parentId = String(detail.parentId ?? '0');
        editForm.sort = Number(detail.sort || 0);
        editForm.icon = detail.icon || '';  // 保持存储 fileId
        editForm.status = detail.status || 'ACTIVE';

        if (detail.icon) {
            const iconFileId = Number(detail.icon);
            if (!isNaN(iconFileId) && iconFileId > 0) {
                // 调用预览接口获取 URL
                try {
                    const preview = await getFilePreviewApi(iconFileId);
                    iconFileList.value = [{
                        uid: String(iconFileId),
                        name: '分类图标',
                        status: 'done',
                        url: preview.previewUrl || preview.thumbUrl || '',
                    }];
                } catch {
                    // 获取预览失败，使用原 icon 作为 URL（兼容旧数据）
                    iconFileList.value = [{
                        uid: String(detail.id),
                        name: '分类图标',
                        status: 'done',
                        url: detail.icon,
                    }];
                }
            } else {
                // 非数字格式，直接作为 URL 使用
                iconFileList.value = [{
                    uid: String(detail.id),
                    name: '分类图标',
                    status: 'done',
                    url: detail.icon,
                }];
            }
        } else {
            iconFileList.value = [];
        }
    } catch (e: any) {
        message.error(e?.message || '加载分类详情失败');
    } finally {
        detailLoading.value = false;
    }
}

const onTreeSelect: TreeProps['onSelect'] = async (keys) => {
    const id = String(keys?.[0] || '');
    if (!id) return;
    await loadDetail(id);
};

const handleUploadPreview: UploadProps['onPreview'] = async (file) => {
    const src = String(file.url || file.thumbUrl || '');
    if (!src) return false;
    previewImage.value = src;
    previewVisible.value = true;
    return false;
};

const beforeIconUpload: UploadProps['beforeUpload'] = async (raw) => {
    const file = raw as File;
    try {
        iconUploading.value = true;
        iconProgress.value = 0;
        const saved = (await uploadByPolicy(file, {
            bizType: 'product',
            mediaType: 'image',
            onProgress: (p) => (iconProgress.value = p),
        })) as SysFileVO;

        const displayUrl = await resolveDisplayUrl(saved);

        editForm.icon = String(saved.id);  // 修改：存储 fileId
        iconFileList.value = [
            {
                uid: String(saved.id),
                name: saved.originalName || file.name,
                status: 'done',
                url: displayUrl,  // 显示使用预览 URL
            },
        ];
        message.success('图标上传成功');
    } catch (e: any) {
        message.error(e?.message || '图标上传失败');
    } finally {
        iconUploading.value = false;
    }
    return false;
};

function removeIcon() {
    editForm.icon = '';
    iconFileList.value = [];
    iconProgress.value = 0;
    return true;
}

async function handleSave() {
    if (!currentId.value) return;
    try {
        if (!editForm.name.trim()) throw new Error('分类名称不能为空');

        const parentLv = levelMap.value[editForm.parentId] ?? 0;
        if (parentLv + 1 > 3) throw new Error('仅支持到第三级目录');

        saving.value = true;

        const payload: UpdateCategoryRequest = {
            name: editForm.name.trim(),
            parentId: editForm.parentId,
            sort: Number(editForm.sort || 0),
            icon: editForm.icon,
            status: editForm.status,
        };

        await updateCategoryApi(currentId.value as any, payload);
        message.success('保存成功');
        await loadTree(true);
    } catch (e: any) {
        message.error(e?.message || '保存失败');
    } finally {
        saving.value = false;
    }
}

function openCreateChild() {
    if (!currentId.value || !currentDetail.value) {
        message.warning('请先选择一个分类');
        return;
    }
    if (currentLevel.value >= 3) {
        message.warning('第三级分类下不能再创建子分类');
        return;
    }

    createChildParentId.value = currentId.value;
    createChildParentName.value = currentDetail.value.name;
    createChildForm.name = '';
    createChildForm.sort = 0;
    createChildForm.icon = '';
    createIconFileList.value = [];
    createIconProgress.value = 0;
    createChildModalVisible.value = true;
}

const beforeCreateIconUpload: UploadProps['beforeUpload'] = async (raw) => {
    const file = raw as File;
    try {
        createIconUploading.value = true;
        createIconProgress.value = 0;
        const saved = (await uploadByPolicy(file, {
            bizType: 'product',
            mediaType: 'image',
            onProgress: (p) => (createIconProgress.value = p),
        })) as SysFileVO;

        const displayUrl = await resolveDisplayUrl(saved);

        createChildForm.icon = String(saved.id);  // 修改：存储 fileId
        createIconFileList.value = [
            {
                uid: String(saved.id),
                name: saved.originalName || file.name,
                status: 'done',
                url: displayUrl,  // 显示使用预览 URL
            },
        ];
        message.success('图标上传成功');
    } catch (e: any) {
        message.error(e?.message || '图标上传失败');
    } finally {
        createIconUploading.value = false;
    }
    return false;
};

function removeCreateIcon() {
    createChildForm.icon = '';
    createIconFileList.value = [];
    createIconProgress.value = 0;
    return true;
}

async function submitCreateChild() {
    try {
        if (!createChildForm.name.trim()) throw new Error('分类名称不能为空');

        const pLv = levelMap.value[createChildParentId.value] ?? 0;
        if (pLv + 1 > 3) throw new Error('仅支持创建到第三级目录');

        creating.value = true;
        const payload: CreateCategoryRequest = {
            name: createChildForm.name.trim(),
            parentId: createChildParentId.value,
            sort: Number(createChildForm.sort || 0),
            icon: createChildForm.icon,
        };

        const created = await createCategoryApi(payload);
        message.success(`创建成功：${created.name}`);
        createChildModalVisible.value = false;

        await loadTree(false);
        await loadDetail(String(created.id));
    } catch (e: any) {
        message.error(e?.message || '创建失败');
    } finally {
        creating.value = false;
    }
}

async function openDeletePreview() {
    if (!currentId.value) {
        message.warning('请先选择要删除的分类');
        return;
    }
    try {
        deletePreviewLoading.value = true;
        deletePreview.value = (await previewDeleteCategoryApi(
            currentId.value as any,
        )) as CategoryDeletePreviewDTO;
        deletePreviewVisible.value = true;
    } catch (e: any) {
        message.error(e?.message || '获取删除预览失败');
    } finally {
        deletePreviewLoading.value = false;
    }
}

async function confirmDelete() {
    if (!currentId.value) return;
    try {
        deleting.value = true;
        await deleteCategoryApi(currentId.value as any);
        message.success('删除成功');
        deletePreviewVisible.value = false;
        currentId.value = null;
        currentDetail.value = null;
        selectedKeys.value = [];
        await loadTree(false);
    } catch (e: any) {
        message.error(e?.message || '删除失败');
    } finally {
        deleting.value = false;
    }
}

watch(treeKeyword, (v) => {
    if (!normalize(v) && currentId.value) {
        if (!manualExpandedKeys.value.includes(currentId.value)) {
            manualExpandedKeys.value = [...manualExpandedKeys.value, currentId.value];
        }
    }
});

onMounted(async () => {
    await loadTree(false);
});
</script>

<template>
    <div style="padding: 16px">
        <a-row :gutter="16">
            <a-col :span="8">
                <a-card title="分类树" :bordered="false">
                    <template #extra>
                        <a-button size="small" @click="loadTree(true)">刷新</a-button>
                    </template>

                    <div style="margin-bottom: 10px">
                        <a-input
                            v-model:value="treeKeyword"
                            allow-clear
                            placeholder="搜索分类名称（支持层级关键字）"
                        />
                    </div>

                    <a-spin :spinning="treeLoading">
                        <a-tree
                            :tree-data="treeNodes"
                            :expanded-keys="finalExpandedKeys"
                            :selected-keys="selectedKeys"
                            block-node
                            @select="onTreeSelect"
                            @update:expandedKeys="(keys: any) => (manualExpandedKeys = keys as string[])"
                        />
                    </a-spin>
                </a-card>
            </a-col>

            <a-col :span="16">
                <a-card title="分类详情与编辑" :bordered="false">
                    <template #extra>
                        <a-space>
                            <a-button :disabled="!currentId" @click="openCreateChild">新增子分类</a-button>
                            <a-button danger :disabled="!currentId" @click="openDeletePreview">删除分类</a-button>
                        </a-space>
                    </template>

                    <a-spin :spinning="detailLoading">
                        <a-empty v-if="!currentId" description="请选择左侧分类查看详情" />
                        <a-form v-else layout="vertical">
                            <a-form-item label="分类ID">
                                <a-input :value="String(currentId)" disabled />
                            </a-form-item>

                            <a-form-item label="分类名称" required>
                                <a-input v-model:value="editForm.name" :maxlength="50" />
                            </a-form-item>

                            <a-form-item label="父分类">
                                <a-select
                                    v-model:value="editForm.parentId"
                                    :options="getCurrentParentOptions()"
                                    show-search
                                    :filter-option="filterParentOption"
                                    option-filter-prop="label"
                                />
                            </a-form-item>

                            <a-form-item label="排序">
                                <a-input-number
                                    v-model:value="editForm.sort"
                                    :min="0"
                                    :step="1"
                                    style="width: 100%"
                                />
                            </a-form-item>

                            <a-form-item label="状态">
                                <a-select
                                    v-model:value="editForm.status"
                                    :options="[
                    { label: '激活', value: 'ACTIVE' },
                    { label: '未激活', value: 'INACTIVE' },
                  ]"
                                />
                            </a-form-item>

                            <a-form-item label="分类图标">
                                <a-upload
                                    accept="image/*"
                                    list-type="picture-card"
                                    :file-list="iconFileList"
                                    :before-upload="beforeIconUpload"
                                    :on-preview="handleUploadPreview"
                                    :max-count="1"
                                    @remove="removeIcon"
                                >
                                    <div v-if="iconFileList.length < 1">上传图标</div>
                                </a-upload>
                                <a-progress v-if="iconUploading" :percent="iconProgress" size="small" />
                            </a-form-item>

                            <a-form-item>
                                <a-space>
                                    <a-button type="primary" :loading="saving" @click="handleSave">保存修改</a-button>
                                    <a-tag color="blue">当前层级 L{{ currentLevel }}</a-tag>
                                </a-space>
                            </a-form-item>
                        </a-form>
                    </a-spin>
                </a-card>
            </a-col>
        </a-row>

        <a-modal
            v-model:open="createChildModalVisible"
            title="新增子分类"
            :confirm-loading="creating"
            @ok="submitCreateChild"
        >
            <a-form layout="vertical">
                <a-form-item label="父分类">
                    <a-input :value="createChildParentName" disabled />
                </a-form-item>

                <a-form-item label="分类名称" required>
                    <a-input v-model:value="createChildForm.name" :maxlength="50" />
                </a-form-item>

                <a-form-item label="排序">
                    <a-input-number
                        v-model:value="createChildForm.sort"
                        :min="0"
                        :step="1"
                        style="width: 100%"
                    />
                </a-form-item>

                <a-form-item label="分类图标">
                    <a-upload
                        accept="image/*"
                        list-type="picture-card"
                        :file-list="createIconFileList"
                        :before-upload="beforeCreateIconUpload"
                        :on-preview="handleUploadPreview"
                        :max-count="1"
                        @remove="removeCreateIcon"
                    >
                        <div v-if="createIconFileList.length < 1">上传图标</div>
                    </a-upload>
                    <a-progress v-if="createIconUploading" :percent="createIconProgress" size="small" />
                </a-form-item>
            </a-form>
        </a-modal>

        <a-modal
            v-model:open="deletePreviewVisible"
            title="删除分类预览"
            :confirm-loading="deleting"
            ok-text="确认删除"
            :ok-button-props="{ danger: true }"
            @ok="confirmDelete"
        >
            <a-spin :spinning="deletePreviewLoading">
                <div v-if="deletePreview">
                    <p><b>分类：</b>{{ deletePreview.categoryName }}（L{{ deletePreview.categoryLevel }}）</p>
                    <p><b>涉及分类数：</b>{{ deletePreview.categoryCount }}</p>
                    <p><b>涉及商品数：</b>{{ deletePreview.productCount }}</p>
                    <p><b>涉及SKU数：</b>{{ deletePreview.skuCount }}</p>
                    <p><b>涉及图片数：</b>{{ deletePreview.imageCount }}</p>
                    <p style="color: #ff4d4f; margin-top: 12px">{{ deletePreview.warningMessage }}</p>
                </div>
            </a-spin>
        </a-modal>

        <a-modal
            v-model:open="previewVisible"
            title="图片预览"
            :footer="null"
            centered
            width="720px"
            destroy-on-close
        >
            <div style="display: flex; justify-content: center; align-items: center; min-height: 240px">
                <a-image
                    v-if="previewImage"
                    :src="previewImage"
                    alt="分类图标预览"
                    style="max-width: 100%; max-height: 70vh; object-fit: contain"
                />
            </div>
        </a-modal>
    </div>
</template>
