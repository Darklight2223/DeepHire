import net from 'node:net';
import tls from 'node:tls';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_DEBUG = process.env.REDIS_DEBUG === 'true' || process.env.REDIS_DEBUG === '1';

function cacheLog(message) {
  if (REDIS_DEBUG) {
    console.log(`[redis-cache] ${message}`);
  }
}

function summarizeKey(key) {
  const text = String(key);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function encodeCommand(parts) {
  const commandParts = parts.map(part => String(part));
  const payload = [`*${commandParts.length}`];

  for (const part of commandParts) {
    payload.push(`$${Buffer.byteLength(part)}`);
    payload.push(part);
  }

  return `${payload.join('\r\n')}\r\n`;
}

function parseResp(buffer, offset = 0) {
  if (offset >= buffer.length) return null;

  const prefix = buffer[offset];
  const lineEnd = buffer.indexOf('\r\n', offset, 'utf8');
  if (lineEnd === -1) {
    return null;
  }

  if (prefix === 43) {
    return {
      value: buffer.toString('utf8', offset + 1, lineEnd),
      offset: lineEnd + 2,
    };
  }

  if (prefix === 45) {
    const message = buffer.toString('utf8', offset + 1, lineEnd);
    throw new Error(message);
  }

  if (prefix === 58) {
    return {
      value: Number(buffer.toString('utf8', offset + 1, lineEnd)),
      offset: lineEnd + 2,
    };
  }

  if (prefix === 36) {
    const bulkLength = Number(buffer.toString('utf8', offset + 1, lineEnd));
    if (bulkLength === -1) {
      return { value: null, offset: lineEnd + 2 };
    }

    const valueStart = lineEnd + 2;
    const valueEnd = valueStart + bulkLength;
    if (buffer.length < valueEnd + 2) {
      return null;
    }

    return {
      value: buffer.toString('utf8', valueStart, valueEnd),
      offset: valueEnd + 2,
    };
  }

  if (prefix === 42) {
    const itemCount = Number(buffer.toString('utf8', offset + 1, lineEnd));
    let currentOffset = lineEnd + 2;
    const values = [];

    for (let index = 0; index < itemCount; index += 1) {
      const parsed = parseResp(buffer, currentOffset);
      if (!parsed) {
        return null;
      }
      values.push(parsed.value);
      currentOffset = parsed.offset;
    }

    return { value: values, offset: currentOffset };
  }

  return null;
}

async function sendRedisCommand(commandParts) {
  if (!REDIS_URL) {
    return null;
  }

  const url = new URL(REDIS_URL);
  const isTls = url.protocol === 'rediss:';
  const port = Number(url.port || (isTls ? 6380 : 6379));
  const host = url.hostname;
  const password = url.password || '';
  const username = url.username || '';
  const database = url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : null;

  const socket = await new Promise((resolve, reject) => {
    const connection = isTls
      ? tls.connect({ host, port, servername: host, rejectUnauthorized: false })
      : net.createConnection({ host, port });

    connection.once('connect', () => resolve(connection));
    connection.once('error', reject);
  });

  let buffer = Buffer.alloc(0);

  const readReply = async () => new Promise((resolve, reject) => {
    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
    };

    const tryParse = () => {
      try {
        const parsed = parseResp(buffer, 0);
        if (!parsed) {
          return false;
        }

        buffer = buffer.slice(parsed.offset);
        cleanup();
        resolve(parsed.value);
        return true;
      } catch (error) {
        cleanup();
        reject(error);
        return true;
      }
    };

    const onData = chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      tryParse();
    };

    const onError = error => {
      cleanup();
      reject(error);
    };

    socket.on('data', onData);
    socket.once('error', onError);
    tryParse();
  });

  const writeAndRead = async (parts) => {
    socket.write(encodeCommand(parts));
    return readReply();
  };

  try {
    if (password) {
      if (username) {
        await writeAndRead(['AUTH', username, password]);
      } else {
        await writeAndRead(['AUTH', password]);
      }
    }

    if (database !== null && Number.isFinite(database)) {
      await writeAndRead(['SELECT', database]);
    }

    return await writeAndRead(commandParts);
  } finally {
    socket.end();
  }
}

