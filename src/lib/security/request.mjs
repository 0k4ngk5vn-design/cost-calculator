const MAX_BODY_BYTES = 64 * 1024;

export class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorStatus(error) {
  if (error instanceof RequestError) return error.status;
  return error?.message === "UNAUTHORIZED" ? 401 : 500;
}

export function publicError(error) {
  if (error instanceof RequestError) return error.message;
  return errorStatus(error) === 401
    ? "로그인이 필요합니다."
    : "요청 처리 중 오류가 발생했습니다.";
}

export function checkOrigin(request) {
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  // Do not trust arbitrary forwarded-host headers as an allowed origin.
  const expected = new URL(request.url).origin;
  if ((site && site !== "same-origin") || (origin && origin !== expected)) {
    throw new RequestError("허용되지 않은 요청 출처입니다.", 403);
  }
  if (!origin && site !== "same-origin") {
    throw new RequestError("요청 출처를 확인할 수 없습니다.", 403);
  }
}

export async function readJson(request) {
  checkOrigin(request);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError("JSON 요청만 허용됩니다.", 415);
  }
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    throw new RequestError("요청 크기가 너무 큽니다.", 413);
  }
  if (!request.body) throw new RequestError("요청 본문이 필요합니다.");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestError("요청 크기가 너무 큽니다.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError("올바른 JSON이 아닙니다.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestError("JSON 객체가 필요합니다.");
  }
  return body;
}

function text(value, field, max = 200, optional = false) {
  if (optional && value == null) return;
  if (typeof value !== "string" || value.length > max || (!optional && !value.trim())) {
    throw new RequestError(`${field}: 올바른 문자열을 입력해주세요. (최대 ${max}자)`);
  }
}

function number(value, field, positive = false) {
  if (!(["number", "string"].includes(typeof value)) ||
      (typeof value === "string" && !/^\d+(\.\d+)?$/.test(value.trim())) ||
      !Number.isFinite(Number(value)) || Number(value) > Number.MAX_SAFE_INTEGER ||
      (positive ? Number(value) <= 0 : Number(value) < 0)) {
    throw new RequestError(`${field}: 유효한 ${positive ? "양수" : "0 이상의 수"}를 입력해주세요.`);
  }
}

export function validateId(id) {
  if (typeof id !== "string" || !/^(?:[1-9]\d{0,18}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(id)) {
    throw new RequestError("유효하지 않은 ID입니다.");
  }
}

export function validateBody(body, kind, patch = false) {
  if (kind === "category") {
    text(body.category_name, "카테고리 이름");
    text(body.category_value, "카테고리 값");
    if (!["category", "category_menu"].includes(body.unit_type)) {
      throw new RequestError("허용되지 않은 카테고리 유형입니다.");
    }
    return body;
  }
  text(body.name, "이름");
  text(body.memo, "메모", 5000, true);
  number(body.price, "가격");
  text(body.category, "카테고리");
  if (kind === "ingredients") {
    number(body.quantity, "수량", true);
    text(body.unit, "단위");
    text(body.currency, "통화");
    text(body.supplier, "공급처", 300, true);
  } else {
    number(body.amount, "수량", true);
    text(patch ? body.amount_unit : body.unit, "단위");
    text(patch ? body.currency_unit : body.currency, "통화");
    if (patch) validateId(body.id);
    if (!Array.isArray(body.ingredients) || body.ingredients.length < 1 || body.ingredients.length > 200) {
      throw new RequestError("재료는 1~200개여야 합니다.");
    }
    const ids = new Set();
    for (const item of body.ingredients) {
      if (!item || typeof item !== "object") throw new RequestError("유효하지 않은 재료입니다.");
      const id = patch ? item.ingredientId : item.ingredient_id;
      validateId(id);
      if (ids.has(id)) throw new RequestError("중복된 재료입니다.");
      ids.add(id);
      number(item.amount, "재료 수량", true);
      text(patch ? item.amount_unit || item.unit : item.amount_unit, "재료 단위");
    }
  }
  return body;
}
