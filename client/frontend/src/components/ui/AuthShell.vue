<script setup>
import { computed, inject } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BrandIcon from './BrandIcon.vue'
import Icon from './Icon.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  mode: { type: String, default: 'login' } // 'login' | 'register' | 'invite'
})

const { t } = useI18n()
const config = inject('config')
const themeSettings = inject('themeSettings', null)

const brandName = computed(() => config?.branding?.name || 'Cupcake Box')
const registrationEnabled = computed(() => Boolean(config?.registrationEnabled))

const logoUrl = computed(() => {
  const raw = themeSettings && themeSettings.value ? themeSettings.value.logoUrl : ''
  return typeof raw === 'string' ? raw.trim() : ''
})
</script>

<template>
  <div class="studio-auth-shell">
    <!-- Left Showcase Column -->
    <aside class="studio-auth-showcase">
      <div class="showcase-top">
        <div class="showcase-brand">
          <img v-if="logoUrl" :src="logoUrl" :alt="brandName" class="showcase-custom-logo" />
          <template v-else>
            <span class="showcase-mark">
              <BrandIcon :size="22" />
            </span>
            <span class="showcase-brand-name">{{ brandName }}</span>
          </template>
        </div>

        <div class="showcase-copy">
          <h2>Server management, stripped of noise.</h2>
          <p class="showcase-lead">
            Deploy, monitor, and scale game or application servers from one unified platform — engineered for fast provisioning, real-time observability, and reliable multi-node operations.
          </p>
        </div>

        <!-- Highlighted Key Platform Features -->
        <div class="showcase-highlights">
          <div class="highlight-card">
            <span class="highlight-icon"><icon name="console" /></span>
            <div class="highlight-text">
              <strong>Live Console &amp; Telemetry</strong>
              <span>Instant WebSocket logs, CPU, RAM &amp; network metrics</span>
            </div>
          </div>

          <div class="highlight-card">
            <span class="highlight-icon"><icon name="files" /></span>
            <div class="highlight-text">
              <strong>Web Files, SFTP &amp; Backups</strong>
              <span>Built-in code editor, archive manager &amp; snapshots</span>
            </div>
          </div>

          <div class="highlight-card">
            <span class="highlight-icon"><icon name="node" /></span>
            <div class="highlight-text">
              <strong>Multi-Node &amp; Templates</strong>
              <span>1-click deployment across Docker &amp; host nodes</span>
            </div>
          </div>

          <div class="highlight-card">
            <span class="highlight-icon"><icon name="shield" /></span>
            <div class="highlight-text">
              <strong>Granular Access &amp; 2FA</strong>
              <span>Scoped team permissions, OAuth2, TOTP &amp; Passkeys</span>
            </div>
          </div>
        </div>

        <!-- Live Console Preview Window -->
        <div class="showcase-window">
          <div class="sw-topbar">
            <div class="sw-dots">
              <span />
              <span />
              <span />
            </div>
            <div class="sw-server-title">
              <span class="sw-live-dot" />
              <span>survival-cluster-01</span>
              <small>minecraft-java · LocalNode</small>
            </div>
            <div class="sw-controls">
              <span class="sw-pill start">Start</span>
              <span class="sw-pill neutral">Restart</span>
              <span class="sw-pill stop">Stop</span>
            </div>
          </div>

          <div class="sw-body">
            <div class="sw-sidebar">
              <span class="sw-nav-hd">SERVER</span>
              <span class="sw-nav-it active">Console</span>
              <span class="sw-nav-it">Files</span>
              <span class="sw-nav-it">Statistics</span>
              <span class="sw-nav-it">Backups</span>
              <span class="sw-nav-it">Settings</span>
            </div>

            <div class="sw-content">
              <div class="sw-stats">
                <div class="sw-stat">
                  <span class="k">ADDRESS</span>
                  <span class="v">185.240.242.168:25565</span>
                </div>
                <div class="sw-stat">
                  <span class="k">CPU LOAD</span>
                  <span class="v">6.40% <small>/ ∞</small></span>
                </div>
                <div class="sw-stat">
                  <span class="k">MEMORY</span>
                  <span class="v">3.42 GiB <small>/ 8 GiB</small></span>
                </div>
              </div>

              <div class="sw-terminal" dir="ltr">
                <div><span class="tag">{{ brandName }}</span> Server marked as running...</div>
                <div><span class="ts">[14:32:01 INFO]:</span> Starting Minecraft server on 0.0.0.0:25565</div>
                <div><span class="ts">[14:32:03 INFO]:</span> Preparing level "world" (100%)</div>
                <div><span class="ok">[14:32:04 INFO]:</span> Done (2.84s)! For help, type "help"</div>
              </div>

              <div class="sw-cmd" dir="ltr">
                <span class="p">&raquo;</span>
                <span>say Server maintenance complete — welcome back!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="showcase-capabilities-bar">
        <span>Docker &amp; Host Isolation</span>
        <span class="dot">&bull;</span>
        <span>Ready-to-Run Templates</span>
        <span class="dot">&bull;</span>
        <span>REST &amp; OAuth2 API</span>
      </div>
    </aside>

    <!-- Full-Bleed Right Auth Workspace -->
    <section class="studio-auth-panel">
      <!-- Mobile Brand Header -->
      <div class="mobile-auth-brand">
        <img v-if="logoUrl" :src="logoUrl" :alt="brandName" class="showcase-custom-logo" />
        <template v-else>
          <span class="showcase-mark"><BrandIcon :size="20" /></span>
          <span class="showcase-brand-name">{{ brandName }}</span>
        </template>
      </div>

      <div class="auth-workspace">
        <!-- Prominent Full-Width Mode Navigation (Masuk / Daftar) -->
        <nav v-if="registrationEnabled && mode !== 'invite'" class="auth-mode-switch" aria-label="Authentication mode">
          <router-link :to="{ name: 'Login' }" :class="['auth-mode-item', mode === 'login' ? 'active' : '']">
            <icon name="lock" />
            <span>{{ t('users.Login') }}</span>
          </router-link>
          <router-link :to="{ name: 'Register' }" :class="['auth-mode-item', mode === 'register' ? 'active' : '']">
            <icon name="account" />
            <span>{{ t('users.Register') }}</span>
          </router-link>
        </nav>

        <header class="auth-workspace-header">
          <h1 v-text="title" />
          <p v-if="subtitle" class="auth-workspace-subtitle" v-text="subtitle" />
        </header>

        <div class="auth-workspace-body">
          <slot />
        </div>
      </div>

      <footer class="auth-security-note">
        <icon name="shield" />
        <span>
          Protected session &middot;
          <a href="https://alfareza.site" target="_blank" rel="noopener noreferrer" class="auth-author-link">By Alfareza</a>
        </span>
      </footer>
    </section>
  </div>
</template>
