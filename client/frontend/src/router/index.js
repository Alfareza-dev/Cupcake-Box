import { createRouter, createWebHistory } from 'vue-router'
import makeRoutes from './routes'
import defaultRoute from './defaultRoute'
import { DEFAULT_BRAND_NAME, normalizeBrandName } from '@/plugins/config'

const ROUTE_TITLES = {
  Login: 'Login',
  Register: 'Register',
  Invite: 'Account Invite',
  ServerList: 'Servers',
  ServerCreate: 'Create Server',
  ServerView: 'Server',
  NodeList: 'Nodes',
  NodeCreate: 'Create Node',
  NodeView: 'Node',
  UserList: 'Users',
  UserCreate: 'Create User',
  UserView: 'User',
  TemplateList: 'Templates',
  TemplateCreate: 'Create Template',
  TemplateView: 'Template',
  Settings: 'Settings',
  Self: 'Account & Theme'
}

export default function(api, config) {
  const router = createRouter({
    history: createWebHistory(),
    linkExactActiveClass: 'active',
    routes: makeRoutes(api),
    scrollBehavior (to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      }
      if (to.hash) {
        return { selector: to.hash }
      }
      return { left: 0, top: 0 }
    }
  })

  router.beforeEach((to) => {
    if (to.meta.noAuth && api.auth.isLoggedIn()) {
        return defaultRoute(api)
    }

    if (!to.meta.noAuth && !api.auth.isLoggedIn()) {
      sessionStorage.setItem('returnTo', JSON.stringify({
        name: to.name,
        params: to.params,
        hash: to.hash,
        query: to.query
      }))
      return { name: 'Login' }
    }

    return true
  })

  router.afterEach((to) => {
    const brand = normalizeBrandName(config?.branding?.name || DEFAULT_BRAND_NAME)
    const section = ROUTE_TITLES[to.name]
    document.title = section ? `${section} · ${brand}` : brand
  })

  return router
}
