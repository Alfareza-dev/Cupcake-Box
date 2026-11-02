<script setup>
import { ref, computed, inject, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/ui/Icon.vue'
import Loader from '@/components/ui/Loader.vue'

const api = inject('api')
const { t, locale } = useI18n()

const servers = ref([])
const onlineOnly = ref(false)
let lastPage = 0
let loadingPage = false
const allServersLoaded = ref(false)
const loaderRef = ref(null)
const firstEntry = ref(null)
let interval = null

const numFormat = new Intl.NumberFormat(
  [locale.value.replace('_', '-'), 'en'],
  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
)

function formatCpu(val) {
  return `${numFormat.format(val || 0)} %`
}

function formatBytes(val) {
  if (!val || val <= 0) return '0 Bytes'
  if (val < 1024) return `${Math.round(val)} Bytes`
  if (val < 1024 * 1024) return `${numFormat.format(val / 1024)} KiB`
  if (val < 1024 * 1024 * 1024) return `${numFormat.format(val / (1024 * 1024))} MiB`
  return `${numFormat.format(val / (1024 * 1024 * 1024))} GiB`
}

function statusLabel(state) {
  if (state === 'online') return t('common.Online')
  if (state === 'installing') return t('common.Installing')
  if (state === 'loading') return '...'
  return t('common.Offline')
}

const filteredServers = computed(() => {
  if (!onlineOnly.value) return servers.value
  return servers.value.filter(s => s.online === 'online' || s.online === 'installing')
})

function addServers(newServers) {
  newServers.map(server => servers.value.push({
    ...server,
    cpu: 0,
    memory: 0
  }))
  refreshServerStatus()
}

async function refreshServerStatus() {
  servers.value.map(async s => {
    if (s.canGetStatus) {
      if (!s.online) s.online = 'loading'
      try {
        s.online = await api.server.getStatus(s.id)
        if (s.online === 'online') {
          try {
            const st = await api.server.getStats(s.id)
            s.cpu = st?.cpu || 0
            s.memory = st?.memory || 0
          } catch {
            s.cpu = 0
            s.memory = 0
          }
        } else {
          s.cpu = 0
          s.memory = 0
        }
      } catch {
        s.online = 'offline'
        s.cpu = 0
        s.memory = 0
      }
    }
  })
}

function isLoaderVisible() {
  if (!loaderRef.value || !loaderRef.value.$el) return false
  const vw = window.innerWidth || document.documentElement.clientWidth
  const vh = window.innerHeight || document.documentElement.clientHeight
  const rect = loaderRef.value.$el.getBoundingClientRect()
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= vh && rect.right <= vw
}

async function loadPage(page = 1) {
  loadingPage = true
  const data = await api.server.list(page)
  addServers(data.servers)
  lastPage = data.paging.page
  allServersLoaded.value = data.paging.page * data.paging.pageSize >= (data.paging.total || 0)
  nextTick(() => {
    loadingPage = false
    if (!allServersLoaded.value && isLoaderVisible()) loadPage(lastPage + 1)
  })
}

function onScroll() {
  if (!loadingPage && !allServersLoaded.value && isLoaderVisible()) loadPage(lastPage + 1)
}

onMounted(() => {
  interval = setInterval(refreshServerStatus, 10 * 1000)
  nextTick(() => {
    loadPage()
    window.addEventListener('scroll', onScroll)
  })
})

onUnmounted(() => {
  clearInterval(interval)
  window.removeEventListener('scroll', onScroll)
})

function getServerAddress(server) {
  let ip = server.node?.publicHost || '127.0.0.1'
  if (server.ip && server.ip !== '0.0.0.0') {
    ip = server.ip
  }
  return ip + (server.port ? ':' + server.port : '')
}

function setFirstEntry(el) {
  if (!firstEntry.value && el) firstEntry.value = el
}

function focusList() {
  if (firstEntry.value && firstEntry.value.$el) {
    firstEntry.value.$el.focus()
  }
}
</script>

<template>
  <div class="serverlist studio-serverlist">
    <div class="serverlist-header">
      <h1 v-text="t('servers.Servers')" />
      <div class="serverlist-header-actions">
        <label class="online-filter-toggle">
          <span class="filter-label">{{ onlineOnly ? 'SHOWING ONLINE SERVERS' : 'SHOWING YOUR SERVERS' }}</span>
          <input v-model="onlineOnly" type="checkbox" />
          <span class="filter-pill" />
        </label>
        <router-link
          v-if="$api.auth.hasScope('server.create')"
          v-hotkey="'c'"
          :to="{ name: 'ServerCreate' }"
          class="studio-add-btn"
        >
          <icon name="plus" />
          <span>{{ t('servers.Add') }}</span>
        </router-link>
      </div>
    </div>

    <div v-hotkey="'l'" class="studio-server-grid" @hotkey="focusList()">
      <router-link
        v-for="server in filteredServers"
        :key="server.id"
        :ref="setFirstEntry"
        :to="{ name: 'ServerView', params: { id: server.id } }"
        class="studio-server-card-link"
      >
        <article
          :class="['studio-server-card', `server-${(server.icon || 'none')}`]"
          :data-online="server.online || 'offline'"
        >
          <div class="card-top">
            <div class="server-card-badge">
              <icon name="node" />
            </div>
            <div class="server-card-heading">
              <div class="server-card-title" :title="server.name">{{ server.name }}</div>
              <div class="server-card-subtitle">{{ server.type }} · {{ server.node?.name || 'Local' }}</div>
            </div>
          </div>

          <div class="server-card-address">
            <icon name="wifi" />
            <span>{{ getServerAddress(server) }}</span>
          </div>

          <div class="server-card-stats">
            <div class="stat-field">
              <div class="stat-main">
                <icon name="cpu" />
                <span>{{ formatCpu(server.cpu) }}</span>
              </div>
              <div class="stat-sub">of Unlimited</div>
            </div>

            <div class="stat-field">
              <div class="stat-main">
                <icon name="memory" />
                <span>{{ formatBytes(server.memory) }}</span>
              </div>
              <div class="stat-sub">{{ server.online === 'online' ? 'Active RAM' : 'of Unlimited' }}</div>
            </div>

            <div class="stat-field">
              <div class="stat-main">
                <icon name="disk" />
                <span>{{ server.node?.name || 'Local' }}</span>
              </div>
              <div class="stat-sub">{{ statusLabel(server.online) }}</div>
            </div>
          </div>

          <span :class="['server-status-bar', server.online || 'offline']" />
        </article>
      </router-link>

      <div v-if="!allServersLoaded" class="server-grid-loader">
        <loader ref="loaderRef" small />
      </div>
    </div>
  </div>
</template>
