<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart, { _adapters, Tooltip } from 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import Query from './Query.vue'

const fromCss = (el, prop) => {
  return getComputedStyle(el).getPropertyValue(prop).trim()
}

const defaultFamily = "'Inter', 'Quicksand', 'Helvetica Neue', sans-serif"

const props = defineProps({
  server: { type: Object, required: true },
  compact: { type: Boolean, default: () => false }
})

const { t, locale } = useI18n()

const numFormat = new Intl.NumberFormat(
  [locale.value.replace('_', '-'), 'en'],
  { maximumFractionDigits: 2 }
)

const formatCpu = (value) => {
  return numFormat.format(value || 0) + ' %'
}

const formatMemory = (value) => {
  if (!value) return numFormat.format(0) + ' B'
  if (value < Math.pow(2, 10)) return numFormat.format(value) + ' B'
  if (value < Math.pow(2, 20)) return numFormat.format(value / Math.pow(2, 10)) + ' KiB'
  if (value < Math.pow(2, 30)) return numFormat.format(value / Math.pow(2, 20)) + ' MiB'
  if (value < Math.pow(2, 40)) return numFormat.format(value / Math.pow(2, 30)) + ' GiB'
  return numFormat.format(value / Math.pow(2, 40)) + ' TiB'
}

const intl = new Intl.DateTimeFormat(
  [locale.value.replace('_', '-'), 'en'],
  { hour: 'numeric', minute: 'numeric', second: 'numeric' }
)
_adapters._date.prototype.format = (time) => {
  return intl.format(time)
}

Tooltip.positioners.cursor = (_, eventPosition) => {
  return { x: eventPosition.x, y: eventPosition.y }
}

const cpuChartEl = ref(null)
const memoryChartEl = ref(null)
const latestCpu = ref('0 %')
const latestMemory = ref('0 B')

let cpuChart = null
let memoryChart = null
const cpu = []
const memory = []
const jvmHeapUsed = []
const jvmHeapAlloc = []
const jvmMetaUsed = []
const jvmMetaAlloc = []

function addData(d) {
  if (!d || !cpuChart || !memoryChart) return
  const x = new Date().getTime()

  latestCpu.value = formatCpu(d.cpu || 0)
  latestMemory.value = formatMemory(d.memory || 0)

  cpu.push({ x, y: d.cpu || 0 })
  memory.push({ x, y: d.memory || 0 })

  if (d.jvm) {
    jvmHeapUsed.push({ x, y: d.jvm.heapUsed })
    jvmHeapAlloc.push({ x, y: d.jvm.heapTotal - d.jvm.heapUsed })
    jvmMetaUsed.push({ x, y: d.jvm.metaspaceUsed })
    jvmMetaAlloc.push({ x, y: d.jvm.metaspaceTotal - d.jvm.metaspaceUsed })

    memoryChart.show(memoryChart.data.datasets.findIndex(set => set.label === t('servers.JvmMetaUsed')))
    memoryChart.show(memoryChart.data.datasets.findIndex(set => set.label === t('servers.JvmMetaAlloc')))
    memoryChart.show(memoryChart.data.datasets.findIndex(set => set.label === t('servers.JvmHeapUsed')))
    memoryChart.show(memoryChart.data.datasets.findIndex(set => set.label === t('servers.JvmHeapAlloc')))
    memoryChart.hide(memoryChart.data.datasets.findIndex(set => set.label === t('servers.Memory')))
  }

  for (const graph of [cpu, memory, jvmHeapUsed, jvmHeapAlloc, jvmMetaUsed, jvmMetaAlloc]) {
    while (graph.length > 60) {
      graph.shift()
    }
  }

  for (const chart of [cpuChart, memoryChart]) {
    chart.options.scales.x.min = x - (60 * 1000)
    chart.update()
  }
}

