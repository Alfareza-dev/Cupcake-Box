<script setup>
import { ref, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthShell from '@/components/ui/AuthShell.vue'
import TextField from '@/components/ui/TextField.vue'
import Icon from '@/components/ui/Icon.vue'
import Loader from '@/components/ui/Loader.vue'
import Btn from '@/components/ui/Btn.vue'
import defaultRoute from '@/router/defaultRoute'

const { t } = useI18n()
const api = inject('api')
const events = inject('events')
const validate = inject('validate')
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const username = ref('')
const email = ref(route.query.email || '')
const password = ref('')
const confirmPassword = ref('')

const errorUsername = ref('')
const errorEmail = ref('')
const errorPassword = ref('')
const errorConfirmPassword = ref('')

function isValidConfirmPassword() {
  return confirmPassword.value === password.value
}

function checkUsername() {
  if (!validate.username(username.value)) errorUsername.value = t('errors.ErrUsernameRequirements')
}

function checkEmail() {
  if (!validate.email(email.value)) errorEmail.value = t('errors.ErrEmailInvalid')
}

function checkPassword() {
  if (!validate.password(password.value)) errorPassword.value = t('errors.ErrPasswordRequirements')
}

function checkConfirmPassword() {
  if (!isValidConfirmPassword()) errorConfirmPassword.value = t('errors.ErrPasswordsNotIdentical')
}

function canSubmit() {
  return validate.username(username.value) &&
    validate.email(email.value) &&
    validate.password(password.value) &&
    isValidConfirmPassword()
}

async function register(e) {
  if (e) e.preventDefault()
  checkUsername()
  checkEmail()
  checkPassword()
  checkConfirmPassword()
  if (!canSubmit() || loading.value) return
  loading.value = true
  try {
    await api.auth.login(email.value, route.query.token)
    await api.self.updateDetails(username.value, email.value, route.query.token)
    await api.self.changePassword(route.query.token, password.value)
    router.push(defaultRoute(api))
    events.emit('login')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell
    :title="t('users.Register')"
    subtitle="Complete your invited account setup to access shared servers."
    mode="invite"
  >
    <form class="studio-auth-form" @submit.prevent="register">
      <text-field
        v-model="username"
        autofocus
        :disabled="loading"
        :label="t('users.Username')"
        icon="account"
        :error="errorUsername"
        @change="errorUsername = ''"
        @blur="checkUsername()"
      />
      <text-field
        v-model="email"
        disabled
        type="email"
        :label="t('users.Email')"
        icon="email"
        :error="errorEmail"
        @change="errorEmail = ''"
        @blur="checkEmail()"
      />
      <div class="auth-password-grid">
        <text-field
          v-model="password"
          type="password"
          :disabled="loading"
          :label="t('users.Password')"
          icon="lock"
          :error="errorPassword"
          @change="errorPassword = ''"
          @blur="checkPassword()"
        />
        <text-field
          v-model="confirmPassword"
          type="password"
          :disabled="loading"
          :label="t('users.ConfirmPassword')"
          icon="lock"
          :error="errorConfirmPassword"
          @change="errorConfirmPassword = ''"
          @blur="checkConfirmPassword()"
        />
      </div>

      <div class="auth-primary-actions">
        <btn type="submit" color="primary" :disabled="loading" @click="register">
          <loader v-if="loading" small />
          <template v-else>
            <span v-text="t('users.Register')" />
            <icon name="arrow-right" />
          </template>
        </btn>
      </div>

      <div class="auth-switch-footer">
        <button type="button" class="auth-link-btn" @click="$router.push({ name: 'Login' })">
          {{ t('users.LoginLink') }}
        </button>
      </div>
    </form>
  </AuthShell>
</template>
