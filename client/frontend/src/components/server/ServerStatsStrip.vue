<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps({
  server: { type: Object, required: true }
})

const { t, locale } = useI18n()

const status = ref('offline')
const cpu = ref(0)
const memory = ref(0)
const maxMemoryMb = ref(null)

const numFormat = new Intl.NumberFormat(
  [locale.value.replace('_', '-'), 'en'],
  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
)

function formatBytes(value) {
  if (!value || value <= 0) return '0 B'
  if (value < 1024) return `${Math.round(value)} B`
  if (value < 1024 * 1024) return `${numFormat.format(value / 1024)} KiB`
  if (value < 1024 * 1024 * 1024) return `${numFormat.format(value / (1024 * 1024))} MiB`
  return `${numFormat.format(value / (1024 * 1024 * 1024))} GiB`
}

const address = computed(() => {
  let host = props.server.node?.publicHost || '127.0.0.1'
  if (props.server.ip && props.server.ip !== '0.0.0.0' && props.server.ip !== props.server.id) {
    host = props.server.ip
  }
  return host + (props.server.port ? `:${props.server.port}` : '')
})

const statusText = computed(() => {
  if (status.value === 'online') return t('common.Online')
  if (status.value === 'installing') return t('common.Installing')
  if (status.value === 'offline') return t('common.Offline')
  return t('common.Unknown')
})

const cpuFormatted = computed(() => `${numFormat.format(cpu.value || 0)}%`)
const memoryFormatted = computed(() => formatBytes(memory.value))
const memoryLimitText = computed(() => {
  if (maxMemoryMb.value && Number(maxMemoryMb.value) > 0) {
    return `/ ${maxMemoryMb.value} MiB`
  }
  return '/ ∞'
})

let stopStatus = null
let stopStat = null
let pollTask = null

function applyStats(d) {
  if (!d) return
  cpu.value = Number(d.cpu) || 0
  memory.value = Number(d.memory) || 0
}

onMounted(async () => {
  stopStatus = props.server.on('status', e => {
    if (e.installing) {
      status.value = 'installing'
    } else if (e.running) {
      status.value = 'online'
    } else {
      status.value = 'offline'
      cpu.value = 0
      memory.value = 0
    }
  })

  stopStat = props.server.on('stat', applyStats)

  if (props.server.hasScope('server.status')) {
    try {
      status.value = await props.server.getStatus()
    } catch {
      // ignore initial status fetch errors
    }
  }

  if (props.server.hasScope('server.stats') && status.value === 'online') {
    try {
      applyStats(await props.server.getStats())
    } catch {
      // ignore initial stats fetch errors
    }
  }

  if (props.server.hasScope('server.data.view')) {
    try {
      const res = await props.server.getData()
      const dataObj = res?.data || res
      if (dataObj?.memory?.value && !isNaN(Number(dataObj.memory.value))) {
        maxMemoryMb.value = Number(dataObj.memory.value)
      }
    } catch {
      // optional metadata
    }
  }

  pollTask = props.server.startTask(async () => {
    if (!props.server.needsPolling()) return
    if (props.server.hasScope('server.status')) {
      try {
        status.value = await props.server.getStatus()
      } catch {
        // ignore
      }
    }
    if (props.server.hasScope('server.stats') && status.value === 'online') {
      try {
        applyStats(await props.server.getStats())
      } catch {
        // ignore
      }
    }
  }, 5000)
})

onUnmounted(() => {
  if (stopStatus) stopStatus()
  if (stopStat) stopStat()
  if (pollTask) props.server.stopTask(pollTask)
})
</script>

<template>
  <div class="server-stats-strip">
    <div class="stat-pill">
      <icon name="wifi" class="stat-pill-icon" />
      <div class="stat-pill-body">
        <span class="stat-pill-label">ADDRESS</span>
        <span class="stat-pill-value" :title="address">{{ address }}</span>
      </div>
    </div>

    <div class="stat-pill">
      <span :class="['status-dot', status]" />
      <div class="stat-pill-body">
        <span class="stat-pill-label">STATUS</span>
        <span class="stat-pill-value">{{ statusText }}</span>
      </div>
    </div>

    <div class="stat-pill">
      <icon name="cpu" class="stat-pill-icon" />
      <div class="stat-pill-body">
        <span class="stat-pill-label">CPU LOAD</span>
        <span class="stat-pill-value">
          {{ cpuFormatted }} <small>/ ∞</small>
        </span>
      </div>
    </div>

    <div class="stat-pill">
      <icon name="memory" class="stat-pill-icon" />
      <div class="stat-pill-body">
        <span class="stat-pill-label">MEMORY</span>
        <span class="stat-pill-value">
          {{ memoryFormatted }} <small>{{ memoryLimitText }}</small>
        </span>
      </div>
    </div>

    <div class="stat-pill">
      <icon name="network" class="stat-pill-icon" />
      <div class="stat-pill-body">
        <span class="stat-pill-label">NODE</span>
        <span class="stat-pill-value" :title="server.node?.name">{{ server.node?.name || 'Local' }}</span>
      </div>
    </div>

    <div class="stat-pill">
      <icon name="sftp" class="stat-pill-icon" />
      <div class="stat-pill-body">
        <span class="stat-pill-label">TYPE · SFTP</span>
        <span class="stat-pill-value">{{ server.type }} <small>:{{ server.node?.sftpPort || 5657 }}</small></span>
      </div>
    </div>
  </div>
</template>

