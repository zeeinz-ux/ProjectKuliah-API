const PERMISSIONS = {
  admin: {
    users: ['read', 'write', 'delete'],
    projects: ['read', 'write', 'delete'],
    materials: ['read', 'write', 'delete'],
    clients: ['read', 'write', 'delete'],
    'calendar-events': ['read', 'write', 'delete'],
    files: ['read', 'write', 'delete'],
    reports: ['read', 'write', 'delete'],
    'activity-logs': ['read', 'write', 'delete'],
  },
  project_manager: {
    projects: ['read', 'write'],
    materials: ['read', 'write', 'delete'],
    clients: ['read', 'write'],
    'calendar-events': ['read', 'write', 'delete'],
    files: ['read', 'write', 'delete'],
    reports: ['read'],
    'activity-logs': ['read', 'write'],
  },
  finance: {
    projects: ['read'],
    materials: ['read'],
    clients: ['read'],
    'calendar-events': ['read'],
    files: ['read', 'write', 'delete'],
    reports: ['read', 'write'],
    'activity-logs': ['read', 'write', 'delete'],
  },
}

export const MENU_ACCESS = {
  admin: {
    '/admin': { resource: 'projects', action: 'read' },
    '/admin/projects': { resource: 'projects', action: 'read' },
    '/admin/materials': { resource: 'materials', action: 'read' },
    '/admin/calendar': { resource: 'calendar-events', action: 'read' },
    '/admin/clients': { resource: 'clients', action: 'read' },
    '/admin/documentation': { resource: 'files', action: 'read' },
    '/admin/laporan': { resource: 'reports', action: 'read' },
    '/admin/users': { resource: 'users', action: 'read' },
    '/admin/notifications': { resource: 'activity-logs', action: 'read' },
    '/admin/settings': { resource: 'activity-logs', action: 'read' },
  },
  project_manager: {
    '/admin': { resource: 'projects', action: 'read' },
    '/admin/projects': { resource: 'projects', action: 'read' },
    '/admin/materials': { resource: 'materials', action: 'read' },
    '/admin/calendar': { resource: 'calendar-events', action: 'read' },
    '/admin/clients': { resource: 'clients', action: 'read' },
    '/admin/documentation': { resource: 'files', action: 'read' },
    '/admin/laporan': { resource: 'reports', action: 'read' },
    '/admin/notifications': { resource: 'activity-logs', action: 'read' },
    '/admin/settings': { resource: 'activity-logs', action: 'read' },
  },
  finance: {
    '/admin': { resource: 'projects', action: 'read' },
    '/admin/projects': { resource: 'projects', action: 'read' },
    '/admin/materials': { resource: 'materials', action: 'read' },
    '/admin/calendar': { resource: 'calendar-events', action: 'read' },
    '/admin/clients': { resource: 'clients', action: 'read' },
    '/admin/documentation': { resource: 'files', action: 'read' },
    '/admin/laporan': { resource: 'reports', action: 'read' },
    '/admin/notifications': { resource: 'activity-logs', action: 'read' },
    '/admin/settings': { resource: 'activity-logs', action: 'read' },
  },
}

export function can(role, action, resource) {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return false

  const resourcePerms = rolePerms[resource]
  if (!resourcePerms) return false

  return resourcePerms.includes(action)
}

export function getAccessibleMenuPaths(role) {
  const menuAccess = MENU_ACCESS[role]
  if (!menuAccess) return []

  return Object.entries(menuAccess)
    .filter(([, { resource, action }]) => can(role, action, resource))
    .map(([path]) => path)
}
