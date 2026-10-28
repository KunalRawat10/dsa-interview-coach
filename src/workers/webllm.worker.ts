import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

// Instantiate the official WebWorkerMLCEngineHandler inside the worker context
const handler = new WebWorkerMLCEngineHandler()

// Forward worker message events to the handler
self.onmessage = (event: MessageEvent) => {
  handler.onmessage(event)
}
