<script setup>
import { ref, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Btn from '@/components/ui/Btn.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import Icon from '@/components/ui/Icon.vue'
import TextField from '@/components/ui/TextField.vue'
import ThemeSetting from '@/components/ui/ThemeSetting.vue'
import ThemeLivePreview from '@/components/ui/ThemeLivePreview.vue'
import Toggle from '@/components/ui/Toggle.vue'

import { DEFAULT_BRAND_NAME, normalizeBrandName } from '@/plugins/config'

const emailProviderConfigs = {
  none: [],
  smtp: [
    { key: 'from', type: 'text' },
    { key: 'host', type: 'text' },
    { key: 'username', type: 'text' },
    { key: 'password', type: 'password' }
  ],
  mailgun: [
    { key: 'domain', type: 'text' },
    { key: 'from', type: 'text' },
    { key: 'key', type: 'password' }
  ],
  mailjet: [
    { key: 'domain', type: 'text' },
    { key: 'from', type: 'text' },
    { key: 'key', type: 'password' }
  ]
}

const { t } = useI18n()
const api = inject('api')
const config = inject('config')
const toast = inject('toast')
const themeApi = inject('theme')

const masterUrl = ref('')
const panelTitle = ref('')
const registrationEnabled = ref(true)
const theme = ref('PufferPanel')
const themeSettings = ref({})

const emailProviders = []
Object.keys(emailProviderConfigs).map(provider => {
  emailProviders.push({
    label: t('settings.emailProviders.' + provider),
    value: provider
  })
})
if (import.meta.env.DEV) {
  emailProviderConfigs.debug = []
  emailProviders.push({ label: 'Debug', value: 'debug' })
}
const emailProvider = ref('none')
const emailFields = ref([])
const email = ref({
  from: '',
  domain: '',
  key: '',
  host: '',
  username: '',
  password: ''
})

function autofillMasterUrl() {
  masterUrl.value = window.location.origin
}

async function themeChanged() {
  themeSettings.value = await themeApi.getThemeSettings(theme.value)
}

function emailProviderChanged(provider) {
  emailFields.value = emailProviderConfigs[provider] || []
}

async function savePanelSettings() {
  const serialized = themeApi.serializeThemeSettings(themeSettings.value)
  const resolvedBrand = (panelTitle.value || '').trim() || DEFAULT_BRAND_NAME
  panelTitle.value = resolvedBrand
  await api.settings.set({
    'panel.settings.masterUrl': masterUrl.value,
    'panel.settings.companyName': resolvedBrand,
    'panel.settings.defaultTheme': theme.value,
    'panel.settings.themeSettings': serialized,
    'panel.registrationEnabled': registrationEnabled.value
  })
  if (config && config.branding) {
    config.branding.name = resolvedBrand
    document.title = `Settings · ${resolvedBrand}`
  }
  // Apply to current session as well so admin immediately sees the updated default Studio theme
  try {
    themeApi.setTheme(theme.value, JSON.parse(serialized), true)
  } catch {
    // ignore
  }
  toast.success(t('settings.Saved'))
}

async function saveEmailSettings() {
  const data = { 'panel.email.provider': emailProvider.value }
  emailFields.value.map(elem => {
    data['panel.email.' + elem.key] = email.value[elem.key]
  })
  await api.settings.set(data)
  toast.success(t('settings.Saved'))
}

async function testEmailSettings() {
  await api.settings.sendTestEmail()
  toast.success(t('settings.TestEmailSent'))
}

onMounted(async () => {
  masterUrl.value = await api.settings.get('panel.settings.masterUrl')
  panelTitle.value = normalizeBrandName(await api.settings.get('panel.settings.companyName'))
  const regEnabled = await api.settings.get('panel.registrationEnabled')
  registrationEnabled.value = (regEnabled === 'true' || regEnabled === true)
  theme.value = (await api.settings.get('panel.settings.defaultTheme')) || 'PufferPanel'
  emailProvider.value = (await api.settings.get('panel.email.provider')) || 'none'
  emailProviderChanged(emailProvider.value)
  Object.keys(email.value).map(async key => {
    email.value[key] = await api.settings.get('panel.email.' + key)
  })
  await themeChanged()
  const rawSaved = await api.settings.get('panel.settings.themeSettings')
  if (rawSaved) {
    themeSettings.value = themeApi.deserializeThemeSettings(themeSettings.value, rawSaved)
  }
})

function updateThemeSetting(name, newSetting) {
  themeSettings.value = {
    ...themeSettings.value,
    [name]: newSetting
  }
}
</script>

<template>
  <div class="settings studio-admin-settings">
    <div class="panel accent-top-card">
      <h1 v-text="t('settings.PanelSettings')" />
      <div class="master-url studio-master-url">
        <div class="master-url-row">
          <text-field v-model="masterUrl" :label="t('settings.MasterUrl')" />
          <button
            type="button"
            class="master-url-autofill-btn"
            :title="t('settings.MasterUrl')"
            aria-label="Autofill Master URL"
            @click="autofillMasterUrl()"
          >
            <icon name="auto-fix" />
          </button>
        </div>
        <span class="master-url-hint" v-text="t('settings.MasterUrlHint')" />
      </div>
      <text-field v-model="panelTitle" :label="t('settings.CompanyName')" />
      <toggle v-model="registrationEnabled" :label="t('settings.RegistrationEnabled')" :hint="t('settings.RegistrationEnabledHint')" />
      <dropdown
        v-if="$theme.getThemes().length > 1"
        v-model="theme"
        :options="$theme.getThemes().map(th => ({ label: th === 'PufferPanel' ? 'Cupcake Box Studio' : th, value: th }))"
        :label="t('settings.DefaultTheme')"
        @change="themeChanged()"
      />

      <div class="studio-inline-theme-section">
        <theme-setting
          v-for="(setting, name) in themeSettings"
          :key="name"
          :model-value="setting"
          @update:modelValue="updateThemeSetting(name, $event)"
        />
      </div>

      <btn color="primary" @click="savePanelSettings()"><icon name="save" />{{ t('settings.SavePanelSettings') }}</btn>
    </div>

    <div class="settings-right-stack">
      <ThemeLivePreview :settings="themeSettings" :brand-title="panelTitle" />

      <div class="email accent-top-card">
        <h1 v-text="t('settings.EmailSettings')" />
        <dropdown v-model="emailProvider" :options="emailProviders" :label="t('settings.EmailProvider')" @change="emailProviderChanged" />
        <text-field v-for="elem in emailFields" :key="elem.key" v-model="email[elem.key]" :type="elem.type" :label="t('settings.email.' + elem.key)" />
        <div class="email-actions">
          <btn color="primary" @click="saveEmailSettings()"><icon name="save" />{{ t('settings.SaveEmailSettings') }}</btn>
          <btn variant="neutral" @click="testEmailSettings()"><icon name="test" />{{ t('settings.TestEmail') }}</btn>
        </div>
      </div>
    </div>
  </div>
</template>
