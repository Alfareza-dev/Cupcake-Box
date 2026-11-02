<script setup>
defineProps({
  size: { type: [Number, String], default: 22 }
})
</script>

<template>
  <svg
    class="cupcake-brand-svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Subtle Box Corner Frame -->
    <path
      d="M3.5 7.5V5.5C3.5 4.395 4.395 3.5 5.5 3.5H7.5M16.5 3.5H18.5C19.605 3.5 20.5 4.395 20.5 5.5V7.5M20.5 16.5V18.5C20.5 19.605 19.605 20.5 18.5 20.5H16.5M7.5 20.5H5.5C4.395 20.5 3.5 19.605 3.5 18.5V16.5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-opacity="0.55"
    />
    <!-- Cherry Top -->
    <circle cx="12" cy="5.6" r="1.35" fill="currentColor" />
    <!-- Frosting Swirl -->
    <path
      d="M7.2 12C6.25 12 5.5 11.28 5.5 10.35C5.5 9.48 6.18 8.78 7.05 8.75C7.35 7.38 8.6 6.45 10.05 6.65C10.62 6.2 11.28 6 12 6C12.72 6 13.38 6.2 13.95 6.65C15.4 6.45 16.65 7.38 16.95 8.75C17.82 8.78 18.5 9.48 18.5 10.35C18.5 11.28 17.75 12 16.8 12H7.2Z"
      stroke="#f3f5f7"
      stroke-width="1.55"
      stroke-linejoin="round"
    />
    <!-- Cupcake Base -->
    <path
      d="M7.4 13.4H16.6L15.45 18.1C15.28 18.78 14.67 19.25 13.97 19.25H10.03C9.33 19.25 8.72 18.78 8.55 18.1L7.4 13.4Z"
      fill="currentColor"
      fill-opacity="0.28"
      stroke="currentColor"
      stroke-width="1.55"
      stroke-linejoin="round"
    />
    <!-- Pleats -->
    <path
      d="M10.4 15.1L10.75 17.7M12 15.1V17.7M13.6 15.1L13.25 17.7"
      stroke="currentColor"
      stroke-width="1.25"
      stroke-linecap="round"
    />
  </svg>
</template>

