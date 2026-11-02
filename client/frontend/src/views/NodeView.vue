<script setup>
import { ref, inject, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import markdown from '@/utils/markdown'
import Btn from '@/components/ui/Btn.vue'
import Icon from '@/components/ui/Icon.vue'
import Loader from '@/components/ui/Loader.vue'
import Overlay from '@/components/ui/Overlay.vue'
import TextField from '@/components/ui/TextField.vue'
import Toggle from '@/components/ui/Toggle.vue'

const api = inject('api')
const toast = inject('toast')
const events = inject('events')
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const deploymentOpen = ref(false)
let deploymentData = {}
const withPrivateHost = ref(false)
const name = ref('')
const publicHost = ref('')
const publicPort = ref('8080')
const privateHost = ref('')
const privatePort = ref('8080')
const sftpPort = ref('5657')
const currentStep = ref(1)
const featuresFetched = ref(null)
const features = ref({})
const nodeServerCount = ref(0)

onMounted(async () => {
  const node = await api.node.get(route.params.id)
  name.value = node.name
  publicHost.value = node.publicHost
  publicPort.value = node.publicPort
  privateHost.value = node.privateHost
  privatePort.value = node.privatePort
  sftpPort.value = node.sftpPort
  withPrivateHost.value = !(node.publicHost === node.privateHost && node.publicPort === node.privatePort)
  deploymentData = await api.node.deployment(route.params.id)
  if (route.query.created) {
    deploymentOpen.value = true
  }

  fetchFeatures()
  try {
    const sList = await api.server.list(1, 100)
    nodeServerCount.value = (sList.servers || []).filter(s => String(s.node?.id) === String(route.params.id)).length
  } catch {
    nodeServerCount.value = 0
  }
})

async function fetchFeatures() {
  featuresFetched.value = null
  features.value = {}
  try {
    const f = await api.node.features(route.params.id)
    features.value.envs = [...new Set(f.environments.map(e => e === 'standard' || e === 'tty' ? 'host' : e))].map(e => t(`env.${e}.name`))
    features.value.docker = f.features.indexOf('docker') !== -1
    features.value.os = f.os
    features.value.arch = f.arch
    featuresFetched.value = true
  } catch {
    featuresFetched.value = false
  }
}

function canSubmit() {
  if (!name.value) return false
  if (!publicHost.value) return false
  if (!publicPort.value) return false
  if (!sftpPort.value) return false
  if (withPrivateHost.value) {
    if (!privateHost.value) return false
    if (!privatePort.value) return false
  }
  return true
}

async function submit() {
  if (!canSubmit()) return
  const node = {
    name: name.value,
    publicHost: publicHost.value,
    publicPort: publicPort.value,
    sftpPort: sftpPort.value
  }
  if (withPrivateHost.value) {
    node.privateHost = privateHost.value
    node.privatePort = privatePort.value
  } else {
    node.privateHost = publicHost.value
    node.privatePort = publicPort.value
  }
  await api.node.update(route.params.id, node)
  toast.success(t('nodes.Updated'))
}

async function deleteNode() {
  events.emit(
    'confirm',
    t('nodes.ConfirmDelete', { name: name.value }),
    {
      text: t('nodes.Delete'),
      icon: 'remove',
      color: 'error',
      action: async () => {
        await api.node.delete(route.params.id)
        toast.success(t('nodes.Deleted'))
        router.push({ name: 'NodeList' })
      }
    },
    {
      color: 'primary'
    }
  )
}

function getDeployConfig() {
  const config = {
    logs: '/var/log/pufferpanel',
    web: {
      host: `0.0.0.0:${privatePort.value}`
    },
    token: {
      public: location.origin + '/auth/publickey'
    },
    panel: {
      enable: false
    },
    daemon: {
      auth: {
        url: location.origin + '/oauth2/token',
        ...deploymentData
      },
      data: {
        root: '/var/lib/pufferpanel'
      },
      sftp: {
        host: `0.0.0.0:${sftpPort.value}`
      }
    }
  }
  return JSON.stringify(config, undefined, 2)
}

function closeDeploy() {
  deploymentOpen.value = false
  currentStep.value = 1
  fetchFeatures()
}
</script>

<template>
  <div class="nodeview studio-nodeview">
    <div class="studio-page-topbar">
      <div class="title-wrap">
        <h1 v-text="name || t('nodes.Nodes')" />
        <span class="subtitle">A quick overview and configuration of your node.</span>
      </div>
      <div class="breadcrumb">
        <span>Admin</span>
        <span class="sep">&rsaquo;</span>
        <router-link :to="{ name: 'NodeList' }">{{ t('nodes.Nodes') }}</router-link>
        <span class="sep">&rsaquo;</span>
        <span class="current">{{ name }}</span>
      </div>
    </div>

    <div class="studio-node-grid">
      <div class="studio-node-left">
        <!-- Information Card -->
        <div class="studio-section-card accent-top">
          <div class="studio-card-header">Information</div>
          <div class="studio-card-body no-pad">
            <div v-if="featuresFetched === null" class="pad-box">
              <loader small />
            </div>
            <div v-else-if="featuresFetched === false" class="pad-box">
              <div class="unreachable-pill" v-text="t('nodes.Unreachable')" />
            </div>
            <div v-else class="studio-kv-table">
              <div class="kv-row">
                <span class="kv-key">Daemon Status</span>
                <span class="kv-val status-ok">{{ t('nodes.Reachable') }}</span>
              </div>
              <div class="kv-row">
                <span class="kv-key">{{ t('nodes.features.os.label') }}</span>
                <span class="kv-val"><code>{{ t('nodes.features.os.' + features.os) }} ({{ t('nodes.features.arch.' + features.arch) }})</code></span>
              </div>
              <div class="kv-row">
                <span class="kv-key">{{ t('nodes.features.envs') }}</span>
                <span class="kv-val">{{ features.envs.join(', ') }}</span>
              </div>
              <div class="kv-row">
                <span class="kv-key">{{ t('env.docker.name') }}</span>
                <span class="kv-val">{{ t('nodes.features.docker.' + features.docker) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit / Configuration Card -->
        <div class="studio-section-card accent-top">
          <div class="studio-card-header" v-text="t('nodes.Edit')" />
          <div class="studio-card-body">
            <div v-if="Number(route.params.id) > 0" class="edit">
              <text-field v-model="name" class="name" :label="t('common.Name')" />
              <text-field v-model="publicHost" class="public-host" :label="t('nodes.PublicHost')" />
              <text-field v-model="publicPort" class="public-port" :label="t('nodes.PublicPort')" type="number" />
              <toggle v-model="withPrivateHost" class="private-toggle" :label="t('nodes.WithPrivateAddress')" :hint="t('nodes.WithPrivateAddressHint')" />
              <text-field v-if="withPrivateHost" v-model="privateHost" class="private-host" :label="t('nodes.PrivateHost')" />
              <text-field v-if="withPrivateHost" v-model="privatePort" class="private-port" :label="t('nodes.PrivatePort')" type="number" />
              <text-field v-model="sftpPort" class="sftp-port" :label="t('nodes.SftpPort')" type="number" />
              <div class="node-edit-actions">
                <btn :disabled="!canSubmit()" color="primary" @click="submit()"><icon name="save" />{{ t('nodes.Update') }}</btn>
                <btn variant="neutral" @click="deploymentOpen = true" v-text="t('nodes.Deploy')" />
              </div>
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-else class="local-node-note" v-html="markdown(t('nodes.LocalNodeEdit'))" />
          </div>
        </div>

        <!-- Danger Zone Card -->
        <div v-if="Number(route.params.id) > 0" class="studio-section-card danger-top">
          <div class="studio-card-header">{{ t('nodes.Delete') }}</div>
          <div class="studio-card-body">
            <p class="danger-desc">
              Deleting a node is an irreversible action and will immediately remove this node from the panel. Ensure no active servers remain linked before continuing.
            </p>
            <div class="danger-footer">
              <btn color="error" class="danger-btn" @click="deleteNode()">
                <icon name="remove" />{{ t('nodes.Delete') }}
              </btn>
            </div>
          </div>
        </div>
      </div>

      <!-- Right At-a-Glance Column -->
      <div class="studio-node-right">
        <div class="studio-section-card accent-top">
          <div class="studio-card-header">At-a-Glance</div>
          <div class="studio-card-body glance-stack">
            <div class="glance-tile sage">
              <div class="glance-icon"><icon name="network" /></div>
              <div class="glance-info">
                <span class="glance-label">PUBLIC ENDPOINT</span>
                <span class="glance-val">{{ publicHost || '127.0.0.1' }}:{{ publicPort }}</span>
              </div>
            </div>

            <div class="glance-tile moss">
              <div class="glance-icon"><icon name="sftp" /></div>
              <div class="glance-info">
                <span class="glance-label">SFTP PORT</span>
                <span class="glance-val">{{ sftpPort }}</span>
              </div>
            </div>

            <div class="glance-tile teal">
              <div class="glance-icon"><icon name="server" /></div>
              <div class="glance-info">
                <span class="glance-label">TOTAL SERVERS</span>
                <span class="glance-val">{{ nodeServerCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <overlay v-model="deploymentOpen" closable :title="t('nodes.Deploy')" @close="closeDeploy()">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="markdown(t(`nodes.deploy.Step${currentStep}`, { config: getDeployConfig() }))" />
      <btn v-if="currentStep < 5" @click="currentStep += 1" v-text="t('common.Next')" />
      <btn v-else @click="closeDeploy()" v-text="t('common.Close')" />
    </overlay>
  </div>
</template>
