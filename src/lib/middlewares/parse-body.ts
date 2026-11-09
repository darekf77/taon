import { Request } from '@cloudflare/workers-types';

export async function parseBody(
  request: Pick<Request, 'method' | 'headers' | 'formData' | 'text'>,
) {
  const method = request.method.toUpperCase();

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return undefined;
  }

  const contentType = (request.headers.get('content-type') || '').toLowerCase();

  if (contentType.split(';')[0].trim() === 'application/octet-stream') {
    return undefined;
  }

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }

  if (contentType.includes('application/json')) {
    const text = await request.text();

    if (!text.trim()) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      // Express/body-parser would normally reject malformed JSON.
      throw new SyntaxError('Invalid JSON body');
    }
  }

  const text = await request.text();

  return text || undefined;
}
