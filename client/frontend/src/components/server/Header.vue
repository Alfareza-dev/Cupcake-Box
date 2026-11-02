<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Btn from '@/components/ui/Btn.vue'
import Icon from '@/components/ui/Icon.vue'
import Overlay from '@/components/ui/Overlay.vue'
import TextField from '@/components/ui/TextField.vue'
import Controls from './Controls.vue'

const props = defineProps({
  server: { type: Object, required: true }
})

const { t } = useI18n()
const edit = ref(false)
const name = ref(props.server.name)
const displayName = ref(props.server.name)

async function updateName() {
  await props.server.updateName(name.value)
  displayName.value = name.value
  edit.value = false
}
</script>

<template>
  <div class="server-header">
    <div class="server-title-group">
      <div class="server-title-row">
        <h1 class="name">{{ displayName }}</h1>
        <btn
          v-if="server.hasScope('server.name.edit')"
          class="rename"
          variant="icon"
          :tooltip="t('servers.EditName')"
          @click="edit = !edit"
        >
          <icon name="edit" />
        </btn>
      </div>
      <div class="server-subtitle">
        <span>{{ server.type }}</span>
        <span class="sep">·</span>
        <span>{{ server.node?.name || 'Local Node' }}</span>
      </div>
    </div>
    <controls :server="server" />
  </div>
  <overlay v-model="edit" :title="t('servers.EditName')" closable class="server-name">
    <text-field v-model="name" />
    <btn color="primary" @click="updateName()"><icon name="save" />{{ t('common.Save') }}</btn>
  </overlay>
</template>
