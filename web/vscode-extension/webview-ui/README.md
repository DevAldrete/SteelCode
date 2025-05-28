# VS Code Extension Webview UI

This directory contains the React-based frontend for the Code Analyzer VS Code extension's webview. It is built using Rsbuild, React, Material UI, and GSAP for animations.

## Project Setup

1.  **Prerequisites**:
    *   Node.js (version recommended by Rsbuild, e.g., >=18.x)
    *   pnpm (version `pnpm@10.11.0` or as specified in the root `packageManager` field)

2.  **Installation**:
    Navigate to this directory (`web/vscode-extension/webview-ui/`) and run:
    ```bash
    pnpm install
    ```

## Available Scripts

In the `web/vscode-extension/webview-ui/` directory, you can run the following scripts:

*   **`pnpm dev`**:
    Runs the app in development mode using Rsbuild.
    Open [http://localhost:3000](http://localhost:3000) (or the port Rsbuild assigns) to view it in the browser.
    The page will reload if you make edits.

*   **`pnpm build`**:
    Builds the app for production to the `dist` folder using Rsbuild.
    It correctly bundles React in production mode and optimizes the build for the best performance. The output is suitable for being loaded into a VS Code webview.

## Folder Structure

The main source code is located in the `src/` directory:

*   `src/index.tsx`: The entry point of the React application.
*   `src/App.tsx`: The main application component containing the layout and core component integration.
*   `src/components/`: Contains reusable UI components.
    *   `Header.tsx`: The main application header.
    *   `FileExplorerPanel.tsx`: Panel for displaying and selecting files.
    *   `AnalysisResultsView.tsx`: Panel for displaying code analysis results.
    *   `StatusBar.tsx`: Bottom status bar.
*   `src/assets/`: For static assets like images or fonts.
*   `src/hooks/`: For custom React hooks.
*   `src/theme/`: For Material UI theme customization (if any).
*   `src/types/`: For shared TypeScript type definitions (e.g., `AnalysisIssue`, `FileItem` could be moved here).
*   `src/utils/`: For utility functions.
*   `src/views/`: For more complex view components that might combine multiple smaller components.

## Key Technologies

*   **React**: JavaScript library for building user interfaces.
*   **Rsbuild**: Fast Rspack-based build tool for web projects.
*   **Material UI**: React component library for faster and easier web development, following Material Design.
*   **GSAP (GreenSock Animation Platform)**: Professional-grade animation library for JavaScript.
*   **TypeScript**: Typed superset of JavaScript that compiles to plain JavaScript.

## TODOs for Integration with VS Code Extension

*   **Message Passing**: Implement the communication bridge between the VS Code extension host and this webview UI. This will be necessary for:
    *   Receiving files/code to analyze from the extension.
    *   Receiving analysis results from the backend (via the extension).
    *   Sending user actions (e.g., file selection, requests to re-analyze) to the extension.
*   **Real Data**: Replace all mock data (`mockIssues` in `AnalysisResultsView.tsx`, `mockFiles` in `FileExplorerPanel.tsx`) with data received from the extension.
*   **Theme Integration**: Consider synchronizing the webview's theme (light/dark) with the VS Code theme settings. Material UI provides theming capabilities for this.
*   **VS Code UI Toolkit**: For a more native VS Code look and feel, consider incorporating elements from the [VS Code Webview UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit) for certain components like buttons or form controls, or ensure Material UI components are styled to match closely. This is optional but enhances user experience.

## Advanced TODOs and Considerations

Beyond the basic integration, here are areas for further development and optimization:

### Optimizations

*   **Performance Profiling**: Once integrated with real data, profile the React application for performance bottlenecks, especially with large file lists or numerous analysis issues.
*   **Virtualized Lists**: For potentially long lists in the "File Explorer" or "Analysis Results" views, implement virtualization (e.g., using `react-window` or `react-virtualized`) to ensure smooth scrolling and efficient rendering.
*   **Memoization**: Apply `React.memo`, `useMemo`, and `useCallback` strategically to prevent unnecessary re-renders of components, particularly those that might receive complex props or handle frequent updates.
*   **Code Splitting**: While Rsbuild handles much of this, review if further manual code splitting for specific routes or heavy components could improve initial load time (less critical for a webview, but good practice).
*   **Image Optimization**: If images are used, ensure they are optimized.
*   **Debouncing/Throttling**: For user inputs that trigger actions (e.g., search/filter, if added), use debouncing or throttling to limit the rate of updates.

### Potential Bug Areas & Robustness

*   **State Management**: As the application grows, ensure consistent and predictable state management. For complex states, consider a dedicated state management library (though for the current scope, React Context or component state might suffice).
*   **Edge Cases in Data**: Test thoroughly with various forms of analysis data:
    *   Empty results.
    *   Results with missing optional fields (e.g., no `codeSnippet` or `ruleId`).
    *   Very long messages or file paths.
    *   Files with unusual characters or encodings (though the analysis backend should handle this primarily).
*   **Asynchronous Operations**: Ensure proper handling of loading states, errors, and race conditions for any asynchronous operations (e.g., when real data fetching is implemented).
*   **Cross-Component Communication**: Verify that interactions between components (e.g., selecting a file updates the analysis view) are robust and handle dependencies correctly.
*   **GSAP Animation Conflicts**: If more complex animations are added, test for conflicts or performance issues. Ensure proper cleanup of GSAP instances if not using `useGSAP` or if manual tweens are created outside React's lifecycle.
*   **Material UI Customization**: Deep customization of Material UI components can sometimes lead to unexpected styling interactions. Test custom themes and component overrides thoroughly.

### Feature Enhancements (Examples)

*   **Filtering and Sorting**: Add controls to filter analysis results (by severity, file, rule ID) and sort them.
*   **Search**: Implement search functionality within the file explorer or analysis results.
*   **User Settings**: Allow users to customize aspects of the UI (e.g., density of lists, what columns are visible).
*   **Detailed Issue View**: Clicking an issue could show a more detailed modal or separate view with more context.
