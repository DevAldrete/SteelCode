/**
 * @file routes.tsx
 * Defines the client-side routes for the webview UI using TanStack Router.
 * This includes the root route, and specific routes for different views like Home and Analysis.
 */
import { RootRoute, Route, Router, Outlet } from '@tanstack/react-router';
import App, { AppRouterContext } from './App'; // App.tsx provides the main layout and router context
import HomeView from './components/HomeView';
import AnalysisView from './components/AnalysisView';
// TODO: Remove unused React import if not explicitly needed for JSX in this file after refactoring.
// import React from 'react';

// Define a type for the context that App.tsx will provide to its <Outlet />.
// This is imported from App.tsx to ensure consistency.
// Example:
// export interface AppContext {
//   lastGeneralMessage: WebviewMessage | null;
// }

/**
 * The root route of the application.
 * It uses the `App` component as its main layout. `App` will render an `<Outlet />`
 * where child routes will be displayed.
 * It also receives context from `App` (like `lastGeneralMessage`) which can be made available to child routes.
 */
const rootRoute = new RootRoute({
  component: App, // App component renders the main layout including navigation and an <Outlet />
  // The context provided by App's <Outlet context={...} /> will be available to child routes
  // via `Route.useContext()` or `router.getContext()`.
  // No explicit getContext needed here if App itself provides it directly to Outlet.
});

/**
 * The index route (path: '/') of the application.
 * It renders the `HomeView` component.
 * It accesses the `lastGeneralMessage` from the context provided by `App` (the root route's component)
 * and passes it as a prop to `HomeView`.
 */
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexRouteComponent() {
    // Access the context provided by the <Outlet context={...} /> in App.tsx.
    // This context should match AppRouterContext defined in App.tsx.
    // TODO: Ensure AppRouterContext is correctly typed and consistently used.
    const appContext = Route.useContext<AppRouterContext>();
    return <HomeView lastGeneralMessage={appContext?.lastGeneralMessage ?? null} />;
    // TODO: Consider if HomeView should use a React context hook directly if data is more complex
    // or if passing props through Outlet context is sufficient.
  },
});

/**
 * The route for the analysis view (path: '/analysis').
 * It renders the `AnalysisView` component.
 */
const analysisRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/analysis',
  component: AnalysisView,
  // TODO: If AnalysisView needs specific context, it can be provided or accessed similarly.
});

// TODO: Add a "Not Found" route (404) for undefined paths.
// const notFoundRoute = new Route({
//   getParentRoute: () => rootRoute,
//   path: '*',
//   component: () => <div>Page Not Found</div>,
// });

/**
 * The complete route tree for the application.
 * This combines the root route with all its child routes.
 */
const routeTree = rootRoute.addChildren([
  indexRoute,
  analysisRoute,
  // notFoundRoute, // TODO: Uncomment when 404 route is added
]);

/**
 * The TanStack Router instance.
 * It's configured with the `routeTree`.
 * TODO: Explore if any default context needs to be initialized at the Router level,
 * though typically context is provided by route components like `App`.
 */
export const router = new Router({
  routeTree,
  // defaultPreload: 'intent', // Optional: Preload routes on intent (hover/touch)
  // context: undefined, // Router-level context, if needed.
});

/**
 * Type declaration for TanStack Router to enable type safety.
 * This registers the `router` instance, allowing for type-safe navigation and route matching.
 */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