async function redisGet(key) {
  return sendRedisCommand(['GET', key]);
}

async function redisSetEx(key, ttlSeconds, value) {
  return sendRedisCommand(['SET', key, value, 'EX', String(ttlSeconds)]);
}

async function redisIncr(key) {
  return sendRedisCommand(['INCR', key]);
}

export async function getCachedJson(key, ttlSeconds, loader) {
  if (!REDIS_URL) {
    cacheLog(`disabled -> loader for ${summarizeKey(key)}`);
    return loader();
  }

  try {
    const cachedValue = await redisGet(key);
    if (cachedValue) {
      cacheLog(`hit ${summarizeKey(key)}`);
      return JSON.parse(cachedValue);
    }
    cacheLog(`miss ${summarizeKey(key)}`);
  } catch (error) {
    console.error('Redis cache read failed:', error);
  }

  const value = await loader();

  try {
    await redisSetEx(key, ttlSeconds, JSON.stringify(value));
    cacheLog(`write ${summarizeKey(key)} ttl=${ttlSeconds}`);
  } catch (error) {
    console.error('Redis cache write failed:', error);
  }

  return value;
}

export async function bumpCacheVersion(key) {
  if (!REDIS_URL) {
    cacheLog(`version bump skipped (disabled) ${summarizeKey(key)}`);
    return null;
  }

  try {
    const version = await redisIncr(key);
    cacheLog(`version bump ${summarizeKey(key)} -> ${version}`);
    return version;
  } catch (error) {
    console.error('Redis version bump failed:', error);
    return null;
  }
}

export async function getCacheVersion(key) {
  if (!REDIS_URL) {
    cacheLog(`version read default 0 ${summarizeKey(key)}`);
    return 0;
  }

  try {
    const value = await redisGet(key);
    const version = Number(value || 0);
    cacheLog(`version read ${summarizeKey(key)} -> ${version}`);
    return version;
  } catch (error) {
    console.error('Redis version read failed:', error);
    return 0;
  }
}

export const cacheKeys = {
  profileVersion: userId => `deephire:cache:user:${userId}:profileVersion`,
  resumeVersion: userId => `deephire:cache:user:${userId}:resumeVersion`,
  githubVersion: userId => `deephire:cache:user:${userId}:githubVersion`,
  savedJobsVersion: userId => `deephire:cache:user:${userId}:savedJobsVersion`,
  myJobsVersion: userId => `deephire:cache:user:${userId}:myJobsVersion`,
  jobsVersion: () => 'deephire:cache:jobs:version',
  userInfo: (userId, profileVersion, githubVersion) => `deephire:cache:user:${userId}:userinfo:pv${profileVersion}:gv${githubVersion}`,
  dashboardData: (userId, resumeVersion) => `deephire:cache:user:${userId}:dashboarddata:rv${resumeVersion}`,
  githubData: (userId, githubVersion) => `deephire:cache:user:${userId}:githubdata:gv${githubVersion}`,
  savedJobs: (userId, version, jobId = '') => `deephire:cache:user:${userId}:savedjobs:${jobId || 'all'}:sv${version}`,
  myJobs: (userId, version) => `deephire:cache:user:${userId}:myjobs:mv${version}`,
  authMe: (userId, profileVersion) => `deephire:cache:user:${userId}:authme:pv${profileVersion}`,
  matchJobs: ({ userId, search, page, resumeVersion, jobsVersion }) =>
    `deephire:cache:matchjobs:${userId}:${Buffer.from(search || '').toString('base64url')}:p${page}:rv${resumeVersion}:jv${jobsVersion}`,
};