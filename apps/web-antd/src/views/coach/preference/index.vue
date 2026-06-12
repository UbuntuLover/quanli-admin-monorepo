<template>
    <a-card :bordered="false">
        <template #title>
            <span class="text-base font-semibold">设置教练偏好</span>
        </template>

        <div v-if="!memberId" class="empty-state">
            <p>请选择会员</p>
        </div>

        <template v-else>
            <a-form layout="vertical">
                <a-row :gutter="16" class="mb-4">
                    <a-col :span="12">
                        <a-form-item label="会员信息">
                            <a-card :bordered="false" class="member-info-card">
                                <div class="flex items-center gap-4">
                                    <a-avatar :size="64" :src="memberAvatarUrl">
                                        {{ (memberInfo.name || memberInfo.nickname || '用户')[0] }}
                                    </a-avatar>
                                    <div>
                                        <div class="font-semibold">{{ memberInfo.name || memberInfo.nickname }}</div>
                                        <div class="text-sm text-gray-500">{{ memberInfo.phone }}</div>
                                    </div>
                                </div>
                            </a-card>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-divider>偏好教练</a-divider>

                <div class="preference-coaches">
                    <div v-if="preferredCoaches.length > 0">
                        <a-row :gutter="16">
                            <a-col
                                v-for="(coach, index) in preferredCoaches"
                                :key="coach.id"
                                :xs="24"
                                :sm="12"
                                :md="8"
                            >
                                <div class="preference-card">
                                    <div class="preference-header">
                                        <span class="preference-badge">第{{ index + 1 }}偏好</span>
                                        <a-button
                                            type="text"
                                            danger
                                            size="small"
                                            @click="removeCoach(coach.id)"
                                        >
                                            删除
                                        </a-button>
                                    </div>
                                    <div class="coach-name">{{ coach.coachName }}</div>
                                    <div class="coach-meta">{{ coach.venueName }}</div>
                                </div>
                            </a-col>
                        </a-row>
                    </div>
                    <div v-else class="empty-state">
                        <p>该会员暂无偏好教练</p>
                    </div>
                </div>

                <a-divider></a-divider>

                <a-form-item label="添加偏好教练">
                    <div class="flex gap-4">
                        <a-select
                            v-model:value="selectedCoachId"
                            :options="availableCoaches"
                            :show-search="true"
                            placeholder="选择教练"
                            style="width: 300px"
                            option-filter-prop="children"
                        >
                            <template #option="{ label, value }">
                                {{ label }}
                            </template>
                        </a-select>
                        <a-button
                            type="primary"
                            @click="addCoach"
                            :disabled="!selectedCoachId"
                        >
                            添加
                        </a-button>
                    </div>
                </a-form-item>

                <a-divider></a-divider>

                <div class="flex justify-end gap-4">
                    <a-button @click="handleCancel">取消</a-button>
                    <a-button type="primary" @click="handleSave">保存</a-button>
                </div>
            </a-form>
        </template>
    </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Row as ARow,
    Select as ASelect,
    Avatar as AAvatar,
} from 'ant-design-vue';
import {
    listPreferredCoachesByMemberApi,
    setPreferredCoachApi,
    deletePreferredCoachApi,
    type PreferredCoachVO,
} from '#/api/coach/coachpreference';
import { getAdminMemberDetailApi, type AdminMemberDetailDTO } from '#/api/member/member';
import { listCoachesApi, type CoachVO } from '#/api/coach/profile';
import { batchGetFilePreviewApi } from '#/api/file';
import { message } from 'ant-design-vue';

defineOptions({ name: 'CoachPreference' });

const route = useRoute();
const router = useRouter();

const memberId = ref('');
const memberInfo = reactive<AdminMemberDetailDTO>({});
const preferredCoaches = ref<PreferredCoachVO[]>([]);
const availableCoaches = ref<{ label: string; value: string; venueId?: number }[]>([]);
const selectedCoachId = ref('');
const memberAvatarUrl = ref('');

const allCoaches = ref<CoachVO[]>([]);