const chartOptions = (mode) => {
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: (ctx) => {
      if (ctx.chart.canvas) {
        return parseFloat(fromCss(ctx.chart.canvas.parentElement, 'aspect-ratio')) || (props.compact ? 3.2 : 2.8)
      }
      return props.compact ? 3.2 : 2.8
    },
    parsing: false,
    locale: locale.value.split('_')[0] || 'en',
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animations: {
      y: {
        duration: 0
      }
    },
    plugins: {
      tooltip: {
        position: 'cursor',
        usePointStyle: true,
        callbacks: {
          label: (ctx) => {
            return ' ' + ctx.dataset.label + ': ' + ctx.chart.scales[ctx.dataset.yAxisID].options.ticks.callback(ctx.parsed.y)
          },
          labelPointStyle: () => 'circle'
        },
        itemSort: (a, b) => {
          return a.datasetIndex < b.datasetIndex
        },
        multiKeyBackground: (ctx) => fromCss(ctx.chart.canvas, 'background-color') || '#1b1b1e',
        padding: (ctx) => parseInt(fromCss(ctx.chart.canvas, '--chartjs-tooltip-padding')) || 8,
        backgroundColor: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-tooltip-background-color') || 'rgba(20, 20, 23, 0.92)',
        cornerRadius: (ctx) => parseInt(fromCss(ctx.chart.canvas, '--chartjs-tooltip-corner-radius')) || 8,
        borderColor: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-tooltip-border-color') || 'rgba(255, 255, 255, 0.08)',
        borderWidth: (ctx) => parseInt(fromCss(ctx.chart.canvas, '--chartjs-tooltip-border-width')) || 1,
        titleAlign: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-tooltip-title-align') || 'left',
        titleColor: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-tooltip-font-color') || '#e6e6e8',
        bodyColor: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-tooltip-font-color') || '#e6e6e8',
        bodySpacing: (ctx) => parseInt(fromCss(ctx.chart.canvas, '--chartjs-tooltip-body-spacing')) || 4,
        titleFont: {
          family: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-font-family') || defaultFamily,
          size: 12,
          weight: '600'
        },
        bodyFont: {
          family: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-font-family') || defaultFamily,
          size: 12,
          weight: '400'
        }
      },
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        type: 'timeseries',
        min: new Date().getTime() - (60 * 1000),
        grid: {
          color: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-grid-color') || 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          maxTicksLimit: 5,
          source: 'data',
          color: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-axis-font-color') || 'rgba(220, 220, 226, 0.45)',
          font: {
            family: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-font-family') || defaultFamily,
            size: 11
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.35,
        borderWidth: 2,
        fill: true
      },
      point: {
        pointStyle: false,
        hoverRadius: 16
      }
    }
  }

  if (mode === 'memory') {
    options.scales.memory = {
      type: 'linear',
      position: 'right',
      min: 0,
      suggestedMax: 1024 * 1024,
      grid: {
        display: true,
        color: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-grid-color') || 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        maxTicksLimit: 4,
        callback: formatMemory,
        color: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-axis-font-color') || 'rgba(220, 220, 226, 0.45)',
        font: {
          family: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-font-family') || defaultFamily,
          size: 11
        }
      }
    }
  }

  if (mode === 'cpu') {
    options.scales.cpu = {
      type: 'linear',
      position: 'right',
      min: 0,
      suggestedMax: 100,
      grid: {
        color: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-grid-color') || 'rgba(255, 255, 255, 0.05)'
      },
      ticks: {
        maxTicksLimit: 4,
        callback: formatCpu,
        color: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-axis-font-color') || 'rgba(220, 220, 226, 0.45)',
        font: {
          family: (ctx) => fromCss(ctx.chart.canvas, '--chartjs-font-family') || defaultFamily,
          size: 11
        }
      }
    }
  }

  return options
}

