<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/ui/Icon.vue'
import Stats from './Stats.vue'

import ConsoleWorker from '@/utils/consoleWorker.js?worker&inline'
const worker = new ConsoleWorker()
let lastElem = null

const { t } = useI18n()
const config = inject('config')
const panelName = computed(() => config?.branding?.name || 'Cupcake Box')

const command = ref('')
const consoleEl = ref(null)
let lastMessageTime = 0

const props = defineProps({
  server: { type: Object, required: true }
})

let unbindEvent = null
let task = null
onMounted(async () => {
  worker.addEventListener('message', onWorkerMessage)
  unbindEvent = props.server.on('console', onMessage)

  if (props.server.hasScope('server.console')) {
    try {
      onMessage(await props.server.getConsole())
    } catch {
      // ignore initial console error
    }
  }

  task = props.server.startTask(async () => {
    if (props.server.needsPolling() && props.server.hasScope('server.console')) {
      try {
        onMessage(await props.server.getConsole(lastMessageTime))
      } catch {
        // ignore polling error
      }
    }
  }, 5000)
})

onUnmounted(() => {
  worker.removeEventListener('message', onWorkerMessage)
  if (unbindEvent) unbindEvent()
  if (task) props.server.stopTask(task)
  clearConsole()
})

function onMessage(e) {
  if (!e) return
  if ('epoch' in e) {
    lastMessageTime = e.epoch
  } else {
    lastMessageTime = Date.now()
  }
  worker.postMessage({ ...e, panelName: panelName.value })
}

function onWorkerMessage(e) {
  if (!consoleEl.value) return
  const newElems = []
  e.data.map(update => {
    if (update.op === 'update' && lastElem) {
      lastElem.innerHTML = update.content
    } else {
      const el = document.createElement('div')
      el.innerHTML = update.content
      newElems.push(el)
      lastElem = el
    }
  })
  if (newElems.length + consoleEl.value.children.length > 1200) {
    let elems = Array.from(consoleEl.value.children).concat(newElems)
    elems = elems.slice(elems.length - 1000, elems.length)
    consoleEl.value.replaceChildren(...elems)
  } else {
    consoleEl.value.append(...newElems)
  }
}

function clearConsole() {
  if (consoleEl.value) consoleEl.value.replaceChildren()
}

const history = ref([])
const historyIndex = ref(-1)
const temporaryCommand = ref('')

function sendCommand() {
  if (!command.value.trim()) return

  if (historyIndex.value !== -1) {
    history.value.splice(historyIndex.value, 1)
  }

  if (history.value.length === 0 || history.value[history.value.length - 1] !== command.value) {
    history.value.push(command.value)
  }

  historyIndex.value = -1
  temporaryCommand.value = ''

  if (history.value.length > 100) {
    history.value.splice(0, 1)
  }

  props.server.sendCommand(command.value)
  command.value = ''
}

function previousCommand() {
  if (historyIndex.value === -1 && history.value.length > 0) {
    historyIndex.value = history.value.length - 1
    temporaryCommand.value = command.value
  } else if (historyIndex.value > 0) {
    historyIndex.value--
  } else {
    return
  }

  command.value = history.value[historyIndex.value]
}

function nextCommand() {
  if (historyIndex.value === -1) {
    return
  }

  historyIndex.value++

  if (historyIndex.value >= history.value.length) {
    historyIndex.value = -1
    command.value = temporaryCommand.value
  } else {
    command.value = history.value[historyIndex.value]
  }
}
</script>

<template>
  <div class="studio-console-section">
    <div v-if="server.hasScope('server.console')" class="console-shell">
      <button
        v-hotkey="'c x'"
        type="button"
        class="console-clear-btn"
        :title="t('common.Clear') || 'Clear console'"
        @click="clearConsole()"
      >
        <icon name="clear-console" />
      </button>
      <div dir="ltr" class="console-wrapper">
        <div ref="consoleEl" class="console" />
      </div>
    </div>

    <div v-if="server.hasScope('server.console.send')" dir="ltr" class="studio-command-bar">
      <icon name="prompt" class="prompt-icon" />
      <input
        v-model="command"
        v-hotkey="'c c'"
        type="text"
        class="command-input"
        placeholder="Type a command..."
        @keyup.enter="sendCommand()"
        @keydown.up.prevent="previousCommand()"
        @keydown.down.prevent="nextCommand()"
      />
      <button type="button" class="command-send-btn" :disabled="!command.trim()" @click="sendCommand()">
        <icon name="send" />
      </button>
    </div>

    <Stats v-if="server.hasScope('server.stats')" :server="server" compact />
  </div>
</template>
