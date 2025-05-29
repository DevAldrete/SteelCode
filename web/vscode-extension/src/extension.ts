import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http'; // For making HTTP requests, currently used for simulation structure

/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 * @param {vscode.ExtensionContext} context - The context for the extension, used for managing disposables and other extension-specific resources.
 */
export function activate(context: vscode.ExtensionContext) {
    // TODO: Add a console log to indicate the extension has been activated for easier debugging.
    // console.log('[CodeAnalyzerExtension] Congratulations, your extension "code-analyzer" is now active!');

    // Register the command that will show the webview panel.
    // This command is defined in package.json and can be triggered from the command palette.
    let disposable = vscode.commands.registerCommand('codeAnalyzer.showPanel', () => {
        // Create and show a new webview panel
        const panel = vscode.window.createWebviewPanel(
            'codeAnalyzer', // Identifies the type of the webview. Used internally by VS Code.
            'Code Analyzer', // Title of the panel displayed to the user in the editor tab.
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                enableScripts: true, // Enable JavaScript execution in the webview.
                // Restrict the webview to only loading content from our extension's `webview-ui/dist` (for bundled assets)
                // and `webview-ui` (for index.html if served directly) directories.
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'dist'),
                    vscode.Uri.joinPath(context.extensionUri, 'webview-ui')
                ]
                // TODO: Consider adding `retainContextWhenHidden: true` if the webview state needs to be preserved
                // even when the panel is not visible. This might increase memory usage.
            }
        );

        // Construct URIs for local resources.
        // `context.extensionUri` provides the base URI for the extension's installation path.
        const webviewUiDistPath = vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'dist');
        const webviewUiBasePath = vscode.Uri.joinPath(context.extensionUri, 'webview-ui');

        // TODO: More robustly locate index.html. Currently assumes it's in `webview-ui/`.
        // It might be in `webview-ui/dist/index.html` after a build step.
        // Check `webview-ui/dist/index.html` first, then fallback to `webview-ui/index.html`.
        const indexHtmlPath = vscode.Uri.joinPath(webviewUiBasePath, 'index.html');
        let htmlContent: string;
        try {
            htmlContent = fs.readFileSync(indexHtmlPath.fsPath, 'utf8');
        } catch (err) {
            console.error('[CodeAnalyzerExtension] Failed to read index.html:', err);
            vscode.window.showErrorMessage('Failed to load Code Analyzer UI. Index.html not found.');
            // TODO: Display a more user-friendly error page in the webview itself.
            panel.webview.html = `<html><body><h1>Error loading Code Analyzer UI</h1><p>Details: ${err}</p></body></html>`;
            return;
        }
        

        // Replace placeholders for CSS and JS file paths in index.html with their webview URIs.
        // This is a common pattern for loading webview assets correctly.
        // It rewrites paths like `href="assets/index.css"` to use the `vscode-resource:` scheme.
        htmlContent = htmlContent.replace(
            /(href|src)="(.*?)"/g, // Matches href="..." or src="..."
            (match, p1Attribute, p2Path) => {
                // For external URLs (http, https) or data URIs, keep them as is.
                if (p2Path.startsWith('http') || p2Path.startsWith('data:')) {
                    return match;
                }

                // Attempt to resolve the asset path relative to the `dist` directory first.
                let assetUri = vscode.Uri.joinPath(webviewUiDistPath, p2Path);
                if (fs.existsSync(assetUri.fsPath)) {
                     return `${p1Attribute}="${panel.webview.asWebviewUri(assetUri)}"`;
                }

                // Fallback: Attempt to resolve the asset path relative to the `webview-ui` base directory.
                // This might be useful if some assets are not in `dist` (e.g., during development or if not bundled).
                // TODO: Re-evaluate if this fallback is truly necessary or if the build process should ensure all assets are in `dist`.
                assetUri = vscode.Uri.joinPath(webviewUiBasePath, p2Path);
                if (fs.existsSync(assetUri.fsPath)) {
                    return `${p1Attribute}="${panel.webview.asWebviewUri(assetUri)}"`;
                }
                
                // If the asset is not found in `dist` or `webview-ui`, log a warning.
                // This indicates a potential issue with asset paths or the build process.
                console.warn(`[CodeAnalyzerExtension] Asset not found: ${p2Path}. Using original path. This may cause issues in the webview.`);
                // TODO: Consider a more user-facing error or a placeholder if critical assets are missing.
                return match; // Keep original path if not found, though it likely won't load.
            }
        );

        // Set a <base> tag to correctly resolve relative paths for assets loaded by the webview's JavaScript or CSS.
        // The base href should point to the directory containing the majority of your static assets (usually `webview-ui/dist/`).
        const baseUri = panel.webview.asWebviewUri(webviewUiDistPath);
        htmlContent = htmlContent.replace('<head>', `<head>\n<base href="${baseUri}/">`);
        // TODO: Ensure this base tag replacement is robust, e.g., doesn't duplicate if one already exists,
        // or handles cases where `<head>` might have attributes.

        panel.webview.html = htmlContent;

        // Post an initial message to the webview when its content is set.
        // The webview can listen for this to know when it's safe to perform initial actions.
        // TODO: Consider if 'webviewReady' should be sent after the webview *confirms* it has loaded,
        // e.g., by listening for a 'webviewUiMounted' message from the webview.
        panel.webview.postMessage({ type: 'webviewReady', payload: true });


        // Handle messages received from the webview.
        // These messages are sent from the webview UI using `vscode.postMessage({...})`.
        panel.webview.onDidReceiveMessage(
            message => {
                console.log('[CodeAnalyzerExtension] Message received from webview:', message);

                switch (message.type) {
                    case 'webviewUiReady':
                        // Webview UI has signaled it's mounted and ready.
                        // TODO: This is a good place to trigger any initial data pushes to the webview if needed.
                        console.log('[CodeAnalyzerExtension] Webview UI reported ready.');
                        // Example: Send initial configuration or workspace data.
                        // panel.webview.postMessage({ type: 'initialData', payload: { currentTheme: vscode.window.activeColorTheme.kind } });
                        break;
                    case 'testFromWebview':
                        // Handle a test message from the webview and send a response.
                        // This demonstrates the request/response pattern using `requestId`.
                        panel.webview.postMessage({
                            type: 'testResponseFromExtension', // Custom type for this specific response
                            originalPayload: message.payload,
                            requestId: message.requestId, // Crucial for promise resolution in webviewApi.ts
                            payload: 'Response from Extension to testFromWebview!'
                        });
                        break;
                    case 'getDummyData':
                        // Simulate fetching some data (e.g., from a file or another service) and returning it.
                        // TODO: Replace this simulation with actual data fetching logic if this becomes a real feature.
                        setTimeout(() => {
                            panel.webview.postMessage({
                                type: 'dummyDataResponse', // Ensure webview expects this 'type' for this request
                                payload: {
                                    message: 'This is DUMMY data from the extension, fetched at ' + new Date().toLocaleTimeString(),
                                    timestamp: new Date().toISOString(),
                                    randomNumber: Math.random() * 1000,
                                },
                                requestId: message.requestId,
                            });
                        }, 1500); // Simulate 1.5 seconds network delay
                        break;
                    case 'runAnalysis':
                        // Handle request to run code analysis.
                        // TODO: Implement validation for the payload structure.
                        const codeToAnalyze = message.payload?.codeToAnalyze;
                        if (typeof codeToAnalyze !== 'string') {
                            panel.webview.postMessage({
                                type: 'analysisError', // Specific error type for this action
                                error: 'Invalid payload for runAnalysis: codeToAnalyze must be a string.',
                                requestId: message.requestId,
                            });
                            break;
                        }

                        // TODO: Replace this simulation with an actual call to a backend analysis service or library.
                        // The current implementation simulates an API call to http://localhost:8080/api/analyze.
                        const postData = JSON.stringify({ code: codeToAnalyze });
                        // TODO: Make API URL configurable (e.g., through VS Code settings) or use a constant.
                        const apiUrl = new URL('http://localhost:8080/api/analyze'); // Placeholder/Example URL

                        const options: http.RequestOptions = {
                            hostname: apiUrl.hostname,
                            port: apiUrl.port,
                            path: apiUrl.pathname,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': Buffer.byteLength(postData),
                            },
                            timeout: 5000, // TODO: Make timeout configurable. 5 seconds.
                        };

                        // Simulate network delay and different backend responses based on input.
                        // This section demonstrates how different outcomes from an API might be handled.
                        // TODO: Remove this simulation block when connecting to a real backend.
                        setTimeout(() => {
                            if (codeToAnalyze.toLowerCase().includes("error")) {
                                // Simulate an error response from the backend (e.g., 500 Internal Server Error)
                                 panel.webview.postMessage({
                                    type: 'analysisError', // Webview should expect this type for errors from this request
                                    error: 'Simulated: Analysis API returned an error.',
                                    details: { statusCode: 500, message: 'Internal Server Error simulation during analysis.' },
                                    requestId: message.requestId,
                                });
                            } else if (codeToAnalyze.toLowerCase().includes("empty")) {
                                // Simulate an empty but successful response (e.g., 200 OK with no issues found)
                                panel.webview.postMessage({
                                    type: 'analysisResult', // Webview should expect this 'type' for successful results
                                    payload: { report: 'Simulated: Analysis complete. No significant issues found.', issues: [] },
                                    requestId: message.requestId,
                                });
                            } else {
                                // Simulate a successful response with some analysis data
                                panel.webview.postMessage({
                                    type: 'analysisResult',
                                    payload: {
                                        report: `Simulated: Analysis completed successfully for ${codeToAnalyze.length} characters.`,
                                        issues: [
                                            { line: 10, type: 'warning', message: 'Potential null pointer dereference (simulated).' },
                                            { line: 25, type: 'info', message: 'Unused variable detected (simulated).' },
                                        ],
                                        metrics: { complexity: 42, coverage: '75%', linesOfCode: codeToAnalyze.split('\n').length }
                                    },
                                    requestId: message.requestId,
                                });
                            }
                        }, 2000); // Simulate 2 seconds delay for API response

                        // // == Actual HTTP Request Block (kept for reference, currently using simulation above) ==
                        // // TODO: Uncomment and adapt this block when connecting to a real backend API.
                        // const req = http.request(options, (res) => {
                        //     let responseBody = '';
                        //     res.setEncoding('utf8');
                        //     res.on('data', (chunk) => { responseBody += chunk; });
                        //     res.on('end', () => {
                        //         try {
                        //             // TODO: More robust parsing, handle non-JSON responses if possible.
                        //             const parsedBody = JSON.parse(responseBody || '{}'); // Ensure responseBody is not empty for JSON.parse
                        //             if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        //                 panel.webview.postMessage({
                        //                     type: 'analysisResult', // This type should match what webview expects
                        //                     payload: parsedBody,
                        //                     requestId: message.requestId,
                        //                 });
                        //             } else {
                        //                 // TODO: Standardize error object structure from API.
                        //                 panel.webview.postMessage({
                        //                     type: 'analysisError',
                        //                     error: `API Error: ${res.statusCode} - ${res.statusMessage}`,
                        //                     details: parsedBody, // Send API error details to webview
                        //                     requestId: message.requestId,
                        //                 });
                        //             }
                        //         } catch (e:any) {
                        //             // TODO: More specific error handling for JSON parsing failure.
                        //             // This indicates an issue with the API response format or an empty/invalid JSON.
                        //             console.error('[CodeAnalyzerExtension] Failed to parse API response:', e);
                        //             panel.webview.postMessage({
                        //                 type: 'analysisError',
                        //                 error: 'Failed to parse API response from analysis server.',
                        //                 details: { message: e.message, receivedBody: responseBody },
                        //                 requestId: message.requestId,
                        //             });
                        //         }
                        //     });
                        // });
                        // req.on('error', (e) => {
                        //     // TODO: Handle different types of network errors more gracefully (e.g., ECONNREFUSED, DNS issues).
                        //     console.error('[CodeAnalyzerExtension] Network request to analysis API failed:', e);
                        //     panel.webview.postMessage({
                        //         type: 'analysisError',
                        //         error: 'Network request to analysis API failed. Ensure the backend server is running.',
                        //         details: { message: e.message, code: (e as any).code },
                        //         requestId: message.requestId,
                        //     });
                        // });
                        // req.on('timeout', () => {
                        //     req.destroy(); // Important to destroy the request on timeout.
                        //     console.error('[CodeAnalyzerExtension] Request to analysis API timed out.');
                        //     panel.webview.postMessage({
                        //         type: 'analysisError',
                        //         error: 'Request to analysis API timed out.',
                        //         requestId: message.requestId,
                        //     });
                        // });
                        // req.write(postData); // Send the request body.
                        // req.end(); // Finalize the request.
                        // // == End of Actual HTTP Request Block ==
                        break;
                    default:
                        // Handle unknown message types, potentially sending an error back to the webview.
                        console.warn(`[CodeAnalyzerExtension] Received unknown message type: ${message.type} from webview.`);
                        // TODO: Optionally send a response to webview indicating the message type was not recognized.
                        // This requires the webview to handle such generic error responses.
                        // if (message.requestId) { // Only if a response is expected
                        //     panel.webview.postMessage({
                        //         type: 'unknownMessageError',
                        //         error: `Unknown message type received by extension: ${message.type}`,
                        //         requestId: message.requestId,
                        //     });
                        // }
                        break;
                }
            },
            undefined, // `thisArgs` for the listener, usually not needed.
            context.subscriptions // Collection of disposables to be cleaned up when the extension is deactivated.
                                  // The message listener will be automatically disposed.
        );

        // TODO: Implement logic to persist webview state when it's hidden and restore it when it becomes visible again.
        // This can be done using `panel.onDidDispose` and `panel.onDidChangeViewState`.
        // panel.onDidDispose(() => { /* Cleanup logic, e.g., stop background tasks related to this panel */ }, null, context.subscriptions);
        // panel.onDidChangeViewState(e => {
        //     if (e.webviewPanel.visible) { /* Webview became visible, restore state or refresh data */ }
        //     else { /* Webview is hidden, potentially pause updates or save state */ }
        // }, null, context.subscriptions);

    });

    // Add the command's disposable to the context's subscriptions.
    // This ensures that the command is unregistered when the extension is deactivated.
    context.subscriptions.push(disposable);
}

/**
 * This method is called when your extension is deactivated.
 * It's a place to clean up any resources (e.g., listeners, timers, connections)
 * that were set up in the `activate` function.
 */
export function deactivate() {
    // TODO: Implement any necessary cleanup when the extension is deactivated.
    // For example, stop any running background processes, close network connections,
    // or dispose of any other resources that won't be automatically handled by `context.subscriptions`.
    console.log('[CodeAnalyzerExtension] Extension "code-analyzer" has been deactivated.');
}
