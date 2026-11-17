// Starts the Firebase Auth emulator with persistent state.
// State is imported from ./.emulator-data when present and exported back on exit,
// so seeded users (and their UIDs) survive restarts.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '.emulator-data')
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'demo-spatial-canvas'

const args = [
  'emulators:start',
  '--only',
  'auth',
  '--project',
  projectId,
  '--export-on-exit',
  dataDir,
]
if (existsSync(join(dataDir, 'firebase-export-metadata.json'))) {
  args.push('--import', dataDir)
}

const child = spawn('firebase', args, { cwd: here, stdio: 'inherit' })

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}
child.on('exit', (code) => process.exit(code ?? 0))
