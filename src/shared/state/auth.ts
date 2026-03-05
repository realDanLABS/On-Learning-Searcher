const KEY_AUTHENTICATED = 'on_learning_authenticated_v1'

export function isAuthenticated() {
  return localStorage.getItem(KEY_AUTHENTICATED) === '1'
}

export function setAuthenticated(authenticated: boolean) {
  if (authenticated) localStorage.setItem(KEY_AUTHENTICATED, '1')
  else localStorage.removeItem(KEY_AUTHENTICATED)
}

export function clearAuthentication() {
  localStorage.removeItem(KEY_AUTHENTICATED)
}

