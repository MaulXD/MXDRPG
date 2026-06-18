/** Evita travar a UI quando MariaDB não responde. */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  ms = 5000,
  label = "mariadb"
): Promise<T> {
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
