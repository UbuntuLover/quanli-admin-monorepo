<template>
    <div class="p-4 coach-profile-page">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">教练信息</div>
                        <div class="mt-1 text-xs text-gray-400">点击卡片进入详情编辑页</div>
                    </div>
                    <a-space>
                        <a-tag v-if="ENABLE_MOCK" color="orange">Mock 模式</a-tag>
                        <a-button v-if="ENABLE_MOCK" @click="switchMockData(false)">模拟有数据</a-button>
                        <a-button v-if="ENABLE_MOCK" @click="switchMockData(true)">模拟空数据</a-button>
                        <a-button :loading="loading" @click="fetchList">刷新</a-button>
                    </a-space>
                </div>
            </template>

            <a-alert
                v-if="ENABLE_MOCK"
                class="mb-4"
                message="当前页面正在使用 Mock 数据。验证真实接口时请将 ENABLE_MOCK 改为 false。"
                show-icon
                type="warning"
            />

            <a-spin :spinning="loading">
                <!-- 有数据：卡片列表 -->
                <a-row v-if="hasCoaches" :gutter="[16, 16]" align="stretch">
                    <a-col
                        v-for="item in coachList"
                        :key="item.id"
                        :xs="24"
                        :sm="12"
                        :md="8"
                        :lg="6"
                        class="coach-col"
                    >
                        <div
                            class="coach-card-wrap"
                            :class="{ 'is-disabled': !item.isAvailable }"
                            @click="goEdit(item.id)"
                        >
                            <a-card hoverable class="coach-card">
                                <!-- 禁用角标 -->
                                <div v-if="!item.isAvailable" class="status-ribbon">已禁用</div>

                                <div class="coach-card__content">
                                    <div class="flex items-center gap-3">
                                        <a-avatar class="coach-avatar" :size="56" :src="item.avatar || undefined">
                                            {{ item.name?.slice(0, 1) || '教' }}
                                        </a-avatar>

                                        <div class="min-w-0 flex-1">
                                            <div class="coach-name truncate text-base font-semibold">
                                                {{ item.name }}
                                            </div>

                                            <!-- 状态标签（高可见） -->
                                            <div class="mt-2">
                                                <a-tag :color="item.isAvailable ? 'success' : 'error'">
                                                    {{ item.isAvailable ? '可用' : '禁用' }}
                                                </a-tag>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-3 line-clamp-2 text-sm text-gray-600 intro-block">
                                        {{ item.introduction || '暂无介绍' }}
                                    </div>

                                    <div class="mt-3 tags-block">
                                        <a-space wrap>
                                            <a-tag
                                                v-for="s in (item.specialties || []).slice(0, 3)"
                                                :key="s"
                                                color="blue"
                                            >
                                                {{ s }}
                                            </a-tag>
                                        </a-space>
                                    </div>

                                    <div class="mt-3 text-xs text-gray-500 venue-block">
                                        场馆：{{ (item.venues || []).map((v) => v.name).join(' / ') || '-' }}
                                    </div>
                                </div>
                            </a-card>
                        </div>
                    </a-col>
                </a-row>

                <!-- 无数据：完整空态 -->
                <div
                    v-else
                    class="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-12 dark:border-gray-700 dark:bg-gray-900"
                >
                    <a-empty description="暂无教练">
                        <template #image>
                            <div
                                class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-4xl dark:bg-blue-950"
                            >
                                🧑‍🏫
                            </div>
                        </template>
                    </a-empty>

                    <div class="mt-4 max-w-md text-center text-sm leading-6 text-gray-500">
                        当前没有可展示的教练信息。新增教练后将显示在这里。
                    </div>

                    <div class="mt-6 flex items-center gap-3">
                        <a-button :loading="loading" type="primary" @click="fetchList">重新查询</a-button>
                        <a-button v-if="ENABLE_MOCK" @click="switchMockData(false)">加载 Mock 数据</a-button>
                    </div>
                </div>
            </a-spin>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
    Alert as AAlert,
    Avatar as AAvatar,
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Empty as AEmpty,
    Row as ARow,
    Space as ASpace,
    Spin as ASpin,
    Tag as ATag,
} from 'ant-design-vue';
import { listCoachesApi, type CoachVO } from '#/api/coach/profile';

