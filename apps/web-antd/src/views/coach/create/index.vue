<template>
    <div class="coach-create-page p-4">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">新增教练</div>
                        <div class="mt-1 text-xs text-gray-400">管理员可直接创建教练账号与档案</div>
                    </div>

                    <a-space>
                        <a-tag color="green">Admin Create</a-tag>

                        <a-tag v-if="ENABLE_MOCK" color="orange">Mock 模式</a-tag>

                        <a-button v-if="ENABLE_MOCK" size="small" @click="switchMockData(false)">
                            模拟有数据
                        </a-button>

                        <a-button v-if="ENABLE_MOCK" size="small" @click="switchMockData(true)">
                            模拟空数据
                        </a-button>

                        <a-button size="small" :loading="venueLoading" @click="loadVenueOptions">
                            刷新场馆
                        </a-button>
                    </a-space>
                </div>
            </template>

            <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
                <a-divider orientation="left">基础信息</a-divider>

                <a-row :gutter="[16, 8]">
                    <a-col :xs="24" :md="8">
                        <a-form-item label="手机号" name="phone">
                            <a-input v-model:value="form.phone" :maxlength="11" placeholder="请输入手机号"/>
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="8">
                        <a-form-item label="密码" name="password">
                            <a-input-password
                                v-model:value="form.password"
                                placeholder="请输入密码（至少6位）"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="8">
                        <a-form-item label="姓名" name="name">
                            <a-input v-model:value="form.name" placeholder="请输入姓名"/>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="[16, 8]">
                    <a-col :xs="24" :md="8">
                        <a-form-item label="性别" name="gender">
                            <a-select
                                v-model:value="form.gender"
                                allow-clear
                                placeholder="请选择"
                                :options="genderOptions"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="8">
                        <a-form-item label="生日" name="birthday">
                            <a-date-picker
                                v-model:value="form.birthday"
                                value-format="YYYY-MM-DD"
                                style="width: 100%"
                                placeholder="请选择生日"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="8">
                        <a-form-item label="头像">
                            <MediaUpload
                                v-model="avatarFile"
                                biz-type="user"
                                :multiple="false"
                                :max-count="1"
                                :draggable="false"
                                :accept-config="{ image: true, video: false }"
                                :limit-config="{ imageMaxSizeMb: 5 }"
                                :show-hint="false"
                                list-type="card"
                            />
                        </a-form-item>

                        <a-form-item name="avatar" class="hidden-form-item">
                            <a-input v-model:value="form.avatar"/>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-divider orientation="left">资质与能力</a-divider>

                <a-form-item label="证书" name="certificates">
                    <a-select
                        v-model:value="form.certificates"
                        mode="tags"
                        :token-separators="[',']"
                        placeholder="输入后回车"
                    />
                </a-form-item>

                <a-form-item label="擅长" name="specialties">
                    <a-select
                        v-model:value="form.specialties"
                        mode="tags"
                        :token-separators="[',']"
                        placeholder="输入后回车"
                    />
                </a-form-item>

                <a-form-item label="标签" name="tags">
                    <a-select
                        v-model:value="form.tags"
                        mode="tags"
                        :token-separators="[',']"
                        placeholder="输入后回车"
                    />
                </a-form-item>

                <a-form-item label="个人介绍" name="introduction">
                    <a-textarea
                        v-model:value="form.introduction"
                        :rows="3"
                        :maxlength="500"
                        show-count
                        placeholder="请输入教练介绍"
                    />
                </a-form-item>

                <a-form-item label="教练照片">
                    <MediaUpload
                        v-model="photoFiles"
                        biz-type="user"
                        :multiple="true"
                        :max-count="9"
                        :draggable="true"
                        :accept-config="{ image: true, video: false }"
                        :limit-config="{ imageMaxSizeMb: 10 }"
                        :show-hint="false"
                        list-type="card"
                    />
                    <div class="mt-2 text-xs text-gray-400">
                        支持图片(jpg/png/webp)，最多9张，每张不超过10MB。已上传 {{ form.photos.length }} 张
                    </div>
                </a-form-item>

                <a-form-item name="photos" class="hidden-form-item">
                    <a-input v-model:value="photosShadowValue"/>
                </a-form-item>

                <a-divider orientation="left">入驻信息</a-divider>

                <a-row :gutter="[16, 8]">
                    <a-col :xs="24" :md="12">
                        <a-form-item label="申请场馆" name="applyVenueIds">
                            <a-select
                                v-model:value="form.applyVenueIds"
                                mode="multiple"
                                allow-clear
                                placeholder="请选择至少一个场馆"
                                :options="venueOptions"
                                :loading="venueLoading"
                                :not-found-content="venueLoading ? '加载中...' : '暂无场馆数据'"
                            />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="12">
                        <a-form-item label="任职类型" name="employmentType">
                            <a-select
                                v-model:value="form.employmentType"
                                allow-clear
                                placeholder="请选择"
                                :options="employmentTypeOptions"
                            />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="备注" name="remark">
                    <a-textarea v-model:value="form.remark" :rows="2" :maxlength="300" show-count/>
                </a-form-item>

                <div class="mt-4 flex justify-end gap-2">
                    <a-button @click="resetForm">重置</a-button>
                    <a-button type="primary" :loading="submitting" @click="handleSubmit">提交</a-button>
                </div>
            </a-form>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from 'vue';
import type {Rule} from 'ant-design-vue/es/form';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    DatePicker as ADatePicker,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    InputPassword as AInputPassword,
    Row as ARow,
    Select as ASelect,
    Space as ASpace,
    Tag as ATag,
    Textarea as ATextarea,
    message,
} from 'ant-design-vue';
import {createCoachByApply, type CoachApplyRequest} from '#/api/coach/create';
import {getAllVenuesApi} from '#/api/venue/list';
import {MediaUpload} from '#/components/upload';
import type {MediaItem} from '#/components/upload';

