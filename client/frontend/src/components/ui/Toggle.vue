<script setup>
import markdown from '@/utils/markdown.js'

const props = defineProps({
  label: { type: String, default: () => undefined },
  hint: { type: String, default: () => undefined },
  disabled: { type: Boolean, default: () => false },
  modelValue: { type: Boolean, required: true }
})

const emit = defineEmits(['update:modelValue'])

function onInput() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label :class="['switch-wrapper', (!label && !hint) ? 'switch-compact' : '']">
    <input type="checkbox" :disabled="disabled" :checked="modelValue" @input="onInput" />
    <span :class="['switch', disabled ? 'disabled' : '']" />
    <span v-if="label || hint" class="switch-body">
      <span v-if="label" class="label" v-text="label" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-if="hint" class="hint" v-html="markdown(hint)" />
    </span>
  </label>
</template>
