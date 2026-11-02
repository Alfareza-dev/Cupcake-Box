import { reactive } from 'vue'

export const serverNav = reactive({
  server: null,
  tabs: [],
  activeTab: '',
  selectTab: null
})

export function setServerNav({ server, tabs, activeTab, selectTab }) {
  serverNav.server = server
  serverNav.tabs = tabs || []
  serverNav.activeTab = activeTab || ''
  serverNav.selectTab = selectTab || null
}

export function clearServerNav() {
  serverNav.server = null
  serverNav.tabs = []
  serverNav.activeTab = ''
  serverNav.selectTab = null
}