defineOptions({name: 'CoachCreate'});

type FormInstance = InstanceType<typeof AForm>;
type VenueOption = { label: string; value: number };

const ENABLE_MOCK = false;
const mockEmptyMode = ref(false);

const formRef = ref<FormInstance>();
const submitting = ref(false);
const venueLoading = ref(false);

const mockVenues: VenueOption[] = [
    {label: '南山店', value: 1},
    {label: '福田店', value: 2},
    {label: '宝安店', value: 3},
];

const venueOptions = ref<VenueOption[]>([]);

const genderOptions = [
    {label: '男', value: 1},
    {label: '女', value: 2},
];

const employmentTypeOptions = [
    {label: '全职', value: 'FULL_TIME'},
    {label: '兼职', value: 'PART_TIME'},
];

const avatarFile = ref<MediaItem | null>(null);
const photoFiles = ref<MediaItem[]>([]);

const form = reactive<CoachApplyRequest>({
    phone: '',
    password: '',
    name: '',
    gender: null,
    birthday: null,
    avatar: '',
    certificates: [],
    specialties: [],
    tags: [],
    introduction: '',
    photos: [],
    applyVenueIds: [],
    employmentType: null,
    remark: '',
});

const photosShadowValue = computed(() => form.photos.join(','));

const rules: Record<string, Rule[]> = {
    phone: [
        {required: true, message: '请输入手机号', trigger: 'blur'},
        {pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur'},
    ],
    password: [
        {required: true, message: '请输入密码', trigger: 'blur'},
        {min: 6, message: '密码至少6位', trigger: 'blur'},
    ],
    name: [{required: true, message: '请输入姓名', trigger: 'blur'}],
    avatar: [{required: true, message: '请上传头像', trigger: 'change'}],
    photos: [
        {
            validator: async () => {
                if (!Array.isArray(form.photos) || form.photos.length === 0) {
                    return Promise.reject('请至少上传1张教练照片');
                }
                return Promise.resolve();
            },
            trigger: 'change',
        },
    ],
    applyVenueIds: [
        {
            required: true,
            validator: async (_rule, value: number[]) => {
                if (!Array.isArray(value) || value.length === 0) {
                    return Promise.reject('请选择至少一个场馆');
                }
                return Promise.resolve();
            },
            trigger: 'change',
        },
    ],
};

watch(
    avatarFile,
    (val) => {
        form.avatar = val?.url || '';
        formRef.value?.validateFields(['avatar']).catch(() => {
        });
    },
    {immediate: true},
);

watch(
    photoFiles,
    (val) => {
        form.photos = (val || []).map((item) => item.url).filter(Boolean);
        formRef.value?.validateFields(['photos']).catch(() => {
        });
    },
    {immediate: true, deep: true},
);

function sleep(time = 300) {
    return new Promise((resolve) => window.setTimeout(resolve, time));
}

function switchMockData(empty: boolean) {
    mockEmptyMode.value = empty;
    loadVenueOptions();
}

async function loadVenueOptions() {
    venueLoading.value = true;
    try {
        if (ENABLE_MOCK) {
            await sleep();
            venueOptions.value = mockEmptyMode.value ? [] : [...mockVenues];
            return;
        }

        const rows = await getAllVenuesApi();
        const list = Array.isArray(rows) ? rows : [];
        venueOptions.value = list.map((item: any) => ({
            label: item.name,
            value: item.id,
        }));
    } catch (error) {
        console.error('加载场馆选项失败：', error);
        venueOptions.value = [];
        message.error('加载场馆失败，请稍后重试');
    } finally {
        venueLoading.value = false;
    }
}

function normalizePayload(): CoachApplyRequest {
    return {
        ...form,
        phone: form.phone.trim(),
        password: form.password.trim(),
        name: form.name.trim(),
        avatar: form.avatar?.trim() || null,
        introduction: form.introduction?.trim() || null,
        employmentType: form.employmentType || null,
        remark: form.remark?.trim() || null,
        certificates: form.certificates.map((v) => v.trim()).filter(Boolean),
        specialties: form.specialties.map((v) => v.trim()).filter(Boolean),
        tags: form.tags.map((v) => v.trim()).filter(Boolean),
        photos: form.photos.map((v) => v.trim()).filter(Boolean),
        applyVenueIds: [...new Set(form.applyVenueIds)],
    };
}

function resetForm() {
    formRef.value?.resetFields();

    form.phone = '';
    form.password = '';
    form.name = '';
    form.gender = null;
    form.birthday = null;
    form.avatar = '';
    form.certificates = [];
    form.specialties = [];
    form.tags = [];
    form.introduction = '';
    form.photos = [];
    form.applyVenueIds = [];
    form.employmentType = null;
    form.remark = '';

    avatarFile.value = null;
    photoFiles.value = [];
}

async function handleSubmit() {
    try {
        await formRef.value?.validate();
        submitting.value = true;
        await createCoachByApply(normalizePayload());
        message.success('新增教练成功');
        resetForm();
    } finally {
        submitting.value = false;
    }
}

onMounted(() => {
    loadVenueOptions();
});
</script>

<style scoped>
.hidden-form-item {
    margin: 0 !important;
    padding: 0 !important;
}

.hidden-form-item :deep(.ant-form-item-control-input) {
    min-height: 0 !important;
    height: 0 !important;
}

.hidden-form-item :deep(input) {
    height: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
    padding: 0 !important;
    border: 0 !important;
}
</style>
