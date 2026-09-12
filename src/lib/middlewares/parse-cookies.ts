import { Request } from '@cloudflare/workers-types';

export function parseCookies(cloudflareRequest: Request): Record<string, string> {
  const cookieHeader = cloudflareRequest.headers.get('cookie') || '';

  return Object.fromEntries(
    cookieHeader
      .split(';')
      .filter(Boolean)
      .map(c => {
        const [k, ...v] = c.trim().split('=');

        let value = v.join('=');

        try {
          value = decodeURIComponent(value);
        } catch {}

        return [k, value];
      }),
  );
}
