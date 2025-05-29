# Code Analyzer Webview UI

## Overview

This directory contains the source code for the Webview UI of the Code Analyzer VS Code extension. This UI is a React-based single-page application (SPA) that provides the user interface for interacting with the code analysis features. It is rendered within a VS Code Webview Panel, controlled by the main extension.

The UI is responsible for:
*   Displaying navigation and different views (e.g., Home, Analysis).
*   Allowing users to input code or select files/folders for analysis (file/folder selection is a TODO).
*   Initiating analysis requests to the VS Code extension.
*   Displaying analysis results, loading states, and error messages.
*   Managing its own state using tools like TanStack Query for server/async state and component state for UI elements.

## Tech Stack

*   **React 19:** For building the user interface components.
*   **Material UI (MUI):** As the component library for styling and layout.
*   **TanStack Query (v5):** For managing server state, caching, and data fetching from the extension.
*   **TanStack Router (v1):** For client-side navigation within the webview.
*   **TypeScript:** For static typing and improved developer experience.
*   **Rsbuild:** As the build tool for developing and bundling the UI assets.
*   **pnpm:** As the package manager.

## Building the UI

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [pnpm](https://pnpm.io/) (version specified in `package.json`'s `packageManager` field, e.g., `pnpm@10.11.0`)

### Installation

Navigate to this directory (`web/vscode-extension/webview-ui/`) and run:
```bash
pnpm install
```
If you need to use a specific pnpm version managed by corepack (as defined in the parent `package.json`), you might need to enable corepack (`corepack enable`) or use `npx pnpm@<version> install`.

### Development Server

To start the development server (usually with hot-reloading):
```bash
pnpm run dev
```
This typically opens the UI in a browser, which is useful for standalone UI development. Note that when run this way, communication with the VS Code extension (`vscodeApi.ts`) will not work as it relies on the VS Code Webview environment.

### Production Build

To build the static assets for the UI (HTML, CSS, JS):
```bash
pnpm run build
```
The output is typically placed in a `dist/` folder. These are the files that the VS Code extension will load into the webview panel.

## TanStack Query Usage

TanStack Query is used to manage asynchronous operations and cache their results, treating interactions with the VS Code extension as server state.

*   **Communication Layer:** All queries and mutations communicate with the extension via the `postMessageWithResponse` function in `src/vscodeApi.ts`. This function sends a message to the extension and returns a promise that resolves with the extension's response.
*   **`useQuery` Example:**
    *   The `DummyDataFetcher` component (currently within `src/components/HomeView.tsx`) demonstrates `useQuery` for fetching data.
    *   The `queryFn` calls `postMessageWithResponse({ type: 'getDummyData' })`.
*   **`useMutation` Example:**
    *   The `src/components/AnalysisRunner.tsx` component uses `useMutation` to trigger an analysis.
    *   The `mutationFn` calls `postMessageWithResponse({ type: 'runAnalysis', payload: { ... } })`.
*   **Adding a New Query/Mutation:**
    1.  **Define Message Types:** Ensure the message `type` (e.g., `getNewData`, `performNewAction`) and expected `payload`/response structure are defined and handled in `extension.ts`.
    2.  **Implement Query/Mutation:**
        *   For queries: `useQuery({ queryKey: ['uniqueKey'], queryFn: () => postMessageWithResponse({ type: 'yourMessageType', payload: { ... } }) })`.
        *   For mutations: `useMutation({ mutationFn: (vars) => postMessageWithResponse({ type: 'yourActionType', payload: vars }) })`.
    3.  **Handle States:** Use the `isLoading`, `isError`, `error`, `data`, `isPending` properties returned by the hooks to update the UI.

## TanStack Router Usage

TanStack Router handles client-side navigation within the webview, allowing for different views without needing the extension to reload the entire webview content.

*   **Route Definitions:** Routes are defined in `src/routes.tsx`. This includes:
    *   A `rootRoute` which often uses `src/App.tsx` as its component to provide a shared layout.
    *   Child routes for different views (e.g., `/` for `HomeView`, `/analysis` for `AnalysisView`).
*   **Main Layout (`src/App.tsx`):**
    *   This component typically renders common UI elements like the header and sidebar.
    *   It uses `<Outlet />` from TanStack Router to render the component for the currently matched child route.
    *   It can also provide context to child routes via `<Outlet context={...} />`.
*   **Navigation Links (`src/components/Header.tsx`):**
    *   The `<Link>` component from TanStack Router is used to create navigation links (e.g., in the `Header`).
    *   Example: `<Link to="/analysis" activeProps={{ style: { fontWeight: 'bold' } }}>Analysis</Link>`.
*   **Adding a New Route:**
    1.  **Create Component:** Create your new view component (e.g., `src/components/NewView.tsx`).
    2.  **Define Route:** In `src/routes.tsx`:
        *   Import your new component.
        *   Create a new `Route` instance:
            ```typescript
            const newViewRoute = new Route({
              getParentRoute: () => rootRoute, // Or another parent route
              path: '/new-view',
              component: NewViewComponent,
            });
            ```
        *   Add it to the `routeTree`.
    3.  **Add Navigation:** Add a `<Link to="/new-view">New View</Link>` in `Header.tsx` or elsewhere.

## Communication with Extension

All direct communication with the VS Code extension side is encapsulated in `src/vscodeApi.ts`.
*   `postMessageToExtension(message)`: For fire-and-forget messages to the extension.
*   `postMessageWithResponse(message)`: For messages that expect a response. This returns a Promise that resolves with the payload from the extension or rejects if an error occurs or the request times out.
*   `addMessageListener(callback)`: To listen for general messages pushed from the extension that are not direct responses to a request (e.g., notifications).

This setup helps keep the rest of the UI components decoupled from the specifics of the VS Code `postMessage` API.
```