async function loadMemberInfo() {
    try {
        const data = await getAdminMemberDetailApi(memberId.value);
        Object.assign(memberInfo, data);

        if (data.avatar) {
            const avatarStr = String(data.avatar);
            if (/^\d+$/.test(avatarStr) && !avatarStr.startsWith('http')) {
                try {
                    const results = await batchGetFilePreviewApi({ fileIds: [avatarStr] });
                    if (results.length > 0) {
                        memberAvatarUrl.value = results[0].previewUrl;
                    }
                } catch (e) {
                    console.error('加载头像预览失败:', e);
                }
            } else {
                memberAvatarUrl.value = avatarStr;
            }
        }
    } catch (e) {
        console.error('加载会员信息失败:', e);
    }
}

async function loadPreferredCoaches() {
    try {
        const data = await listPreferredCoachesByMemberApi(memberId.value);
        preferredCoaches.value = data || [];
    } catch (e) {
        console.error('加载偏好教练失败:', e);
    }
}

async function loadAvailableCoaches() {
    try {
        const coaches = await listCoachesApi();
        allCoaches.value = coaches;
        availableCoaches.value = coaches.map((coach: CoachVO) => ({
            label: `${coach.name || '-'}${coach.venues?.length ? ` - ${coach.venues[0].name}` : ''}`,
            value: String(coach.id),
            venueId: coach.venues?.length ? coach.venues[0].id : undefined,
        }));
    } catch (e) {
        console.error('加载教练列表失败:', e);
        availableCoaches.value = [];
    }
}

function addCoach() {
    if (!selectedCoachId.value) {
        message.warning('请选择教练');
        return;
    }

    const exists = preferredCoaches.value.some(c => String(c.coachId) === selectedCoachId.value);
    if (exists) {
        message.warning('该教练已在偏好列表中');
        return;
    }

    const coach = availableCoaches.value.find(c => c.value === selectedCoachId.value);
    if (coach) {
        const labelParts = coach.label.split(' - ');
        preferredCoaches.value.push({
            id: Number(selectedCoachId.value),
            memberId: Number(memberId.value),
            coachId: Number(selectedCoachId.value),
            venueId: coach.venueId,
            coachName: labelParts[0],
            venueName: labelParts[1] || '',
            preferenceLevel: preferredCoaches.value.length + 1,
        });
        selectedCoachId.value = '';
    }
}

function removeCoach(coachId: number) {
    preferredCoaches.value = preferredCoaches.value.filter(c => c.id !== coachId);
    preferredCoaches.value.forEach((c, index) => {
        c.preferenceLevel = index + 1;
    });
}

async function handleSave() {
    try {
        for (const coach of preferredCoaches.value) {
            await setPreferredCoachApi({
                memberId: Number(memberId.value),
                coachId: coach.coachId,
                venueId: coach.venueId,
                preferenceLevel: coach.preferenceLevel,
                preferenceReason: 'MANUAL',
            });
        }
        message.success('保存成功');
        router.back();
    } catch (e: any) {
        message.error(e?.message || '保存失败');
    }
}

function handleCancel() {
    router.back();
}

onMounted(async () => {
    memberId.value = String(route.query.memberId || '');
    if (!memberId.value) {
        return;
    }

    await Promise.all([
        loadMemberInfo(),
        loadPreferredCoaches(),
        loadAvailableCoaches(),
    ]);
});
</script>

<style lang="scss" scoped>
.preference-card {
    padding: 16px;
    background: var(--color-bg-container);
    border-radius: 8px;
    border: 1px solid var(--ant-color-border-secondary);
}

.preference-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.preference-badge {
    font-size: 12px;
    padding: 2px 8px;
    background: var(--ant-color-primary);
    color: white;
    border-radius: 4px;
}

.coach-name {
    font-weight: 500;
    font-size: 14px;
    color: var(--color-text);
    margin-bottom: 4px;
}

.coach-meta {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.empty-state {
    padding: 40px;
    text-align: center;
    color: var(--color-text-secondary);
}

.member-info-card {
    padding: 12px;
}
</style>