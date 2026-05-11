<template>
    <div class="p-4">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">编辑教练信息</div>
                        <div class="mt-1 text-xs text-gray-400">使用 /api/coach/profile 更新本人可编辑资料</div>
                    </div>
                    <a-space>
                        <a-tag v-if="ENABLE_MOCK" color="orange">Mock 模式</a-tag>
                        <a-button @click="goBack">返回</a-button>
                        <a-button type="primary" :loading="saving" @click="handleSubmit">保存</a-button>
                    </a-space>
                </div>
            </template>

            <a-spin :spinning="loading">
                <a-empty v-if="!baseInfo && !loading" description="未找到该教练"/>

                <a-form v-else layout="vertical">
                    <!-- 头像展示区（点击可编辑） -->
                    <div
                        class="mb-4 flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-gray-300 p-4 transition-colors hover:border-blue-400"
                        @click="openAvatarEditor"
                    >
                        <a-avatar :size="72" :src="avatarPreview || undefined" class="shrink-0">
                            <span class="avatar-fullname">{{ avatarFallbackFullName }}</span>
                        </a-avatar>

                        <div class="min-w-0 flex-1">
                            <div class="text-base font-semibold">{{ baseInfo?.name || '教练' }}</div>
                            <div class="mt-1 text-xs text-gray-500">点击此区域修改头像</div>
                            <div class="mt-1 truncate text-xs text-gray-400">
                                {{ avatarPreview || '当前未设置头像，将显示完整姓名' }}
                            </div>
                        </div>

                        <a-button size="small" @click.stop="openAvatarEditor">修改头像</a-button>
                    </div>

                    <a-row :gutter="16">
                        <a-col :span="12">
                            <a-form-item label="姓名">
                                <a-input :value="baseInfo?.name || '-'" disabled/>
                            </a-form-item>
                        </a-col>
                        <a-col :span="12">
                            <a-form-item label="状态">
                                <a-input :value="baseInfo?.isAvailable ? '可用' : '禁用'" disabled/>
                            </a-form-item>
                        </a-col>
                    </a-row>

                    <a-form-item label="联系电话（修改需验证码）">
                        <a-input v-model:value="form.phone" placeholder="请输入手机号"/>
                    </a-form-item>

                    <a-form-item label="短信验证码（仅修改手机号时必填）">
                        <a-input v-model:value="form.smsCode" placeholder="请输入验证码"/>
                    </a-form-item>

                    <a-form-item label="证书列表（逗号分隔）">
                        <a-input v-model:value="certText" placeholder="NASM-CPT, CPR"/>
                    </a-form-item>

                    <a-form-item label="教练标签（逗号分隔）">
                        <a-input v-model:value="tagText" placeholder="减脂, 康复, 私教"/>
                    </a-form-item>

                    <a-form-item label="教练介绍">
                        <a-textarea v-model:value="form.introduction" :rows="5" maxlength="2000" show-count/>
                    </a-form-item>

                    <!-- 照片预览（作为唯一编辑入口） -->
                    <a-form-item>
                        <template #label>
                            <div class="flex w-full items-center justify-between">
                                <span>教练照片</span>
                                <a-button size="small" type="dashed" @click="openPhotoEditor()">添加照片</a-button>
                            </div>
                        </template>

                        <a-empty v-if="photoList.length === 0" description="暂无可预览照片">
                            <a-button type="link" @click="openPhotoEditor()">添加第一张照片</a-button>
                        </a-empty>

                        <div v-else class="photo-grid">
                            <div v-for="(url, idx) in photoList" :key="url + idx" class="photo-item">
                                <a-image :src="url" :alt="`photo-${idx}`" class="photo-image"/>
                                <div class="photo-actions">
                                    <a-button size="small" @click="openPhotoEditor(url, idx)">替换</a-button>
                                    <a-button danger size="small" @click="removePhoto(idx)">删除</a-button>
                                </div>
                            </div>
                        </div>
                    </a-form-item>
                </a-form>
            </a-spin>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import {computed, onMounted, reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {listCoachesApi, updateMyCoachProfileApi, type CoachVO} from '#/api/coach/profile';
import {
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Empty as AEmpty,
    Form as AForm,
    FormItem as AFormItem,
    Image as AImage,
    Input as AInput,
    Modal,
    Row as ARow,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    message,
} from 'ant-design-vue';

defineOptions({name: 'CoachProfileEdit'});

const ENABLE_MOCK = false;

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);

const coachId = computed(() => Number(route.params.id));
const baseInfo = ref<CoachVO | null>(null);

const form = reactive({
    phone: '',
    smsCode: '',
    avatar: '',
    introduction: '',
});

const certText = ref('');
const tagText = ref('');
const photoText = ref(''); // 仍作为提交字段来源（换成可视化维护）

const mockCoachList: CoachVO[] = [
    {
        id: 101,
        name: '张伟',
        avatar: '',
        specialties: ['增肌训练', '力量训练'],
        venues: [{id: 1, name: '南山旗舰店'}],
        isAvailable: true,
        introduction: '拥有8年私教经验。',
        certifications: ['NASM-CPT', 'CPR'],
    },
    {
        id: 102,
        name: '李娜',
        avatar: '',
        specialties: ['瑜伽', '普拉提'],
        venues: [{id: 3, name: '罗湖店'}],
        isAvailable: false,
        introduction: '专注女性体态改善。',
        certifications: ['RYT-200'],
    },
];

