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
                    <!-- 头像：固定圆形 + 点击上传 -->
                    <a-form-item label="教练头像">
                        <div class="coach-avatar-editor">
                            <div class="avatar-wrapper">
                                <a-avatar
                                    v-if="avatarPreview"
                                    :size="88"
                                    :src="avatarPreview"
                                    class="coach-avatar-preview"
                                    @click="openAvatarPicker"
                                />
                                <div v-else class="avatar-char" :style="{ backgroundColor: getAvatarColor(baseInfo?.name) }" @click="openAvatarPicker">
                                    {{ getAvatarChar(baseInfo?.name) }}
                                </div>
                            </div>

                            <div class="coach-avatar-meta">
                                <a-button :loading="avatarUploading" @click="openAvatarPicker">
                                    {{ avatarUploading ? '上传中...' : '更换头像' }}
                                </a-button>
                                <div class="mt-2 text-xs text-gray-400">
                                    要求：1:1 比例，jpg/png/webp，≤ 10MB
                                </div>
                            </div>
                        </div>

                        <input
                            ref="avatarInputRef"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            class="hidden"
                            @change="onAvatarFileChange"
                        />
                    </a-form-item>

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
                        <a-textarea v-model:value="form.introduction" :rows="5" :maxlength="2000" show-count/>
                    </a-form-item>

                    <!-- 教练照片：直接上传图片 -->
                    <a-form-item label="教练照片">
                        <MediaUpload
                            v-model="photoFiles"
                            biz-type="store"
                            :multiple="true"
                            :max-count="12"
                            :draggable="true"
                            list-type="card"
                            :accept-config="{ image: true, video: false }"
                            :limit-config="{ imageMaxSizeMb: 10, videoMaxSizeMb: 300 }"
                        />
                        <div class="mt-2 text-xs text-gray-400">已上传 {{ photoFiles.length }} 张图片</div>
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
import MediaUpload from '#/components/upload/media-upload.vue';
import type {MediaItem} from '#/components/upload';
import {uploadToOss} from '#/services/upload/oss-upload';
import {
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Empty as AEmpty,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    Row as ARow,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
    Textarea as ATextarea,
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

const avatarUploading = ref(false);
const avatarInputRef = ref<HTMLInputElement | null>(null);

/** 上传模型 */
const avatarFile = ref<MediaItem | null>(null);
const photoFiles = ref<MediaItem[]>([]);

// 橙黄色系头像颜色
const avatarColors = [
    '#FF8C00', // 深橙色
    '#FFA500', // 橙色
    '#FFB347', // 浅橙色
    '#FF9F43', // 橙黄色
    '#F39C12', // 金橙色
    '#E67E22', // 胡萝卜橙
    '#D35400', // 南瓜橙
    '#FF6B35', // 鲜橙色
];

function getAvatarColor(name?: string): string {
    if (!name) return avatarColors[0];
    const charCode = name.charCodeAt(0);
    const index = charCode % avatarColors.length;
    return avatarColors[index];
}

// 获取头像显示字符（英文名取第一个单词首字母）
function getAvatarChar(name?: string): string {
    if (!name) return '教';
    // 判断是否为纯英文
    if (/^[a-zA-Z\s]+$/.test(name.trim())) {
        const firstWord = name.trim().split(/\s+/)[0];
        return firstWord.charAt(0).toUpperCase();
    }
    // 中文或其他语言取第一个字符
    return name.charAt(0);
}

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

const avatarPreview = computed(
    () => avatarFile.value?.previewUrl?.trim() || avatarFile.value?.url?.trim() || form.avatar?.trim() || baseInfo.value?.avatar?.trim() || '',
);

function splitCsv(text: string) {
    return (text || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function sleep(time = 300) {
    return new Promise((resolve) => window.setTimeout(resolve, time));
}

function openAvatarPicker() {
    if (avatarUploading.value) return;
    avatarInputRef.value?.click();
}

function isAllowedImageType(file: File) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            URL.revokeObjectURL(url);
            resolve({width, height});
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('无法读取图片尺寸'));
        };
        img.src = url;
    });
}

async function onAvatarFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!isAllowedImageType(file)) {
        message.error('仅支持 jpg/jpeg/png/webp 图片');
        return;
    }

    const maxMb = 10;
    if (file.size / 1024 / 1024 > maxMb) {
        message.error(`头像大小不能超过 ${maxMb}MB`);
        return;
    }

    try {
        const {width, height} = await readImageSize(file);
        const ratio = width / height;
        const isSquare = Math.abs(ratio - 1) < 0.02; // 2% 容差
        if (!isSquare) {
            message.warning('头像需为 1:1 比例图片（圆形/方形展示都更清晰）');
            return;
        }

        avatarUploading.value = true;

        const uploaded = await uploadToOss({
            bizType: 'store',
            mediaType: 'image',
            file,
        });

        avatarFile.value = {
            fileId: uploaded.id,
            mediaType: 'image',
            url: uploaded.url,
            previewUrl: uploaded.previewUrl,
            originalName: uploaded.originalName,
            size: uploaded.size,
            mimeType: uploaded.mimeType,
            objectKey: uploaded.objectKey,
            coverUrl: '',
        };

        form.avatar = uploaded.previewUrl || uploaded.url;
        message.success('头像上传成功');
    } catch (e: any) {
        console.error(e);
        message.error(e?.message || '头像上传失败');
    } finally {
        avatarUploading.value = false;
    }
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
        tagText.value = (baseInfo.value.tags || []).join(', ');

               // 编辑态回填头像（如果有）
        avatarFile.value = form.avatar
            ? {
                fileId: -1,
                mediaType: 'image',
                url: form.avatar,
                previewUrl: form.avatar,
                originalName: 'avatar',
                size: 0,
                mimeType: 'image/jpeg',
                objectKey: '',
                coverUrl: '',
            }
            : null;

        // 你的 list 接口暂无 photos 字段，先保持空
        photoFiles.value = [];
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
            avatar: avatarFile.value?.previewUrl || avatarFile.value?.url || form.avatar || undefined,
            certificates: splitCsv(certText.value),
            tags: splitCsv(tagText.value),
            introduction: form.introduction || undefined,
            photos: photoFiles.value.map((x) => x.previewUrl || x.url).filter(Boolean),
            coachId: coachId.value,
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
.avatar-wrapper {
    flex-shrink: 0;
}

.avatar-char {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    cursor: pointer;
}

.avatar-char:hover {
    transform: scale(1.06);
    transition: transform 0.25s ease;
}

.coach-avatar-editor {
    display: flex;
    align-items: center;
    gap: 16px;
}

.coach-avatar-preview {
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
}

.coach-avatar-preview:hover {
    transform: scale(1.06);
    transition: transform 0.25s ease;
}

.coach-avatar-meta {
    min-width: 0;
}

.hidden {
    display: none;
}
</style>
