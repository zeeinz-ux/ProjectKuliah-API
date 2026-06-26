import { useAuth } from './useAuth'

export function usePermission() {
  const { hasPermission } = useAuth()

  function can(action, resource) {
    return hasPermission(action, resource)
  }

  return { can }
}
