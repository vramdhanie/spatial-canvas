import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-spatial-canvas'

export const firebaseApp = initializeApp({
  projectId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: `${projectId}.firebaseapp.com`,
})

export const auth = getAuth(firebaseApp)

// Local prototype: always use the Auth emulator, reached through this origin's
// proxy so it works identically on localhost and via ngrok (PrototypePlan §3).
connectAuthEmulator(auth, window.location.origin, { disableWarnings: true })