let task = null
let stopListener = null
onMounted(async () => {
  cpuChart = new Chart(cpuChartEl.value, {
    type: 'line',
    options: chartOptions('cpu'),
    data: {
      datasets: [
        {
          label: t('servers.CPU'),
          yAxisID: 'cpu',
          fill: 'origin',
          borderColor: fromCss(cpuChartEl.value, '--chartjs-series-line-cpu') || '#589284',
          backgroundColor: fromCss(cpuChartEl.value, '--chartjs-series-fill-cpu') || 'rgba(88, 146, 132, 0.16)',
          data: cpu
        }
      ]
    }
  })

  memoryChart = new Chart(memoryChartEl.value, {
    type: 'line',
    options: chartOptions('memory'),
    data: {
      datasets: [
        {
          label: t('servers.JvmMetaUsed'),
          yAxisID: 'memory',
          fill: 'origin',
          borderColor: fromCss(memoryChartEl.value, '--chartjs-series-line-jvm-metaspace-used'),
          backgroundColor: fromCss(memoryChartEl.value, '--chartjs-series-fill-jvm-metaspace-used'),
          stack: 'jvmMemory',
          hidden: true,
          data: jvmMetaUsed
        },
        {
          label: t('servers.JvmMetaAlloc'),
          yAxisID: 'memory',
          fill: '-1',
          borderColor: fromCss(memoryChartEl.value, '--chartjs-series-line-jvm-metaspace-allocated'),
          backgroundColor: fromCss(memoryChartEl.value, '--chartjs-series-fill-jvm-metaspace-allocated'),
          stack: 'jvmMemory',
          hidden: true,
          data: jvmMetaAlloc
        },
        {
          label: t('servers.JvmHeapUsed'),
          yAxisID: 'memory',
          fill: '-1',
          borderColor: fromCss(memoryChartEl.value, '--chartjs-series-line-jvm-heapspace-used'),
          backgroundColor: fromCss(memoryChartEl.value, '--chartjs-series-fill-jvm-heapspace-used'),
          stack: 'jvmMemory',
          hidden: true,
          data: jvmHeapUsed
        },
        {
          label: t('servers.JvmHeapAlloc'),
          yAxisID: 'memory',
          fill: '-1',
          borderColor: fromCss(memoryChartEl.value, '--chartjs-series-line-jvm-heapspace-allocated'),
          backgroundColor: fromCss(memoryChartEl.value, '--chartjs-series-fill-jvm-heapspace-allocated'),
          stack: 'jvmMemory',
          hidden: true,
          data: jvmHeapAlloc
        },
        {
          label: t('servers.Memory'),
          yAxisID: 'memory',
          fill: 'origin',
          borderColor: fromCss(memoryChartEl.value, '--chartjs-series-line-memory') || '#5b82a6',
          backgroundColor: fromCss(memoryChartEl.value, '--chartjs-series-fill-memory') || 'rgba(91, 130, 166, 0.16)',
          data: memory
        }
      ]
    }
  })

  stopListener = props.server.on('stat', addData)

  if (props.server.hasScope('server.stats')) {
    try {
      addData(await props.server.getStats())
    } catch {
      // ignore if offline
    }
  }

  task = props.server.startTask(async () => {
    if (props.server.needsPolling() && props.server.hasScope('server.stats')) {
      try {
        addData(await props.server.getStats())
      } catch {
        // ignore
      }
    }
  }, 5000)
})

onUnmounted(() => {
  if (cpuChart) cpuChart.destroy()
  if (memoryChart) memoryChart.destroy()
  if (task) props.server.stopTask(task)
  if (stopListener) stopListener()
})
</script>

<template>
  <div :class="['server-stats-panel', compact ? 'is-compact' : 'is-full']">
    <Query v-if="!compact" :server="server" />
    <div class="stats-charts-grid">
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-card-title">{{ t('servers.CPU') }} Load</span>
          <span class="chart-card-metric">{{ latestCpu }}</span>
        </div>
        <div class="chart cpu">
          <canvas ref="cpuChartEl" />
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-card-title">{{ t('servers.Memory') }}</span>
          <span class="chart-card-metric">{{ latestMemory }}</span>
        </div>
        <div class="chart memory">
          <canvas ref="memoryChartEl" />
        </div>
      </div>
    </div>
  </div>
</template>
