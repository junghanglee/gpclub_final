export const PUBLIC_DATA_TIMEOUT_MS = 7000;

type CacheEntry<T> = {
  value?: T;
  promise?: Promise<T>;
  expiresAt: number;
};

const publicDataCache = new Map<string, CacheEntry<unknown>>();

export function readPublicDataCache<T>(key: string): T | undefined {
  const entry = publicDataCache.get(key) as CacheEntry<T> | undefined;
  if (!entry || entry.expiresAt <= Date.now()) {
    publicDataCache.delete(key);
    return undefined;
  }
  return entry.value;
}

export function fetchCachedPublicData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttlMs?: number } = {},
) {
  const ttlMs = options.ttlMs ?? 5 * 60 * 1000;
  const now = Date.now();
  const cached = publicDataCache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    if (cached.value !== undefined) return Promise.resolve(cached.value);
    if (cached.promise) return cached.promise;
  }

  const promise = fetcher().then(
    (value) => {
      publicDataCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    },
    (error) => {
      publicDataCache.delete(key);
      throw error;
    },
  );

  publicDataCache.set(key, { promise, expiresAt: now + ttlMs });
  return promise;
}

export function withPublicDataTimeout<T>(
  request: PromiseLike<T>,
  label: string,
  timeoutMs = PUBLIC_DATA_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    Promise.resolve(request).then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      },
    );
  });
}
