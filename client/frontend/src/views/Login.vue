<script setup>
import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthShell from '@/components/ui/AuthShell.vue'
import TextField from '@/components/ui/TextField.vue'
import OtpInput from '@/components/ui/OtpInput.vue'
import Icon from '@/components/ui/Icon.vue'
import Loader from '@/components/ui/Loader.vue'
import Btn from '@/components/ui/Btn.vue'
import defaultRoute from '@/router/defaultRoute'

const { t } = useI18n()
const api = inject('api')
const events = inject('events')
const validate = inject('validate')
const router = useRouter()

// isSecureContext is true on localhost, but localhost isn't allowed for webauthn, using location instead
const passkeysSupported = location.protocol === 'https:' && (location.port === '' || location.port === '443') && window.navigator && navigator.credentials

const loading = ref(false)
const step = ref('credentials') // 'credentials' | 'secondFactor'
const email = ref('')
const emailError = ref(false)
const password = ref('')
const passwordError = ref(false)
const otpRecovery = ref(false)
const token = ref('')
const secondFactorData = ref(null)

const subtitle = computed(() => {
  if (step.value === 'secondFactor') {
    return 'Enter the 6-digit verification code from your authenticator app.'
  }
  return 'Sign in with your account credentials to access your servers.'
})

function loggedIn() {
  try {
    const saved = sessionStorage.getItem('returnTo')
    if (saved) {
      router.push(JSON.parse(saved))
      sessionStorage.removeItem('returnTo')
    } else {
      router.push(defaultRoute(api))
    }
  } catch {
    router.push(defaultRoute(api))
  }
  events.emit('login')
}

function validateEmail(onChange = false) {
  if (!validate.email(email.value)) {
    if (onChange === true) return
    emailError.value = true
  } else {
    emailError.value = false
  }
}

function emailErrorMsg() {
  if (emailError.value) return t('errors.ErrEmailInvalid')
}

function validatePassword(onChange = false) {
  if (!validate.password(password.value)) {
    if (onChange === true) return
    passwordError.value = true
  } else {
    passwordError.value = false
  }
}

function passwordErrorMsg() {
  if (passwordError.value) return t('errors.ErrPasswordRequirements')
}

async function attemptPasskeyLogin() {
  if (!validate.email(email.value)) {
    emailError.value = true
    return
  }
  loading.value = true
  try {
    const res = await api.auth.passkeyLogin(email.value)
    if (res !== false) loggedIn()
  } finally {
    loading.value = false
  }
}

async function attemptPasskey2fa(doRedirect = false) {
  loading.value = true
  try {
    const attestation = await navigator.credentials.get(secondFactorData.value.webauthnChallenge)
    const done = await api.auth.validatePasskeyLogin(attestation)
    if (doRedirect && done) loggedIn()
    return done
  } finally {
    loading.value = false
  }
}

async function attemptPasswordLogin() {
  loading.value = true
  try {
    const res = await api.auth.login(email.value, password.value)
    secondFactorData.value = {
      otpEnabled: res.otpEnabled,
      webauthnChallenge: res.webauthnChallenge
    }
    return res.needsSecondFactor
  } finally {
    loading.value = false
  }
}

async function attemptOtpLogin() {
  loading.value = true
  try {
    await api.auth.loginOtp(token.value)
    return true
  } catch {
    return false
  } finally {
    loading.value = false
  }
}

function canSubmit() {
  if (step.value === 'credentials') {
    return validate.email(email.value) && validate.password(password.value)
  }
  if (step.value === 'secondFactor') {
    return token.value.length >= 6
  }
  return false
}

async function submitForm(e) {
  if (e) e.preventDefault()
  if (step.value === 'credentials') {
    validateEmail()
    validatePassword()
  }
  if (!canSubmit() || loading.value) return

  if (step.value === 'credentials') {
    const needsSecondFactor = await attemptPasswordLogin()
    if (needsSecondFactor) {
      if (secondFactorData.value.webauthnChallenge) {
        try {
          const done = await attemptPasskey2fa()
          if (done) loggedIn()
        } catch {
          // continue to OTP fallback
        }
      }
      step.value = 'secondFactor'
    } else {
      loggedIn()
    }
  } else if (step.value === 'secondFactor') {
    const done = await attemptOtpLogin()
    if (done) {
      loggedIn()
    }
  }
}
</script>

<template>
  <AuthShell :title="t('users.Login')" :subtitle="subtitle" mode="login">
    <form class="studio-auth-form" @submit.prevent="submitForm">
      <template v-if="step === 'credentials'">
        <text-field
          v-model="email"
          type="email"
          name="email"
          :disabled="loading"
          :label="t('users.Email')"
          :error="emailErrorMsg()"
          icon="email"
          autofocus
          @blur="validateEmail"
          @change="validateEmail(true)"
        />
        <text-field
          v-model="password"
          type="password"
          name="password"
          :disabled="loading"
          :label="t('users.Password')"
          :error="passwordErrorMsg()"
          icon="lock"
          @blur="validatePassword"
          @change="validatePassword(true)"
        />
      </template>

      <template v-else-if="step === 'secondFactor'">
        <div class="auth-active-account-chip">
          <icon name="email" />
          <span>{{ email }}</span>
          <button type="button" class="chip-change-btn" @click="step = 'credentials'; token = ''">
            {{ t('users.ChangeEmail') }}
          </button>
        </div>

        <div v-if="secondFactorData && secondFactorData.otpEnabled" class="otp-section">
          <otp-input
            v-if="!otpRecovery"
            :disabled="loading"
            @update:modelValue="token = $event"
            @complete="token = $event; submitForm()"
          />
          <text-field
            v-else
            v-model="token"
            autofocus
            :label="t('users.OtpUseRecovery')"
            :disabled="loading"
          />
          <btn
            :disabled="loading"
            variant="text"
            @click="otpRecovery = !otpRecovery; token = ''"
            v-text="otpRecovery ? t('users.OtpUseAuthenticator') : t('users.OtpUseRecovery')"
          />
        </div>

        <btn
          v-if="secondFactorData && secondFactorData.webauthnChallenge && passkeysSupported"
          :disabled="loading"
          variant="neutral"
          @click="attemptPasskey2fa(true)"
        >
          <icon name="key" />
          <span v-text="t('users.RetryPasskey')" />
        </btn>
      </template>

      <div class="auth-primary-actions">
        <btn type="submit" color="primary" :disabled="loading" @click="submitForm">
          <loader v-if="loading" small />
          <template v-else>
            <span v-text="step === 'secondFactor' ? t('common.Confirm') : t('users.Login')" />
            <icon name="arrow-right" />
          </template>
        </btn>

        <btn
          v-if="step === 'credentials' && passkeysSupported"
          variant="neutral"
          :disabled="loading"
          @click="attemptPasskeyLogin()"
        >
          <icon name="key" />
          <span>Sign in with Passkey</span>
        </btn>
      </div>

      <div v-if="$config.registrationEnabled" class="auth-switch-footer">
        <button type="button" class="auth-link-btn" @click="$router.push({ name: 'Register' })">
          {{ t('users.RegisterLink') }}
        </button>
      </div>
    </form>
  </AuthShell>
</template>
