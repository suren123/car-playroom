import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { handleRecords } from '../lib/records-api';

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const path = new URL(request.url).pathname;
    let response: Response;
    if (path === '/api/records') {
      // Sites applies the owner-only OpenAI sign-in gate before requests reach
      // this Worker. Keep the same-origin check for writes in handleRecords.
      response = await handleRecords(request, env);
    } else {
      let binding = ctx.props?.CONNECTORS;
      // Local preview emulates the same request-scoped capability. This branch and
      // the auxiliary service binding are absent from production builds.
      if (import.meta.env.DEV && !binding && env.CONNECTORS) {
        const preview = env.CONNECTORS;
        const expiresAt = Date.now() + 60_000;
        binding = {
          async getContext() {
            if (Date.now() >= expiresAt) return { status: "request_context_expired" };
            return preview.getContext?.() ?? { status: "binding_unavailable" };
          },
          async invoke(connectorId, actionName, args) {
            if (Date.now() >= expiresAt) {
              return { status: "request_context_expired", message: "This request has expired. Please try again." };
            }
            return preview.invoke(connectorId, actionName, args);
          },
        };
      }
      response = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    }
    const secured = new Response(response.body, response);
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    secured.headers.set('Referrer-Policy', 'same-origin');
    secured.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (new URL(request.url).pathname === '/game') secured.headers.set('Cache-Control', 'no-store');
    return secured;
  },
};

export default worker;