const avatarPreview = computed(() => form.avatar?.trim() || baseInfo.value?.avatar?.trim() || '');
const avatarFallbackFullName = computed(() => baseInfo.value?.name?.trim() || '教练');

const photoList = computed(() =>
    (photoText.value || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
);

function splitCsv(text: string) {
    return (text || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function splitLines(text: string) {
    return (text || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
}

function sleep(time = 300) {
    return new Promise((resolve) => window.setTimeout(resolve, time));
}

function syncPhotoText(list: string[]) {
    photoText.value = list.join('\n');
}

function removePhoto(index: number) {
    const arr = [...photoList.value];
    arr.splice(index, 1);
    syncPhotoText(arr);
}

function openAvatarEditor() {
    let tempUrl = form.avatar || baseInfo.value?.avatar || '';

    Modal.confirm({
        title: '修改头像',
        content: '请输入头像图片 URL（后续可替换为上传组件）',
        okText: '确认',
        cancelText: '取消',
        centered: true,
        onOk: () => {
            form.avatar = (tempUrl || '').trim();
            message.success(form.avatar ? '头像已更新' : '已清空头像，将显示姓名');
        },
    });

    setTimeout(() => {
        const container = document.querySelector('.ant-modal-confirm-content');
        if (!container) return;

        const input = document.createElement('input');
        input.value = tempUrl;
        input.placeholder = 'https://...';
        input.style.width = '100%';
        input.style.marginTop = '8px';
        input.style.padding = '6px 8px';
        input.style.border = '1px solid #d9d9d9';
        input.style.borderRadius = '6px';

        input.oninput = (e: Event) => {
            tempUrl = (e.target as HTMLInputElement).value;
        };

        container.appendChild(input);
    }, 0);
}

function openPhotoEditor(current?: string, index?: number) {
    let tempUrl = current || '';

    Modal.confirm({
        title: current ? '替换照片' : '添加照片',
        content: '请输入照片 URL',
        okText: '确认',
        cancelText: '取消',
        centered: true,
        onOk: () => {
            const url = (tempUrl || '').trim();
            if (!url) {
                message.warning('请输入有效的照片 URL');
                return Promise.reject();
            }

            const arr = [...photoList.value];
            if (typeof index === 'number') arr[index] = url;
            else arr.push(url);

            syncPhotoText(arr);
            message.success(current ? '照片已替换' : '照片已添加');
            return Promise.resolve();
        },
    });

    setTimeout(() => {
        const container = document.querySelector('.ant-modal-confirm-content');
        if (!container) return;

        const input = document.createElement('input');
        input.value = tempUrl;
        input.placeholder = 'https://example.com/photo.jpg';
        input.style.width = '100%';
        input.style.marginTop = '8px';
        input.style.padding = '6px 8px';
        input.style.border = '1px solid #d9d9d9';
        input.style.borderRadius = '6px';

        input.oninput = (e: Event) => {
            tempUrl = (e.target as HTMLInputElement).value;
        };

        container.appendChild(input);
    }, 0);
}

async function fetchDetailByListFallback() {
    loading.value = true;
    try {
        const list = ENABLE_MOCK ? mockCoachList : await listCoachesApi();
        baseInfo.value = (list || []).find((x) => x.id === coachId.value) || null;

        if (!baseInfo.value) {
            message.warning('未找到该教练');
            return;
        }

        form.avatar = baseInfo.value.avatar || '';
        form.introduction = baseInfo.value.introduction || '';
        certText.value = (baseInfo.value.certifications || []).join(', ');

        // 你的 list 接口没有 photos 字段，这里先保留空，等待 profile 详情接口补齐后回填
        photoText.value = '';
    } finally {
        loading.value = false;
    }
}

async function handleSubmit() {
    if (!baseInfo.value) {
        message.warning('教练信息不存在，无法保存');
        return;
    }

    saving.value = true;
    try {
        const payload = {
            phone: form.phone || undefined,
            smsCode: form.smsCode || undefined,
            avatar: form.avatar || undefined,
            certificates: splitCsv(certText.value),
            tags: splitCsv(tagText.value),
            introduction: form.introduction || undefined,
            photos: splitLines(photoText.value),
        };

        if (ENABLE_MOCK) {
            await sleep();
            console.log('Mock 保存 payload:', payload);
            message.success('Mock：保存成功');
            goBack();
            return;
        }

        await updateMyCoachProfileApi(payload);
        message.success('保存成功');
        goBack();
    } catch (e) {
        console.error(e);
    } finally {
        saving.value = false;
    }
}

function goBack() {
    router.push({name: 'CoachProfileList'});
}

onMounted(fetchDetailByListFallback);
</script>

<style scoped>
.avatar-fullname {
    display: inline-block;
    max-width: 64px;
    white-space: normal;
    line-height: 1.1;
    text-align: center;
    font-size: 12px;
}

.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
    gap: 12px;
}

.photo-item {
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(128, 128, 128, 0.25);
    background: rgba(255, 255, 255, 0.02);
}

.photo-image {
    width: 100%;
    height: 140px;
    object-fit: cover;
    display: block;
}

.photo-actions {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
}
</style>