defineOptions({ name: 'CoachProfileList' });

const ENABLE_MOCK = true;
const mockEmptyMode = ref(false);

const router = useRouter();
const loading = ref(false);
const coachList = ref<CoachVO[]>([]);

const hasCoaches = computed(() => coachList.value.length > 0);

const mockCoachList: CoachVO[] = [
    {
        id: 101,
        name: '张伟',
        avatar: '',
        specialties: ['增肌训练', '力量训练', '减脂塑形'],
        venues: [
            { id: 1, name: '南山旗舰店' },
            { id: 2, name: '福田中心店' },
        ],
        isAvailable: true,
        introduction: '拥有8年私教经验，擅长体测分析与训练周期规划。',
        certifications: ['NASM-CPT', 'CPR'],
    },
    {
        id: 102,
        name: '李娜',
        avatar: '',
        specialties: ['瑜伽', '普拉提', '体态改善'],
        venues: [{ id: 3, name: '罗湖店' }],
        isAvailable: false,
        introduction: '专注女性体态改善和核心训练。',
        certifications: ['RYT-200'],
    },
];

function sleep(time = 300) {
    return new Promise((resolve) => window.setTimeout(resolve, time));
}

function switchMockData(empty: boolean) {
    mockEmptyMode.value = empty;
    fetchList();
}

async function fetchList() {
    loading.value = true;
    try {
        if (ENABLE_MOCK) {
            await sleep();
            coachList.value = mockEmptyMode.value ? [] : mockCoachList.map((i) => ({ ...i }));
            return;
        }
        const result = await listCoachesApi();
        coachList.value = Array.isArray(result) ? result : [];
    } finally {
        loading.value = false;
    }
}

function goEdit(id: number) {
    router.push({ name: 'CoachProfileEdit', params: { id } });
}

onMounted(fetchList);
</script>

<style scoped>
.coach-col {
    display: flex;
}

.coach-card-wrap {
    width: 100%;
    height: 100%;
    cursor: pointer;
    position: relative;
}

.coach-card-wrap :deep(.ant-card) {
    height: 100%;
    border-radius: 12px;
    border: 1px solid var(--ant-color-border-secondary, rgba(120, 120, 120, 0.25));
    transition: all 0.25s ease;
    overflow: hidden;
}

.coach-card-wrap :deep(.ant-card-body) {
    height: 100%;
}

.coach-card__content {
    min-height: 180px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.intro-block {
    min-height: 40px;
}

.tags-block {
    min-height: 30px;
}

.venue-block {
    margin-top: auto;
    padding-top: 8px;
}

/* hover 效果 */
.coach-card-wrap:hover :deep(.ant-card) {
    transform: translateY(-6px) scale(1.01);
    border-color: rgba(64, 158, 255, 0.55);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(64, 158, 255, 0.25) inset;
}

.coach-card-wrap:hover .coach-avatar {
    transform: scale(1.06);
    transition: transform 0.25s ease;
}

.coach-card-wrap:hover .coach-name {
    color: #4096ff;
    transition: color 0.25s ease;
}

/* 禁用态增强 */
.coach-card-wrap.is-disabled :deep(.ant-card) {
    border-color: rgba(255, 77, 79, 0.45);
    box-shadow: inset 0 0 0 1px rgba(255, 77, 79, 0.2);
}

.coach-card-wrap.is-disabled .coach-card__content {
    opacity: 0.78;
    filter: saturate(0.7);
}

/* 禁用卡片 hover 也保持红色语义 */
.coach-card-wrap.is-disabled:hover :deep(.ant-card) {
    transform: translateY(-4px) scale(1.005);
    border-color: rgba(255, 77, 79, 0.65);
    box-shadow: 0 10px 26px rgba(255, 77, 79, 0.18), inset 0 0 0 1px rgba(255, 77, 79, 0.28);
}

/* 右上角角标 */
.status-ribbon {
    position: absolute;
    top: 10px;
    right: -28px;
    z-index: 2;
    width: 110px;
    text-align: center;
    font-size: 12px;
    line-height: 24px;
    color: #fff;
    background: linear-gradient(135deg, #ff7875, #ff4d4f);
    transform: rotate(35deg);
    box-shadow: 0 4px 10px rgba(255, 77, 79, 0.35);
    pointer-events: none;
}
</style>
