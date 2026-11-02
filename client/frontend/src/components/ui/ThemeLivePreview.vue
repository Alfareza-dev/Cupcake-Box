<script setup>
import { computed, inject } from 'vue'
import BrandIcon from './BrandIcon.vue'
import { STUDIO_BASE_TONES, calculateAccentSteps, normalizeHex } from '@/utils/theme'

const props = defineProps({
  settings: { type: Object, default: () => ({}) },
  brandTitle: { type: String, default: '' }
})

const config = inject('config')

const toneMeta = computed(() => {
  const toneVal = props.settings?.baseTone?.current || 'tone-graphite'
  if (toneVal === 'tone-slate') {
    return {
      backdrop: '#13161c',
      sidebar: '#171b22',
      surface: '#1d222b',
      elevated: '#252b36',
      code: '#0e1116',
      border: 'rgba(205, 218, 240, 0.08)'
    }
  }
  if (toneVal === 'tone-midnight') {
    return {
      backdrop: '#0c0e14',
      sidebar: '#10121a',
      surface: '#151822',
      elevated: '#1d212e',
      code: '#080a0f',
      border: 'rgba(195, 205, 235, 0.08)'
    }
  }
  const def = STUDIO_BASE_TONES[0]
  return {
    backdrop: '#141416',
    sidebar: '#18181b',
    surface: def.surface || '#202024',
    elevated: '#28282d',
    code: '#0e0e10',
    border: 'rgba(255, 255, 255, 0.07)'
  }
})

const accentHex = computed(() => normalizeHex(props.settings?.accentColor?.current || '#589284'))
const steps = computed(() => calculateAccentSteps(accentHex.value))

const logoUrl = computed(() => {
  const raw = props.settings?.logoUrl?.current
  return typeof raw === 'string' ? raw.trim() : ''
})

const displayBrand = computed(() => {
  return props.brandTitle || config?.branding?.name || 'Cupcake Box'
})

const previewStyle = computed(() => ({
  '--pv-backdrop': toneMeta.value.backdrop,
  '--pv-sidebar': toneMeta.value.sidebar,
  '--pv-surface': toneMeta.value.surface,
  '--pv-elevated': toneMeta.value.elevated,
  '--pv-code': toneMeta.value.code,
  '--pv-border': toneMeta.value.border,
  '--pv-accent': steps.value.base,
  '--pv-accent-light': steps.value.light,
  '--pv-accent-subtle': steps.value.subtle,
  '--pv-accent-text': steps.value.textOnAccent
}))
</script>

<template>
  <div class="studio-preview-card">
    <div class="studio-card-header">Preview</div>
    <div class="studio-preview-body">
      <div class="studio-mini-window" :style="previewStyle">
        <div class="mini-topbar">
          <img v-if="logoUrl" :src="logoUrl" alt="Logo preview" class="mini-logo" />
          <span v-else class="mini-brand">
            <BrandIcon :size="15" />
            <span>{{ displayBrand }}</span>
          </span>
        </div>
        <div class="mini-workspace">
          <div class="mini-sidebar">
            <div class="mini-nav-heading">SERVER</div>
            <div class="mini-nav-item active">Console</div>
            <div class="mini-nav-item">Files</div>
            <div class="mini-nav-item">Backups</div>
            <div class="mini-nav-item">Settings</div>
          </div>
          <div class="mini-main">
            <div class="mini-stats-row">
              <div class="mini-stat">
                <span class="k">Address</span>
                <span class="v">play.example.com</span>
              </div>
              <div class="mini-stat">
                <span class="k">Uptime</span>
                <span class="v">3h 12m</span>
              </div>
              <div class="mini-stat">
                <span class="k">CPU</span>
                <span class="v">4.2 %</span>
              </div>
              <div class="mini-stat">
                <span class="k">Memory</span>
                <span class="v">2.1 GiB</span>
              </div>
            </div>
            <div class="mini-console">
              [Server] Done (3.2s)! For help, type "help"
            </div>
            <div class="mini-actions">
              <span class="mini-btn">Restart</span>
            </div>
          </div>
        </div>
      </div>
      <p class="studio-preview-caption">
        Live preview of your selected base tone, calculated accent steps, and branding.
      </p>
    </div>
  </div>
</template>

