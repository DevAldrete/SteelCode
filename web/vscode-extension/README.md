# Code Analyzer VS Code Extension

This directory contains the main VS Code extension. The actual user interface for displaying analysis results is a webview application located in the `webview-ui/` subdirectory.

## Webview UI

The frontend for the extension's webview is a React application built with Rsbuild, Material UI, and TypeScript.

*   **Source Code**: `web/vscode-extension/webview-ui/`
*   **README**: Detailed information about the webview UI, its setup, and development can be found in `web/vscode-extension/webview-ui/README.md`.

### Building the Webview UI

To build the webview UI for integration into the extension:

1.  Navigate to the webview UI directory:
    ```bash
    cd webview-ui
    ```
2.  Install dependencies (if not already done):
    ```bash
    pnpm install
    ```
3.  Build the UI:
    ```bash
    pnpm build
    ```
This will generate a production build in `web/vscode-extension/webview-ui/dist/`. The main entry point will be `index.html` in that directory.

## Integrating the Webview into the VS Code Extension

The VS Code extension (actual source code for which is TBD in this directory, e.g., `src/extension.ts`) will need to:

1.  **Create a Webview Panel**: Use the `vscode.window.createWebviewPanel` API.
2.  **Load Webview Content**:
    *   Read the `index.html` file from the `webview-ui/dist/` directory.
    *   Adjust asset paths in the HTML content to correctly point to JS/CSS files within the `dist` folder, using `webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist', ...))` for each asset.
3.  **Implement Message Passing**:
    *   Use `webview.onDidReceiveMessage` to handle messages sent from the webview UI (e.g., file selection, user actions).
    *   Use `webview.postMessage` to send data to the webview UI (e.g., analysis results, file lists).
4.  **Manage State and Backend Interaction**: The extension will be responsible for fetching code, triggering the Go-based analysis backend, and relaying results to the webview.

## Future Development TODOs (Extension-Level)

*   **Extension Entry Point**: Implement `src/extension.ts` (or similar) with `activate` and `deactivate` functions.
*   **Commands and UI Contributions**: Define VS Code commands (e.g., "Analyze Current File," "Open Analyzer Panel") and contribute them to the UI (e.g., command palette, editor context menus).
*   **Webview Panel Management**: Implement logic to create, show, and dispose of the webview panel.
*   **Backend Communication**: Design and implement the mechanism for the extension to invoke the Go analyzer and receive results. This might involve child processes, local HTTP calls if the backend is a server, or other IPC methods.
*   **Configuration**: Add settings for the extension (e.g., path to analyzer executable, analysis options).
*   **Error Handling**: Robust error handling for backend interactions and webview loading.
*   **Testing**: Implement tests for the extension logic.
