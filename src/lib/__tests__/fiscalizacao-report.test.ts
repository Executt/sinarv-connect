import { describe, it, expect } from "vitest";
import { dataLimiteResposta, sha256Hex } from "../fiscalizacao-report";

describe("fiscalização", () => {
  it("prazo de 30 dias conta a partir da notificação", () => {
    expect(dataLimiteResposta("2026-10-01", 30)).toBe("2026-10-31");
  });
  it("sem data de notificação não há prazo", () => {
    expect(dataLimiteResposta(null, 30)).toBeNull();
  });
  it("hash SHA-256 é determinístico", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
