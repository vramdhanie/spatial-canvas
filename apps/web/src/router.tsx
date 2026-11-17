import { Link, Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { CanvasPage } from './routes/canvas.tsx'
import { HomePage } from './routes/home.tsx'
import { SignInPage } from './routes/sign-in.tsx'

const rootRoute = createRootRoute({
  component: () => (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-2 text-sm">
        <Link to="/" className="font-semibold">
          Spatial Canvas
        </Link>
        <nav className="flex gap-3 text-muted">
          <Link to="/" className="[&.active]:text-foreground">
            Canvases
          </Link>
          <Link to="/sign-in" className="[&.active]:text-foreground">
            Sign in
          </Link>
        </nav>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  ),
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sign-in',
  component: SignInPage,
})

const canvasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/c/$canvasId',
  component: CanvasPage,
})

const routeTree = rootRoute.addChildren([homeRoute, signInRoute, canvasRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
