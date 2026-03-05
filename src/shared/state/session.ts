export type UserRole = 'employee' | 'manager' | 'admin'

const KEY_ROLE = 'on_learning_user_role_v1'

export function getUserRole(): UserRole {
  const raw = localStorage.getItem(KEY_ROLE)
  if (raw === 'manager' || raw === 'admin' || raw === 'employee') return raw
  return 'employee'
}

export function setUserRole(role: UserRole) {
  localStorage.setItem(KEY_ROLE, role)
}
