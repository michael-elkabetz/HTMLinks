import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { fail } from "./http";
let active = 0;
async function bounded<T>(fn: () => Promise<T>) {
  if (active >= 2)
    fail(503, "BUSY", "Password processing is busy. Try again shortly.");
  active++;
  try {
    return await fn();
  } finally {
    active--;
  }
}
export const passwordHash = (value: string) =>
  bounded(() =>
    hash(value, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
  );
export const passwordVerify = (hash: string, value: string) =>
  bounded(() => verify(hash, value));
