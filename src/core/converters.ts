export function toFunction<T>(anything: T): () => T {
  return () => anything;
}

export type Size = {
  kb: number;
  mb: number;
  gb: number;
  tb: number;
};

const SIZE_REPRESENTATION = {
  b: 'bytes',
  kb: 'Kb',
  mb: 'Mb',
  gb: 'Gb',
  tb: 'Tb',
};

export function toSize(bytes: number) {
  const storageUnit = 1024;
  const kb = bytes / storageUnit;
  const mb = kb / storageUnit;
  const gb = mb / storageUnit;
  const tb = gb / storageUnit;

  const results = {
    b: bytes,
    kb,
    mb,
    gb,
    tb,
  };

  const as = (name: keyof typeof results) => results[name];
  const toFriendly = (name: keyof typeof results) => {
    const size = as(name);
    const roundedSize = Math.ceil(size * 1000) / 1000;

    return `${roundedSize} ${SIZE_REPRESENTATION[name]}`;
  };

  return {
    as,
    toFriendly,
  };
}

const DURATION_REPRESENTATION = {
  ms: 'ms',
  s: 's',
  m: 'm',
  h: 'h',
};

export function toDuration(durationMs: number) {
  const s = durationMs / 1000;
  const m = s / 60;
  const h = m / 60;

  const results = {
    ms: durationMs,
    s,
    m,
    h,
  };

  const as = (name: keyof typeof results) => results[name];
  const toFriendly = (name: keyof typeof results) => {
    const size = as(name);
    const roundedSize = Math.ceil(size * 1000) / 1000;

    return `${roundedSize} ${DURATION_REPRESENTATION[name]}`;
  };

  return {
    as,
    toFriendly,
  };
}
