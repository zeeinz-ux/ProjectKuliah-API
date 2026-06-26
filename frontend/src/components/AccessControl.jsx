import { useAuth } from '../hooks/useAuth'

export default function AccessControl({ action, resource, children, fallback = null }) {
  const { hasPermission } = useAuth()

  if (hasPermission(action, resource)) {
    return children
  }

  return fallback
}
