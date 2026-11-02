<script setup>
import { ref, inject, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/ui/Icon.vue'
import Loader from '@/components/ui/Loader.vue'

const { t } = useI18n()
const api = inject('api')
const nodesLoaded = ref(false)
const nodes = ref([])
const firstEntry = ref(null)

onMounted(async () => {
  nodes.value = await api.node.list()
  nodesLoaded.value = true
})

function setFirstEntry(ref) {
  if (!firstEntry.value) firstEntry.value = ref
}

function focusList() {
  if (firstEntry.value && firstEntry.value.$el) firstEntry.value.$el.focus()
}
</script>

<template>
  <div class="nodelist studio-resource-list">
    <div class="studio-list-header">
      <div class="header-title-group">
        <h1 v-text="t('nodes.Nodes')" />
        <span v-if="nodesLoaded" class="count-pill">{{ nodes.length }}</span>
      </div>
      <router-link
        v-if="$api.auth.hasScope('nodes.create')"
        v-hotkey="'c'"
        :to="{ name: 'NodeCreate' }"
        class="studio-add-btn"
      >
        <icon name="plus" />
        <span>{{ t('nodes.Add') }}</span>
      </router-link>
    </div>
    <div v-hotkey="'l'" class="list" @hotkey="focusList()">
      <div v-for="node in nodes" :key="node.name" class="list-item">
        <router-link :ref="setFirstEntry" :to="{ name: 'NodeView', params: { id: node.id } }">
          <div class="node studio-resource-card">
            <div class="resource-badge">
              <icon name="node" />
            </div>
            <div class="resource-info">
              <span class="title">{{ node.name }}</span>
              <span class="subline mono">{{ node.publicHost + ':' + node.publicPort }}</span>
            </div>
            <icon name="chevron-right" class="resource-chevron" />
          </div>
        </router-link>
      </div>
      <div v-if="!nodesLoaded" class="list-item">
        <loader small />
      </div>
    </div>
  </div>
</template>
