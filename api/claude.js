// Proxy between the Athenea page and the Claude API.
// The API key stays on the server (ANTHROPIC_API_KEY env var on Vercel).
//
// Request:  POST /api/claude  { messages: [{role, content}], json?: boolean }
// Response: NDJSON stream, one object per line:
//   {"t": "<text delta>"}                 while the answer is generated
//   {"done": true, "truncated": bool}     when it finishes
//   {"error": "<code>"}                   if something goes wrong

import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
const EFFORT = process.env.ANTHROPIC_EFFORT || "medium";
const ACCESS_CODE = process.env.ATHENEA_ACCESS_CODE || "";
const MAX_TURNS = 40;
const MAX_CHARS = 200_000;

const JSON_SYSTEM =
  "Responde únicamente con un objeto JSON válido, sin texto antes ni después y sin bloques de código.";

const client = new Anthropic();

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorCode(err) {
  if (err instanceof Anthropic.RateLimitError) return "rate_limited";
  if (err instanceof Anthropic.AuthenticationError) return "not_configured";
  if (err instanceof Anthropic.BadRequestError) return "bad_request";
  if (err instanceof Anthropic.APIConnectionError) return "network";
  if (err instanceof Anthropic.APIError) return "api_error";
  return "server_error";
}

function validMessages(messages) {
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_TURNS) return false;
  let total = 0;
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return false;
    total += m.content.length;
  }
  return total <= MAX_CHARS && messages[0].role === "user" && messages[messages.length - 1].role === "user";
}

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) return jsonResponse(503, { error: "not_configured" });
  if (ACCESS_CODE && request.headers.get("x-athenea-code") !== ACCESS_CODE) {
    return jsonResponse(401, { error: "access_code" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "bad_request" });
  }
  const messages = body && body.messages;
  if (!validMessages(messages)) return jsonResponse(400, { error: "bad_request" });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const msgStream = client.messages.stream(
          {
            model: MODEL,
            max_tokens: 16000,
            thinking: { type: "adaptive" },
            output_config: { effort: EFFORT },
            ...(body.json ? { system: JSON_SYSTEM } : {}),
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          },
          { signal: request.signal },
        );
        for await (const event of msgStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send({ t: event.delta.text });
          }
        }
        const final = await msgStream.finalMessage();
        if (final.stop_reason === "refusal") send({ error: "refused" });
        else send({ done: true, truncated: final.stop_reason === "max_tokens" });
      } catch (err) {
        if (!request.signal.aborted) {
          console.error(err);
          send({ error: errorCode(err) });
        }
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function GET() {
  return jsonResponse(200, {
    ok: Boolean(process.env.ANTHROPIC_API_KEY),
    locked: Boolean(ACCESS_CODE),
  });
}
