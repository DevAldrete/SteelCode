// It's good practice to provide a type for the VS Code API object
// even if it's acquired globally in the webview context.
// This helps with IntelliSense and type checking.
interface VsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(newState: any): void;
}

// The acquireVsCodeApi function is provided by VS Code in the webview environment.
// It's important to call it only once and store the result.
/**
 * @file vscodeApi.ts
 * Encapsulates the logic for communication between the webview UI and the VS Code extension.
 * It provides methods for sending messages (with or without expecting a response) and
 * for listening to messages from the extension.
 */

/**
 * Interface for the VS Code API object provided by `acquireVsCodeApi`.
 * This object allows the webview to post messages to the extension and manage its state.
 */
interface VsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(newState: any): void;
}

// The `acquireVsCodeApi` function is provided by VS Code in the webview environment.
// It's important to call it only once and store the result.
// TODO: Add error handling or a fallback if `acquireVsCodeApi` is not available (e.g., when running UI in a browser).
declare const acquireVsCodeApi: () => VsCodeApi;
const vscode = acquireVsCodeApi();

/**
 * Defines the structure for messages exchanged between the webview and the extension.
 */
export interface WebviewMessage {
  /** A string identifying the type or action of the message. */
  type: string;
  /** Optional data payload associated with the message. */
  payload?: any;
  /** 
   * A unique identifier for messages that are part of a request-response pair.
   * The extension will include this ID in its response.
   */
  requestId?: string;
  /** Optional error information, typically sent from the extension in response to a failed request. */
  error?: any;
}

/**
 * A Map to store pending requests, mapping a `requestId` to its `resolve` and `reject` Promise functions.
 * This is used by `postMessageWithResponse` to handle asynchronous responses from the extension.
 */
const pendingRequests = new Map<string, { resolve: (payload: any) => void; reject: (error: any) => void }>();

/**
 * Default timeout for requests awaiting a response from the extension.
 * TODO: Make this configurable if necessary, or allow per-request timeout overrides.
 */
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Sends a message to the VS Code extension without expecting a direct response linked by `requestId`.
 * This is suitable for "fire-and-forget" messages or notifications.
 * @param message The message object to send. It should omit `requestId`.
 */
export function postMessageToExtension(message: Omit<WebviewMessage, 'requestId'>): void {
  // TODO: Consider adding logging here for easier debugging of message flows.
  // console.log('[Webview->Extension] Posting fire-and-forget message:', message);
  vscode.postMessage(message);
}

/**
 * Sends a message to the VS Code extension and returns a Promise that resolves with the extension's response
 * or rejects if an error occurs or the request times out.
 * @param message The message object to send. `requestId` will be automatically generated.
 * @returns A Promise that resolves with the payload from the extension's response or rejects with an error.
 */
export function postMessageWithResponse(message: Omit<WebviewMessage, 'requestId' | 'payload'> & { payload?: any }): Promise<any> {
  return new Promise((resolve, reject) => {
    // Generate a unique ID for this request.
    // Using type, timestamp, and a random string segment for uniqueness.
    const requestId = `${message.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    pendingRequests.set(requestId, { resolve, reject });

    const messageToSend: WebviewMessage = {
      ...message,
      requestId,
    };

    // TODO: Add verbose logging for request initiation.
    // console.log(`[Webview->Extension] Posting request (ID: ${requestId}):`, messageToSend);
    vscode.postMessage(messageToSend);

    // Set a timeout for the request. If the extension doesn't respond within this time, reject the promise.
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        // TODO: Standardize error objects/messages for timeouts.
        reject(new Error(`Request ${requestId} (type: ${message.type}) timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }
    }, REQUEST_TIMEOUT_MS);
  });
}

/**
 * Global message listener for messages coming from the VS Code extension.
 * This listener handles two types of messages:
 * 1. Responses to requests initiated by `postMessageWithResponse` (identified by `requestId`).
 * 2. General messages or notifications pushed from the extension (handled by `globalMessageHandler`).
 */
window.addEventListener('message', (event) => {
  // TODO: Add origin validation for security, though in webviews, the origin is usually controlled.
  // if (event.origin !== 'vscode-webview://your-extension-id') return;
  
  const message = event.data as WebviewMessage; // Assuming messages from extension follow this structure.
  // TODO: Add validation for the message structure itself (e.g., does it have a `type`?).

  if (message.requestId && pendingRequests.has(message.requestId)) {
    // This message is a response to a pending request.
    const promiseControls = pendingRequests.get(message.requestId)!;
    // TODO: Add verbose logging for response handling.
    // console.log(`[Extension->Webview] Received response for request (ID: ${message.requestId}):`, message);

    if (message.error) {
      // If the response contains an error property, reject the promise.
      promiseControls.reject(message.error);
    } else {
      // Otherwise, resolve the promise with the payload.
      promiseControls.resolve(message.payload);
    }
    pendingRequests.delete(message.requestId); // Clean up the pending request.
  } else {
    // This is a general message (not a direct response to a specific request) or an unhandled response.
    // TODO: Differentiate between unhandled responses (which might indicate an issue) and legitimate general messages.
    // console.log('[Extension->Webview] Received general message or unhandled response:', message);
    if (globalMessageHandler) {
      // If a global message handler is registered, pass the message to it.
      globalMessageHandler(message);
    } else {
      // TODO: Consider if unhandled messages should be logged more prominently or if a default behavior is needed.
      console.warn('[vscodeApi] No global message handler registered for message:', message);
    }
  }
});

/**
 * Stores the callback function for handling general messages from the extension.
 */
let globalMessageHandler: ((message: WebviewMessage) => void) | null = null;

/**
 * Registers a callback function to handle general messages (notifications, non-request-response messages)
 * received from the VS Code extension.
 * @param callback The function to call when a general message is received.
 * @returns A dispose function to remove the listener. Currently, it just nullifies the handler.
 *          TODO: If multiple listeners were supported, this would need more robust handling.
 */
export function addMessageListener(callback: (message: WebviewMessage) => void): () => void {
  // TODO: Consider supporting multiple global listeners if needed, perhaps with an array and unsubscribe mechanism.
  globalMessageHandler = callback;
  return () => {
    globalMessageHandler = null; // Simple unsubscription for a single listener.
  };
}
