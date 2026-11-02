<script setup>
import { ref, computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { List, ListItem, ListItemContent, ListItemIcon } from '@/components/ui/list'
import { serverNav } from '@/utils/serverNav'

const props = defineProps({
  right: { type: Boolean, default: () => false },
  closed: { type: Boolean, default: () => false }
})

const emit = defineEmits(['navigate'])

const api = inject('api')
const events = inject('events')
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const allowedRoutes = computed(() => {
  // Touch route.fullPath so computed refreshes across route/auth transitions
  void route.fullPath
  return router.getRoutes().filter(e => {
    if (e.meta.permission === true) return true
    return e.meta.permission && api.auth.isLoggedIn() && api.auth.hasScope(e.meta.permission)
  })
})

const panelRoutes = computed(() => allowedRoutes.value.filter(r => r.name === 'ServerList'))
const adminRoutes = computed(() => allowedRoutes.value.filter(r => r.name !== 'ServerList'))

const mini = ref(localStorage.getItem('sidebar.mini') === 'true')

function selectServerTab(key) {
  if (serverNav.selectTab) {
    serverNav.selectTab(key)
  }
  emit('navigate')
}

async function logout() {
  await api.auth.logout()
  router.push({ name: 'Login' })
  events.emit('logout')
}

function toggleMini() {
  mini.value = !mini.value
  localStorage.setItem('sidebar.mini', mini.value ? 'true' : 'false')
}
</script>

<template>
  <nav :class="['sidebar', props.right ? 'right' : 'left', mini ? 'mini' : '', closed ? 'closed' : 'open']">
    <div tabindex="-1" class="sidebar-content-top">
      <template v-if="serverNav.server && serverNav.tabs.length > 0">
        <div class="sidebar-section">
          <div class="sidebar-section-label">SERVER</div>
          <list class="server-nav-list">
            <list-item
              v-for="tab in serverNav.tabs"
              :key="tab.key"
              v-hotkey="tab.hotkey"
              tabindex="0"
              :class="['clickable', serverNav.activeTab === tab.key ? 'active' : '']"
              @click="selectServerTab(tab.key)"
              @keyup.enter="selectServerTab(tab.key)"
            >
              <list-item-icon v-if="tab.icon" :icon="tab.icon" />
              <list-item-content v-text="tab.title" />
            </list-item>
          </list>
        </div>
        <div class="sidebar-divider" />
      </template>

      <div v-if="panelRoutes.length > 0" class="sidebar-section">
        <div class="sidebar-section-label">PANEL</div>
        <list>
          <list-item
            v-for="r in panelRoutes"
            :key="r.name"
            v-hotkey="r.meta.hotkey"
            :to="r"
            @click="emit('navigate')"
          >
            <list-item-icon v-if="r.meta.icon" :icon="r.meta.icon" />
            <list-item-content v-text="t(r.meta.tkey ? r.meta.tkey : 'common.navigation.' + r.name)" />
          </list-item>
        </list>
      </div>

      <div v-if="adminRoutes.length > 0" class="sidebar-section">
        <div class="sidebar-section-label">ADMINISTRATION</div>
        <list>
          <list-item
            v-for="r in adminRoutes"
            :key="r.name"
            v-hotkey="r.meta.hotkey"
            :to="r"
            @click="emit('navigate')"
          >
            <list-item-icon v-if="r.meta.icon" :icon="r.meta.icon" />
            <list-item-content v-text="t(r.meta.tkey ? r.meta.tkey : 'common.navigation.' + r.name)" />
          </list-item>
        </list>
      </div>
    </div>

    <div tabindex="-1" class="sidebar-content-bottom">
      <list>
        <list-item :to="{ name: 'Self' }" @click="emit('navigate')">
          <list-item-icon icon="account" />
          <list-item-content v-text="t('users.Preferences')" />
        </list-item>
        <list-item tabindex="0" class="collapse-toggle clickable" @click="toggleMini()">
          <list-item-icon :icon="mini ? 'chevron-right' : 'chevron-left'" />
          <list-item-content v-text="t('common.' + (mini ? 'Expand' : 'Collapse'))" />
        </list-item>
        <list-item tabindex="0" class="clickable" @click="logout()">
          <list-item-icon icon="logout" />
          <list-item-content v-text="t('users.Logout')" />
        </list-item>
      </list>
    </div>
  </nav>
</template>
