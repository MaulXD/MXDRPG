/** Evita travar a UI quando MariaDB não responde. */
export async function withDbTimeout<T>(
  promiseOrValue: Promise<T> | T,
  ms = 5000,
  label = "mariadb"
): Promise<T> {
  const promise = Promise.resolve(promiseOrValue);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
