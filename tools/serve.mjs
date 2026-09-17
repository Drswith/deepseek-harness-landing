import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticRoot = path.join(projectRoot, 'dist');
const host = process.env.HOST || '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '43882', 10);

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.ttf', 'font/ttf'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
]);

function sendText(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
  });
  response.end(body);
}

function redirect(response, location) {
  response.writeHead(308, {
    'Cache-Control': 'no-store',
    Location: location,
  });
  response.end();
}

function parseRange(rangeHeader, size) {
  if (rangeHeader === undefined) {
    return null;
  }
  if (typeof rangeHeader !== 'string') {
    return { invalid: true };
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match || (match[1] === '' && match[2] === '') || size === 0) {
    return { invalid: true };
  }

  if (match[1] === '') {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return { invalid: true };
    }
    return { start: Math.max(size - suffixLength, 0), end: size - 1 };
  }

  const start = Number(match[1]);
  if (!Number.isSafeInteger(start) || start >= size) {
    return { invalid: true };
  }

  const requestedEnd = match[2] === '' ? size - 1 : Number(match[2]);
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) {
    return { invalid: true };
  }

  return { start, end: Math.min(requestedEnd, size - 1) };
}

function sendRangeNotSatisfiable(response, method, size) {
  const body = 'Range Not Satisfiable\n';
  response.writeHead(416, {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    'Content-Range': `bytes */${size}`,
    'Content-Type': 'text/plain; charset=utf-8',
  });
  response.end(method === 'HEAD' ? undefined : body);
}

function filePathForRequest(requestPath) {
  const decodedPath = decodeURIComponent(requestPath);
  const pathSegments = decodedPath.split(/[\\/]/);
  if (decodedPath.includes('\0') || pathSegments.includes('..')) {
    return null;
  }

  const candidate = path.resolve(staticRoot, decodedPath.replace(/^\/+/, ''));
  const relativeCandidate = path.relative(staticRoot, candidate);
  if (relativeCandidate === '..' || relativeCandidate.startsWith(`..${path.sep}`) || path.isAbsolute(relativeCandidate)) {
    return null;
  }

  return candidate;
}

async function resolveFile(requestPath) {
  let requestedPath;
  try {
    requestedPath = filePathForRequest(requestPath);
  } catch (error) {
    if (error instanceof URIError) {
      return null;
    }
    throw error;
  }
  if (!requestedPath) {
    return null;
  }

  try {
    const requestedStats = await fs.stat(requestedPath);
    if (requestedStats.isFile()) {
      return requestedPath;
    }
    if (!requestedStats.isDirectory()) {
      return null;
    }
    if (!requestPath.endsWith('/')) {
      return { redirect: `${requestPath}/` };
    }

    return path.join(requestedPath, 'index.html');
  } catch (error) {
    if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') {
      throw error;
    }
  }

  if (!requestPath.endsWith('/')) {
    let directoryPath;
    try {
      directoryPath = filePathForRequest(`${requestPath}/`);
    } catch (error) {
      if (error instanceof URIError) {
        return null;
      }
      throw error;
    }
    if (directoryPath) {
      try {
        const directoryStats = await fs.stat(directoryPath);
        if (directoryStats.isDirectory()) {
          return { redirect: `${requestPath}/` };
        }
      } catch (error) {
        if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') {
          throw error;
        }
      }
    }
  }

  return null;
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method Not Allowed\n', { Allow: 'GET, HEAD' });
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(request.url || '/', `http://${host}:${port}`);
  } catch {
    sendText(response, 400, 'Bad Request\n');
    return;
  }

  try {
    const resolved = await resolveFile(requestUrl.pathname);
    if (!resolved) {
      sendText(response, 404, 'Not Found\n');
      return;
    }
    if (typeof resolved === 'object') {
      redirect(response, resolved.redirect);
      return;
    }

    const realStaticRoot = await fs.realpath(staticRoot);
    const realResolved = await fs.realpath(resolved);
    const relativeResolved = path.relative(realStaticRoot, realResolved);
    if (relativeResolved === '..' || relativeResolved.startsWith(`..${path.sep}`) || path.isAbsolute(relativeResolved)) {
      sendText(response, 404, 'Not Found\n');
      return;
    }

    const contentType = mimeTypes.get(path.extname(resolved).toLowerCase()) || 'application/octet-stream';
    const fileStats = await fs.stat(realResolved);
    const range = parseRange(request.headers.range, fileStats.size);
    if (range?.invalid) {
      sendRangeNotSatisfiable(response, request.method, fileStats.size);
      return;
    }

    const responseHeaders = {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Content-Length': range ? range.end - range.start + 1 : fileStats.size,
      'Content-Type': contentType,
    };
    if (range) {
      responseHeaders['Content-Range'] = `bytes ${range.start}-${range.end}/${fileStats.size}`;
    }

    response.writeHead(range ? 206 : 200, responseHeaders);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    const streamOptions = range ? { start: range.start, end: range.end } : undefined;
    const fileStream = createReadStream(realResolved, streamOptions);
    fileStream.on('error', (error) => {
      console.error(error);
      response.destroy(error);
    });
    fileStream.pipe(response);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      sendText(response, 404, 'Not Found\n');
      return;
    }
    console.error(error);
    sendText(response, 500, 'Internal Server Error\n');
  }
});

function stop(signal) {
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
  server.closeAllConnections?.();
  console.log(`Stopped (${signal})`);
}

server.once('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));

server.listen(port, host, () => {
  console.log(`Static site server listening at http://${host}:${server.address().port}/`);
  console.log(`Static root: ${staticRoot}`);
});
