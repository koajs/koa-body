export default function throwableToError(e: unknown): Error {
  if (e instanceof Error) {
    return e;
  }

  const error = new Error(typeof e === 'object' ? `${JSON.stringify(e)}` : `${String(e)}`);
  error.name = typeof e;
  error.stack = undefined;

  return error;
}
