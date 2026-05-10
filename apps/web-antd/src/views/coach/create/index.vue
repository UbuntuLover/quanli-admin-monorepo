<template>
    <div class="p-4 coach-create-page">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">新增教练</div>
                        <div class="mt-1 text-xs text-gray-400">管理员可直接创建教练账号与档案</div>
                    </div>
                    <a-tag color="green">Admin Create</a-tag>
                </div>
            </template>

            <a-form
                ref="formRef"
                :model="form"
                :rules="rules"
                layout="vertical"
            >
                <a-divider orientation="left">基础信息</a-divider>

                <a-row :gutter="[16, 8]">
                    <a-col :xs="24" :md="8">
                        <a-form-item label="手机号" name="phone">
                            <a-input
                                v-model:value="form.phone"
                                :maxlength="11"
                                placeholder="请输入手机号"
                            />
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
                            <a-input v-model:value="form.name" placeholder="请输入姓名" />
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
                        <a-form-item label="头像URL" name="avatar">
                            <a-input v-model:value="form.avatar" placeholder="https://..." />
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

                <a-form-item label="照片URL" name="photos">
                    <div class="photo-box">
                        <div
                            v-for="(photo, index) in form.photos"
                            :key="index"
                            class="photo-row"
                        >
                            <a-input v-model:value="form.photos[index]" placeholder="https://..." />
                            <a-button danger @click="removePhoto(index)">删除</a-button>
                        </div>
                        <a-button type="dashed" block @click="addPhoto">+ 新增照片</a-button>
                    </div>
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
                    <a-textarea
                        v-model:value="form.remark"
                        :rows="2"
                        :maxlength="300"
                        show-count
                    />
                </a-form-item>

                <div class="mt-4 flex justify-end gap-2">
                    <a-button @click="resetForm">重置</a-button>
                    <a-button type="primary" :loading="submitting" @click="handleSubmit">
                        提交
                    </a-button>
                </div>
            </a-form>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { Rule } from 'ant-design-vue/es/form';
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
    Tag as ATag,
    message,
} from 'ant-design-vue';
import { createCoachByApply, type CoachApplyRequest } from '#/api/coach/create';

defineOptions({ name: 'CoachCreate' });

type FormInstance = InstanceType<typeof AForm>;
type VenueOption = { label: string; value: number };

const formRef = ref<FormInstance>();
const submitting = ref(false);

const venueOptions = ref<VenueOption[]>([
    { label: '南山店', value: 1 },
    { label: '福田店', value: 2 },
    { label: '宝安店', value: 3 },
]);

const genderOptions = [
    { label: '男', value: 1 },
    { label: '女', value: 2 },
];

const employmentTypeOptions = [
    { label: '全职', value: 'FULL_TIME' },
    { label: '兼职', value: 'PART_TIME' },
];

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

const rules: Record<string, Rule[]> = {
    phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少6位', trigger: 'blur' },
    ],
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
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

function addPhoto() {
    form.photos.push('');
}

function removePhoto(index: number) {
    form.photos.splice(index, 1);
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
</script>

<style scoped>
.photo-box {
    width: 100%;
}

.photo-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin-bottom: 8px;
}
</style>
