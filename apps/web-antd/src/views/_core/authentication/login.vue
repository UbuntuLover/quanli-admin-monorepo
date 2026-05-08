<script lang="ts" setup>
import type {VbenFormSchema} from '@vben/common-ui';

import {computed, markRaw} from 'vue';

import {AuthenticationLogin, SliderCaptcha, z} from '@vben/common-ui';

import {useAuthStore} from '#/store';

defineOptions({name: 'Login'});

const authStore = useAuthStore();


const formSchema = computed((): VbenFormSchema[] => {
    return [
        {
            component: 'VbenInput',
            componentProps: {
                placeholder: '请输入管理员账号',
            },
            fieldName: 'username',
            label: '账号',
            rules: z.string().min(1, {message: '请输入管理员账号'}),
        },
        {
            component: 'VbenInputPassword',
            componentProps: {
                placeholder: '请输入登录密码',
            },
            fieldName: 'password',
            label: '密码',
            rules: z.string().min(1, {message: '请输入登录密码'}),
        },
        {
            component: 'SliderCaptcha',
            fieldName: 'captcha',
            label: '验证码',
            renderComponentContent: () => markRaw(SliderCaptcha),
            rules: z.boolean().refine((value) => value === true, {
                message: '请完成滑块验证',
            }),
        },
    ];
});
</script>

<template>
    <AuthenticationLogin
        :show-qrcode-login="false"
        :show-third-party-login="false"
        :form-schema="formSchema"
        :show-register="false"
        :loading="authStore.loginLoading"
        @submit="authStore.authLogin"
    />
</template>
