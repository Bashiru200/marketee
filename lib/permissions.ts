// lib/permissions.ts
// All available admin permissions

export const ADMIN_PERMISSIONS = [
  'manage_businesses',
  'manage_users',
  'moderate_reviews',
  'view_analytics',
  'view_revenue',
  'view_audit_log',
] as const

export type AdminPermission = typeof ADMIN_PERMISSIONS[number]

export const PERMISSION_LABELS: Record<AdminPermission, { label: string; desc: string; icon: string }> = {
  manage_businesses: {
    label: 'Manage businesses',
    desc:  'Verify, feature, set plans, and delete business listings',
    icon:  '🏪',
  },
  manage_users: {
    label: 'Manage users',
    desc:  'View, ban, and reset passwords for user accounts',
    icon:  '👤',
  },
  moderate_reviews: {
    label: 'Moderate reviews',
    desc:  'Flag and delete reviews across the platform',
    icon:  '⭐',
  },
  view_analytics: {
    label: 'View analytics',
    desc:  'Access platform growth and performance data',
    icon:  '📊',
  },
  view_revenue: {
    label: 'View revenue',
    desc:  'See MRR, ARR, and subscriber details',
    icon:  '💰',
  },
  view_audit_log: {
    label: 'View audit log',
    desc:  'Read the full history of admin actions',
    icon:  '📋',
  },
}