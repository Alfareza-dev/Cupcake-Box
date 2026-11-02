<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Dropdown from './Dropdown.vue'
import { STUDIO_ACCENT_PRESETS, STUDIO_BASE_TONES, calculateAccentSteps, normalizeHex } from '@/utils/theme'

const props = defineProps({
  modelValue: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])

const { t, locale, fallbackLocale } = useI18n()

function onInput(val) {
  emit('update:modelValue', { ...props.modelValue, current: val })
}

function onNativeColorInput(event) {
  onInput(event.target.value)
}

function onHexTextInput(event) {
  const raw = event.target.value.trim()
  if (/^#?[0-9a-fA-F]{6}$/.test(raw)) {
    onInput(raw.startsWith('#') ? raw.toLowerCase() : `#${raw.toLowerCase()}`)
  }
}

function getSettingLabel(setting) {
  const fallback = setting.label || undefined
  if (setting.tkey) {
    return t(setting.tkey, fallback)
  } else if (setting.tlabels) {
    return setting.tlabels[locale.value] || setting.tlabels[fallbackLocale.value] || fallback
  } else {
    return fallback
  }
}

function withNormalizedLabels(options) {
  return options.map(option => {
    return { ...option, label: getSettingLabel(option) }
  })
}

const presets = computed(() => {
  if (Array.isArray(props.modelValue.presets) && props.modelValue.presets.length > 0) {
    return props.modelValue.presets
  }
  return STUDIO_ACCENT_PRESETS
})

const toneOptions = computed(() => {
  const opts = withNormalizedLabels(props.modelValue.options || [])
  return opts.map(opt => {
    const meta = STUDIO_BASE_TONES.find(b => b.value === opt.value)
    return {
      ...opt,
      swatch: opt.swatch || meta?.swatch || '#1c1c1f',
      surface: meta?.surface || '#242428'
    }
  })
})

const normalizedCurrentHex = computed(() => normalizeHex(props.modelValue.current || '#589284'))
const calculatedSteps = computed(() => calculateAccentSteps(normalizedCurrentHex.value))
</script>

<template>
  <div class="theme-setting-wrapper">
    <!-- Studio Base Tone Selector -->
    <div v-if="modelValue.type === 'class' && modelValue.ui === 'tone-cards'" class="studio-field-group">
      <div class="studio-field-label" v-text="getSettingLabel(modelValue)" />
      <div class="studio-tone-grid">
        <button
          v-for="opt in toneOptions"
          :key="opt.value"
          type="button"
          :class="['studio-tone-btn', modelValue.current === opt.value ? 'active' : '']"
          :style="{ '--tone-bg': opt.swatch, '--tone-surface': opt.surface }"
          @click="onInput(opt.value)"
        >
          <span class="tone-name">{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <!-- Standard Class / Snippet Dropdown -->
    <dropdown
      v-else-if="modelValue.type === 'class' || modelValue.type === 'snippet'"
      :model-value="modelValue.current"
      :options="withNormalizedLabels(modelValue.options)"
      :label="getSettingLabel(modelValue)"
      @update:modelValue="onInput($event)"
    />

    <!-- Studio Accent Colour Picker + 6 Muted Presets + Calculated Steps -->
    <div v-else-if="modelValue.type === 'color'" class="studio-field-group">
      <div class="studio-field-label" v-text="getSettingLabel(modelValue)" />
      <div class="studio-hex-picker">
        <label class="color-swatch-trigger" :style="{ backgroundColor: normalizedCurrentHex }">
          <input type="color" :value="normalizedCurrentHex" @input="onNativeColorInput" />
        </label>
        <input
          type="text"
          class="hex-code-input"
          :value="normalizedCurrentHex"
          maxlength="7"
          spellcheck="false"
          @input="onHexTextInput"
        />
      </div>

      <div class="studio-preset-swatches">
        <button
          v-for="preset in presets"
          :key="preset.value"
          type="button"
          :class="['preset-swatch-btn', normalizedCurrentHex === preset.value.toLowerCase() ? 'active' : '']"
          :style="{ backgroundColor: preset.value }"
          :title="`${preset.name} (${preset.value})`"
          @click="onInput(preset.value)"
        />
      </div>

      <div class="studio-calculated-steps" title="Automatically calculated lighter and darker accent steps">
        <span class="step-chip" :style="{ backgroundColor: calculatedSteps.lighter }" title="Lighter" />
        <span class="step-chip" :style="{ backgroundColor: calculatedSteps.light }" title="Light" />
        <span class="step-chip base" :style="{ backgroundColor: calculatedSteps.base }" title="Base" />
        <span class="step-chip" :style="{ backgroundColor: calculatedSteps.dark }" title="Dark" />
        <span class="step-chip" :style="{ backgroundColor: calculatedSteps.darker }" title="Darker" />
        <span class="steps-caption">Calculated steps</span>
      </div>

      <p v-if="modelValue.hint" class="studio-field-hint" v-text="modelValue.hint" />
    </div>

    <!-- Studio Text Input (e.g. Optional Logo URL) -->
    <div v-else-if="modelValue.type === 'text'" class="studio-field-group">
      <div class="studio-field-label">
        <span v-text="getSettingLabel(modelValue)" />
        <span class="optional-tag">optional</span>
      </div>
      <input
        type="text"
        class="studio-text-input"
        :value="modelValue.current || ''"
        :placeholder="modelValue.placeholder || ''"
        @input="onInput($event.target.value)"
      />
      <p v-if="modelValue.hint" class="studio-field-hint" v-text="modelValue.hint" />
    </div>
  </div>
</template>
