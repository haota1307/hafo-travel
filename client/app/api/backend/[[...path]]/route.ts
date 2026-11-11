import { NextRequest, NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/api-url';

type Context = { params: Promise<{ path?: string[] }> };

async function proxyRequest(request: NextRequest, context: Context) {
  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl();
  } catch {
    return NextResponse.json(
      { success: false, message: 'BACKEND_NOT_CONFIGURED' },
      { status: 500 },
    );
  }

  const { path = [] } = await context.params;

  // Do not let URL normalization escape the configured backend prefix.
  if (path.some((segment) => segment === '.' || segment === '..' || /[\\/]/.test(segment))) {
    return NextResponse.json({ success: false, message: 'INVALID_BACKEND_PATH' }, { status: 400 });
  }

  const url = `${baseUrl}${path.length ? `/${path.map(encodeURIComponent).join('/')}` : ''}${request.nextUrl.search}`;
  const headers = new Headers();

  for (const name of ['accept', 'content-type']) {
    const value = request.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  try {
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: body?.byteLength ? body : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: request.signal,
    });
    const responseHeaders = new Headers();

    for (const name of ['content-type', 'content-disposition', 'retry-after', 'allow']) {
      const value = response.headers.get(name);

      if (value) {
        responseHeaders.set(name, value);
      }
    }

    return new NextResponse(
      request.method === 'HEAD' || [204, 205, 304].includes(response.status) ? null : response.body,
      { status: response.status, headers: responseHeaders },
    );
  } catch {
    return NextResponse.json({ success: false, message: 'BACKEND_UNAVAILABLE' }, { status: 502 });
  }
}

export {
  proxyRequest as GET,
  proxyRequest as HEAD,
  proxyRequest as POST,
  proxyRequest as PUT,
  proxyRequest as PATCH,
  proxyRequest as DELETE,
  proxyRequest as OPTIONS,
};
