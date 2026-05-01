import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'

const mode = process.argv[2]
const extraArgs = process.argv.slice(3)

if (!mode || !['dev', 'build', 'start'].includes(mode)) {
  console.error('Usage: node scripts/next-safe-runner.mjs <dev|build|start>')
  process.exit(1)
}

const cwd = process.cwd()
const nextBin = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next')
const distDir =
  mode === 'dev'
    ? '.next-dev'
    : process.env.VERCEL === '1'
      ? '.next'
      : '.next-build'

if (!existsSync(nextBin)) {
  console.error(`Next.js binary not found: ${nextBin}`)
  process.exit(1)
}

if (mode === 'dev' || mode === 'build') {
  const distPath = path.join(cwd, distDir)
  if (existsSync(distPath)) {
    await rm(distPath, { recursive: true, force: true })
  }
}

const requestedPort =
  process.env.PORT ||
  process.env.npm_config_port ||
  (() => {
    const portIndex = extraArgs.findIndex((arg) => arg === '--port')
    return portIndex >= 0 ? extraArgs[portIndex + 1] : undefined
  })() ||
  '3000'

const requestedHost =
  process.env.HOST ||
  process.env.npm_config_hostname ||
  (() => {
    const hostIndex = extraArgs.findIndex((arg) => arg === '--hostname')
    return hostIndex >= 0 ? extraArgs[hostIndex + 1] : undefined
  })() ||
  '127.0.0.1'

const args =
  mode === 'dev'
    ? [nextBin, 'dev', '--hostname', requestedHost, '--port', requestedPort]
    : mode === 'start'
      ? [nextBin, 'start', '--hostname', requestedHost, '--port', requestedPort]
      : [nextBin, 'build']

const child = spawn(process.execPath, args, {
  cwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir,
  },
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
