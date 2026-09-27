import { leadWebhook } from "@/features/webhook/api/lead-webhook";

/**
 * POST /api/webhook/lead — entrada automática de leads (spec §6.1, opção A).
 * Contrato, autenticação e exemplos: docs/WEBHOOK.md.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: Request): Promise<Response> {
  return leadWebhook.handlePost(request);
}

export function OPTIONS(request: Request): Response {
  return leadWebhook.handleOptions(request);
}

export function GET(request: Request): Response {
  return leadWebhook.handleMethodNotAllowed(request);
}

export function PUT(request: Request): Response {
  return leadWebhook.handleMethodNotAllowed(request);
}

export function PATCH(request: Request): Response {
  return leadWebhook.handleMethodNotAllowed(request);
}

export function DELETE(request: Request): Response {
  return leadWebhook.handleMethodNotAllowed(request);
}
