<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Btn from '@/components/ui/Btn.vue'
import Icon from '@/components/ui/Icon.vue'

const { t } = useI18n()

const menuOpen = ref(false)
const restartDisabled = ref(false)
const status = ref(null)

function hideMenu() {
  if (!menuOpen.value) return
  menuOpen.value = false
}

function toggleMenu() {
  const state = menuOpen.value
  setTimeout(() => menuOpen.value = !state, 100)
}

const props = defineProps({
  server: { type: Object, required: true }
})

const hotkeys = {
  'r r': () => restart(),
  'r s': () => props.server.stop(),
  'r k': () => props.server.kill(),
  'r i': () => props.server.install()
}

function onHotkey(keys) {
  if (hotkeys[keys]) hotkeys[keys]()
}

const hasExtraActions =
  props.server.hasScope('server.kill') ||
  props.server.hasScope('server.install')

function restart() {
  if (!props.server.hasScope('server.start') || !props.server.hasScope('server.stop')) return
  props.server.restart()
  restartDisabled.value = true
  setTimeout(() => restartDisabled.value = false, 3000)
}

let unbindStatus = null
let pollTask = null

onMounted(async () => {
  unbindStatus = props.server.on('status', e => {
    if (e.installing) status.value = 'installing'
    else if (e.running) status.value = 'online'
    else status.value = 'offline'
  })

  if (props.server.hasScope('server.status')) {
    try {
      status.value = await props.server.getStatus()
    } catch {
      // ignore
    }
  }

  pollTask = props.server.startTask(async () => {
    if (props.server.needsPolling() && props.server.hasScope('server.status')) {
      try {
        status.value = await props.server.getStatus()
      } catch {
        // ignore
      }
    }
  }, 5000)
})

onUnmounted(() => {
  if (unbindStatus) unbindStatus()
  if (pollTask) props.server.stopTask(pollTask)
})
</script>

<template>
  <div v-hotkey="Object.keys(hotkeys)" class="server-controls" @hotkey="onHotkey">
    <button
      v-if="server.hasScope('server.start')"
      type="button"
      class="ctrl-btn start"
      :disabled="status === 'online' || status === 'installing'"
      @click="server.start()"
    >
      <span class="text">{{ t('servers.Start') }}</span>
    </button>
    <button
      v-if="server.hasScope('server.start') && server.hasScope('server.stop')"
      type="button"
      class="ctrl-btn restart"
      :disabled="restartDisabled || status === 'installing'"
      @click="restart()"
    >
      <span class="text">{{ t('servers.Restart') }}</span>
    </button>
    <button
      v-if="server.hasScope('server.stop')"
      type="button"
      class="ctrl-btn stop"
      :disabled="status === 'offline'"
      @click="server.stop()"
    >
      <span class="text">{{ t('servers.Stop') }}</span>
    </button>
    <button
      v-if="hasExtraActions"
      type="button"
      class="ctrl-btn more-toggle"
      :title="t('servers.Admin')"
      @click="toggleMenu()"
    >
      <icon name="menu" />
    </button>
    <div v-if="hasExtraActions" v-click-outside="hideMenu" :class="['menu', menuOpen ? 'open' : 'closed']">
      <btn v-if="server.hasScope('server.kill')" class="kill" @click="menuOpen = false; server.kill()">
        <icon name="kill" />
        <span class="text">{{ t('servers.Kill') }}</span>
      </btn>
      <btn v-if="server.hasScope('server.install')" class="install" @click="menuOpen = false; server.install()">
        <icon name="install" />
        <span class="text">{{ t('servers.Install') }}</span>
      </btn>
    </div>
  </div>
</template>
