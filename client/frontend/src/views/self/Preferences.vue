<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { updateLocale, locales } from '@/plugins/i18n'
import Btn from '@/components/ui/Btn.vue'
import Dropdown from '@/components/ui/Dropdown.vue'
import Icon from '@/components/ui/Icon.vue'
import Loader from '@/components/ui/Loader.vue'
import ThemeSetting from '@/components/ui/ThemeSetting.vue'
import ThemeLivePreview from '@/components/ui/ThemeLivePreview.vue'

const { t, locale } = useI18n()
const toast = inject('toast')
const themeApi = inject('theme')

const loading = ref(false)
const theme = ref(themeApi.getActiveTheme())
const themeSettings = ref({})
const selectedLocale = ref(locale.value)

const colorKeys = ['baseTone', 'accentColor']
const colorSettings = computed(() => {
  const res = {}
  for (const key of colorKeys) {
    if (themeSettings.value[key]) res[key] = themeSettings.value[key]
  }
  return res
})

const otherSettings = computed(() => {
  const res = {}
  for (const key of Object.keys(themeSettings.value)) {
    if (!colorKeys.includes(key)) res[key] = themeSettings.value[key]
  }
  return res
})

onMounted(async () => {
  loading.value = true
  themeSettings.value = await themeApi.getThemeSettings()
  loading.value = false
})

async function themeChanged() {
  themeSettings.value = await themeApi.getThemeSettings(theme.value)
}

function buildRawSettings() {
  const settings = {}
  Object.keys(themeSettings.value).map(key => {
    settings[key] = themeSettings.value[key].current
  })
  return settings
}

function savePreferences() {
  if (locale.value !== selectedLocale.value) {
    updateLocale(selectedLocale.value)
  }

  themeApi.setTheme(theme.value, buildRawSettings(), true)
  toast.success(t('users.PreferencesUpdated'))
}

function updateThemeSetting(name, newSetting) {
  themeSettings.value = {
    ...themeSettings.value,
    [name]: newSetting
  }
  // Apply live without persisting until Save is clicked
  themeApi.setTheme(theme.value, buildRawSettings(), false)
}
</script>

<template>
  <div v-if="loading" class="preferences loading"><loader /></div>
  <div v-else class="preferences studio-theme-configurator">
    <div class="studio-config-header">
      <div class="studio-config-title-row">
        <span class="studio-title">Studio Theme</span>
        <span class="studio-version-badge">v3.0</span>
      </div>
      <p class="studio-config-subtitle">
        A calm dark theme: server menu on the left, stats above a full-width console, large server cards. Base tone, accent colour and logo are configurable.
      </p>
    </div>

    <div class="studio-config-columns">
      <div class="studio-config-left">
        <div v-if="Object.keys(colorSettings).length > 0" class="studio-section-card accent-top">
          <div class="studio-card-header">Colours</div>
          <div class="studio-card-body">
            <theme-setting
              v-for="(setting, name) in colorSettings"
              :key="name"
              :model-value="setting"
              @update:modelValue="updateThemeSetting(name, $event)"
            />
          </div>
        </div>

        <div class="studio-section-card accent-top">
          <div class="studio-card-header">Branding and preferences</div>
          <div class="studio-card-body">
            <theme-setting
              v-for="(setting, name) in otherSettings"
              :key="name"
              :model-value="setting"
              @update:modelValue="updateThemeSetting(name, $event)"
            />

            <dropdown
              v-model="selectedLocale"
              class="locale-select"
              :options="locales"
              :label="t('common.Language')"
            >
              <template #singlelabel="{ value }">
                <div class="multiselect-single-label">
                  <span :data-locale="value.value" /> {{ value.label }}
                </div>
              </template>

              <template #option="{ option }">
                <span :data-locale="option.value" /> {{ option.label }}
              </template>
            </dropdown>

            <dropdown
              v-if="$theme.getThemes().length > 1"
              v-model="theme"
              :options="$theme.getThemes().map(th => ({ label: th === 'PufferPanel' ? 'Cupcake Box Studio' : th, value: th }))"
              :label="t('common.theme.Theme')"
              @change="themeChanged()"
            />
          </div>
          <div class="studio-card-footer">
            <btn color="primary" class="studio-save-btn" @click="savePreferences()">
              <icon name="save" />{{ t('common.Save') }}
            </btn>
          </div>
        </div>
      </div>

      <div class="studio-config-right">
        <ThemeLivePreview :settings="themeSettings" />
      </div>
    </div>
  </div>
</template>
