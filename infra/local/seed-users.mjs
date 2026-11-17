// Seeds LOCAL TEST users into the Firebase Auth emulator (never a real project).
// Run with the emulator up: `pnpm seed`. Idempotent — existing users are skipped.
//
// Test credentials (emulator only):
//   alice@example.test / spatial-canvas-dev
//   bob@example.test   / spatial-canvas-dev

const host = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'
const apiKey = process.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key'
const PASSWORD = 'spatial-canvas-dev'

const users = [
  { email: 'alice@example.test', displayName: 'Alice' },
  { email: 'bob@example.test', displayName: 'Bob' },
]

const base = `http://${host}/identitytoolkit.googleapis.com/v1`

for (const user of users) {
  const res = await fetch(`${base}/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...user, password: PASSWORD, returnSecureToken: false }),
  }).catch((err) => {
    console.error(`Cannot reach the Auth emulator at ${host} — is \`pnpm dev\` running?`)
    console.error(err.message)
    process.exit(1)
  })

  const body = await res.json()
  if (res.ok) {
    console.log(`created  ${user.email}  uid=${body.localId}`)
  } else if (body?.error?.message === 'EMAIL_EXISTS') {
    console.log(`exists   ${user.email}`)
  } else {
    console.error(`failed   ${user.email}:`, body?.error?.message ?? res.status)
    process.exitCode = 1
  }
}
