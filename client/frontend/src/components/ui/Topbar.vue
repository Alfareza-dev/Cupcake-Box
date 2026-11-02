<script setup>
import { computed, inject } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import md5 from 'js-md5'
import BrandIcon from './BrandIcon.vue'
import Icon from './Icon.vue'
import PanelSearch from './PanelSearch.vue'

const props = defineProps({
  user: { type: Object, default: () => undefined }
})

defineEmits(['toggleSidebar'])

const { t } = useI18n()
const router = useRouter()
const api = inject('api')
const events = inject('events')
const config = inject('config')
const themeSettings = inject('themeSettings', null)
const name = computed(() => config?.branding?.name || 'Cupcake Box')

const logoUrl = computed(() => {
  const raw = themeSettings && themeSettings.value ? themeSettings.value.logoUrl : ''
  return typeof raw === 'string' ? raw.trim() : ''
})

const canEditSettings = computed(() => {
  return Boolean(props.user && api.auth.isLoggedIn() && api.auth.hasScope('settings.edit'))
})

function getAvatarLink() {
  return 'https://www.gravatar.com/avatar/' + md5(props.user.email.trim().toLowerCase()) + '?d=mp'
}

async function logout() {
  await api.auth.logout()
  router.push({ name: 'Login' })
  events.emit('logout')
}
</script>

<template>
  <header class="topbar">
    <icon class="sidebar-toggle" name="nav-menu" @click="$emit('toggleSidebar')" />
    <router-link :to="props.user ? { name: 'ServerList' } : { name: 'Login' }" class="brand-link">
      <img v-if="logoUrl" :src="logoUrl" :alt="name" class="custom-logo" />
      <template v-else>
        <span class="topbar-brand-mark">
          <BrandIcon :size="19" />
        </span>
        <div :data-name="name" class="name">
          {{ name }}
        </div>
      </template>
    </router-link>
    <div class="topbar-spacer" />
    <div v-if="props.user" class="topbar-actions">
      <panel-search />
      <router-link :to="{ name: 'ServerList' }" class="topbar-icon-btn" :title="t('servers.Servers')">
        <icon name="server" />
      </router-link>
      <router-link v-if="canEditSettings" :to="{ name: 'Settings' }" class="topbar-icon-btn" :title="t('settings.Settings')">
        <icon name="settings" />
      </router-link>
      <router-link v-hotkey="'g a'" :to="{ name: 'Self' }" class="topbar-avatar-link" :title="props.user.username || props.user.email">
        <img class="avatar" :src="getAvatarLink()" :alt="props.user.username || 'Account'" />
      </router-link>
      <button type="button" class="topbar-icon-btn logout-btn" :title="t('users.Logout')" @click="logout()">
        <icon name="logout" />
      </button>
    </div>
  </header>
</template>
