<template>
    <div class="p-4 venue-create-page">
        <a-card :bordered="false">
            <template #title>
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-base font-semibold">场馆创建</div>
                        <div class="mt-1 text-xs text-gray-400">填写基础信息后即可创建场馆</div>
                    </div>
                    <a-tag color="blue">Venue Create</a-tag>
                </div>
            </template>

            <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
                <a-divider orientation="left">基础信息</a-divider>

                <a-row :gutter="[16, 8]">
                    <a-col :xs="24" :md="8">
                        <a-form-item label="场馆名称" name="name">
                            <a-input v-model:value="form.name" placeholder="请输入场馆名称"/>
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="8">
                        <a-form-item label="联系电话" name="phone">
                            <a-input v-model:value="form.phone" placeholder="请输入联系电话"/>
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="8">
                        <a-form-item label="营业状态" name="businessStatus">
                            <a-select v-model:value="form.businessStatus" :options="businessStatusOptions"/>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="[16, 8]">
                    <a-col :xs="24" :md="6">
                        <a-form-item label="省份">
                            <a-input v-model:value="form.province" placeholder="如：广东省"/>
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-form-item label="城市">
                            <a-input v-model:value="form.city" placeholder="如：深圳市"/>
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-form-item label="区县">
                            <a-input v-model:value="form.district" placeholder="如：南山区"/>
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-form-item label="场馆状态" name="status">
                            <a-select v-model:value="form.status" :options="statusOptions"/>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="详细地址">
                    <a-input v-model:value="form.address" placeholder="请输入详细地址"/>
                </a-form-item>

                <a-row :gutter="[16, 8]">
                    <a-col :xs="24" :md="6">
                        <a-form-item label="纬度">
                            <a-input-number v-model:value="form.latitude" :min="-90" :max="90" :step="0.000001"
                                            style="width: 100%"/>
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-form-item label="经度">
                            <a-input-number v-model:value="form.longitude" :min="-180" :max="180" :step="0.000001"
                                            style="width: 100%"/>
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-form-item label="面积(㎡)">
                            <a-input-number v-model:value="form.areaSqm" :min="0" style="width: 100%"/>
                        </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="6">
                        <a-form-item label="最大容纳人数">
                            <a-input-number v-model:value="form.capacity" :min="0" style="width: 100%"/>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-divider orientation="left">媒体与标签</a-divider>

                <a-form-item label="Logo URL">
                    <a-input v-model:value="form.logo" placeholder="https://..."/>
                </a-form-item>

                <a-form-item label="背景图 URL">
                    <a-input v-model:value="form.backgroundImage" placeholder="https://..."/>
                </a-form-item>

                <a-form-item label="设施">
                    <a-select v-model:value="form.facilities" mode="tags" :token-separators="[',']"
                              placeholder="输入后回车"/>
                </a-form-item>

                <a-form-item label="标签">
                    <a-select v-model:value="form.tags" mode="tags" :token-separators="[',']" placeholder="输入后回车"/>
                </a-form-item>

                <a-form-item label="场馆图片 URL">
                    <div class="list-box">
                        <div v-for="(v, i) in form.photos" :key="`photo-${i}`" class="list-row">
                            <a-input v-model:value="form.photos[i]" placeholder="https://..."/>
                            <a-button danger @click="removeItem(form.photos, i)">删除</a-button>
                        </div>
                        <a-button type="dashed" block @click="addItem(form.photos)">+ 新增图片</a-button>
                    </div>
                </a-form-item>

                <a-form-item label="场馆视频 URL">
                    <div class="list-box">
                        <div v-for="(v, i) in form.videos" :key="`video-${i}`" class="list-row">
                            <a-input v-model:value="form.videos[i]" placeholder="https://..."/>
                            <a-button danger @click="removeItem(form.videos, i)">删除</a-button>
                        </div>
                        <a-button type="dashed" block @click="addItem(form.videos)">+ 新增视频</a-button>
                    </div>
                </a-form-item>

                <a-divider orientation="left">说明信息</a-divider>

                <a-form-item label="场馆介绍">
                    <a-textarea v-model:value="form.description" :rows="3" :maxlength="1000" show-count/>
                </a-form-item>

                <a-form-item label="场馆公告">
                    <a-textarea v-model:value="form.notice" :rows="2" :maxlength="500" show-count/>
                </a-form-item>

                <div class="mt-4 flex justify-end gap-2">
                    <a-button @click="resetForm">重置</a-button>
                    <a-button type="primary" :loading="submitting" @click="handleSubmit">创建场馆</a-button>
                </div>
            </a-form>
        </a-card>
    </div>
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue';
import type {Rule} from 'ant-design-vue/es/form';
import {
    Button as AButton,
    Card as ACard,
    Col as ACol,
    Divider as ADivider,
    Form as AForm,
    FormItem as AFormItem,
    Input as AInput,
    InputNumber as AInputNumber,
    Row as ARow,
    Select as ASelect,
    Tag as ATag,
    message,
} from 'ant-design-vue';
import {createVenueApi, type VenueCreateRequest} from '#/api/venue/create';

