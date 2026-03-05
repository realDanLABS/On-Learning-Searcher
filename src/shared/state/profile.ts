export type UserProfile = {
  employeeId: string
  name: string
  organization: string
}

const KEY_PROFILE = 'on_learning_user_profile_v1'

export function getUserProfile(): UserProfile | null {
  const raw = localStorage.getItem(KEY_PROFILE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as UserProfile
    if (!parsed.employeeId || !parsed.name || !parsed.organization) return null
    return parsed
  } catch {
    return null
  }
}

export function saveUserProfile(profile: UserProfile) {
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile))
}

export function hasUserProfile() {
  return Boolean(getUserProfile())
}

export function clearUserProfile() {
  localStorage.removeItem(KEY_PROFILE)
}

