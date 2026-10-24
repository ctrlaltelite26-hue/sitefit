export class QlooHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string, readonly path: string) {
    super(message);
    this.name = "QlooHttpError";
    this.status = status;
  }
}

export class QlooConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QlooConfigError";
  }
}

export function errorForStatus(status: number, path: string): QlooHttpError | null {
  if (status === 400) return new QlooHttpError(400, "Qloo rejected the query (400).", path);
  if (status === 401) return new QlooHttpError(401, "Qloo unauthorized (401). Check host and X-Api-Key.", path);
  if (status === 403) return new QlooHttpError(403, "Qloo forbidden (403). That type or path is not allowed.", path);
  if (status === 429 || status >= 500) return null;
  if (status >= 400) return new QlooHttpError(status, `Qloo request failed (${status}).`, path);
  return null;
}
