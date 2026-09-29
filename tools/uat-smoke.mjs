const apiUrl = (process.env.UAT_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');
const email = process.env.UAT_EMAIL;
const password = process.env.UAT_PASSWORD;
const queueSecret = process.env.UAT_QUEUE_SECRET;

if (!email || !password) {
  throw new Error('Set UAT_EMAIL and UAT_PASSWORD in the private shell before running UAT.');
}

let cookieHeader = '';

function rememberCookies(response) {
  const values =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie')]
        : [];
  const cookies = values
    .flatMap((value) => value?.split(/,(?=[^;,]+=)/) ?? [])
    .map((value) => value.split(';', 1)[0])
    .filter(Boolean);
  if (cookies.length) cookieHeader = cookies.join('; ');
}

async function callRaw(path, options = {}) {
  const headers = new Headers(options.headers);
  if (cookieHeader) headers.set('cookie', cookieHeader);
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers });
  rememberCookies(response);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  return { status: response.status, ok: response.ok, body };
}

async function call(path, options = {}) {
  const response = await callRaw(path, options);
  if (!response.ok) {
    const detail =
      typeof response.body === 'object' && response.body
        ? (response.body.message ?? response.body.error)
        : response.body;
    throw new Error(
      `${options.method ?? 'GET'} ${path} returned ${response.status}: ${detail ?? ''}`,
    );
  }
  return response;
}

async function expectStatus(path, expectedStatus, options = {}) {
  const response = await callRaw(path, options);
  if (response.status !== expectedStatus) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} returned ${response.status}; expected ${expectedStatus}`,
    );
  }
  return response;
}

function jsonBody(value, extraHeaders = {}) {
  return {
    headers: { ...extraHeaders, 'content-type': 'application/json' },
    body: JSON.stringify(value),
  };
}

async function main() {
  const checks = [];
  const check = async (name, action) => {
    const result = await action();
    checks.push({ name, status: result.status });
    return result;
  };

  await check('health', () => call('/health'));
  await check('readiness', () => call('/health/ready'));
  const login = await check('login', () =>
    call('/auth/login', { method: 'POST', ...jsonBody({ email, password }) }),
  );
  const user = login.body?.data?.user ?? login.body?.user;

  for (const path of [
    '/auth/me',
    '/clients',
    '/matters',
    '/tasks',
    '/deadlines',
    '/documents',
    '/calendar/events',
    '/notifications',
    '/organization/overview',
    '/search?q=hop',
    '/reports/overview',
    '/audit',
  ]) {
    await check(path, () => call(path));
  }

  if (queueSecret) {
    await check('queue-reminders', () =>
      call('/internal/queues/reminders?date=2026-09-29', {
        headers: { 'x-queue-secret': queueSecret },
      }),
    );
    const messageId = `uat-${Date.now()}`;
    const queuePayload = {
      messageId,
      topic: 'lpms-events',
      eventType: 'NOTIFICATION_CREATE',
      payload: {
        userId: user?.id,
        title: 'UAT queue smoke',
        message: 'Temporary UAT notification',
        type: 'UAT',
      },
    };
    const processed = await check('queue-processed', () =>
      call('/internal/queues/process', {
        method: 'POST',
        ...jsonBody(queuePayload, { 'x-queue-secret': queueSecret }),
      }),
    );
    if (processed.body?.data?.status !== 'processed') {
      throw new Error('queue-processed did not return status=processed');
    }
    const duplicate = await check('queue-duplicate', () =>
      call('/internal/queues/process', {
        method: 'POST',
        ...jsonBody(queuePayload, { 'x-queue-secret': queueSecret }),
      }),
    );
    if (duplicate.body?.data?.status !== 'duplicate') {
      throw new Error('queue-duplicate did not return status=duplicate');
    }
    const unauthorized = await expectStatus('/internal/queues/process', 401, {
      method: 'POST',
      ...jsonBody(queuePayload),
    });
    checks.push({ name: 'queue-secret-required', status: unauthorized.status });
  }

  await check('logout', () => call('/auth/logout', { method: 'POST' }));
  console.log(JSON.stringify({ apiUrl, checks, queueChecked: Boolean(queueSecret) }, null, 2));
}

main().catch((error) => {
  console.error(`UAT_FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