defineOptions({name: 'VenueCreate'});

type FormInstance = InstanceType<typeof AForm>;

const formRef = ref<FormInstance>();
const submitting = ref(false);

const businessStatusOptions = [
    {label: '营业中', value: 1},
    {label: '休业中', value: 2},
    {label: '装修中', value: 3},
];

const statusOptions = [
    {label: '正常', value: 1},
    {label: '停用', value: 2},
];

const form = reactive<VenueCreateRequest>({
    name: '',
    address: '',
    province: '',
    city: '',
    district: '',
    phone: '',
    latitude: null,
    longitude: null,
    areaSqm: null,
    capacity: null,
    facilities: [],
    photos: [],
    videos: [],
    description: '',
    businessHours: null,
    businessStatus: 1,
    closedDates: [],
    notice: '',
    tags: [],
    logo: '',
    backgroundImage: '',
    managerId: null,
    status: 1,
});

const rules: Record<string, Rule[]> = {
    name: [{required: true, message: '请输入场馆名称', trigger: 'blur'}],
    businessStatus: [{required: true, message: '请选择营业状态', trigger: 'change'}],
    status: [{required: true, message: '请选择场馆状态', trigger: 'change'}],
};

function addItem(list: string[]) {
    list.push('');
}

function removeItem(list: string[], index: number) {
    list.splice(index, 1);
}

function normalizePayload(): VenueCreateRequest {
    return {
        ...form,
        name: form.name.trim(),
        address: form.address?.trim() || null,
        province: form.province?.trim() || null,
        city: form.city?.trim() || null,
        district: form.district?.trim() || null,
        phone: form.phone?.trim() || null,
        description: form.description?.trim() || null,
        notice: form.notice?.trim() || null,
        logo: form.logo?.trim() || null,
        backgroundImage: form.backgroundImage?.trim() || null,
        facilities: (form.facilities || []).map((v) => v.trim()).filter(Boolean),
        tags: (form.tags || []).map((v) => v.trim()).filter(Boolean),
        photos: (form.photos || []).map((v) => v.trim()).filter(Boolean),
        videos: (form.videos || []).map((v) => v.trim()).filter(Boolean),
        closedDates: form.closedDates || [],
        businessHours: form.businessHours || null,
    };
}

function resetForm() {
    formRef.value?.resetFields();
    Object.assign(form, {
        name: '',
        address: '',
        province: '',
        city: '',
        district: '',
        phone: '',
        latitude: null,
        longitude: null,
        areaSqm: null,
        capacity: null,
        facilities: [],
        photos: [],
        videos: [],
        description: '',
        businessHours: null,
        businessStatus: 1,
        closedDates: [],
        notice: '',
        tags: [],
        logo: '',
        backgroundImage: '',
        managerId: null,
        status: 1,
    } satisfies VenueCreateRequest);
}

async function handleSubmit() {
    try {
        await formRef.value?.validate();
        submitting.value = true;
        const id = await createVenueApi(normalizePayload());
        message.success(`创建成功，场馆ID：${id}`);
        resetForm();
    } finally {
        submitting.value = false;
    }
}
</script>

<style scoped>
.list-box {
    width: 100%;
}

.list-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin-bottom: 8px;
}
</style>
