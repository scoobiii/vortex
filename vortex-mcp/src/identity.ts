/**
 * spec/identity.md — cryptographic identity, distinct from
 * human-readable identity ("P0 scoobiii : Agente GPT" is metadata,
 * not identity).
 */
import { generateKeyPairSync, sign as edSign, verify as edVerify, createPublicKey, KeyObject } from "node:crypto";
import { signableBytes } from "./canonicalize.js";
import type { ExecutionProof, ExecutionProofUnsigned, VortexIdentity } from "./types.js";

export interface Ed25519Keypair {
  keyId: string;
  publicKey: KeyObject;
  privateKey: KeyObject;
  publicKeyB64: string;
}

/** spec/key-discovery.md — "embedded" mechanism used by this reference impl */
export function generateKeypair(keyId: string): Ed25519Keypair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyB64 = publicKey.export({ type: "spki", format: "der" }).toString("base64");
  return { keyId, publicKey, privateKey, publicKeyB64 };
}

export function signProof(
  unsigned: ExecutionProofUnsigned,
  keypair: Ed25519Keypair,
): ExecutionProof {
  const bytes = signableBytes(unsigned);
  const signature = edSign(null, bytes, keypair.privateKey).toString("base64");
  return { ...unsigned, signature };
}

/**
 * Independent verification: reproduces JCS canonicalization + hash
 * derivation from the proof itself and checks the signature against
 * the declared public key. Does NOT trust any claim made by the
 * executor beyond what the signature covers.
 */
export function verifyProofSignature(
  proof: ExecutionProof,
  publicKeyDerB64: string,
): boolean {
  const { signature, ...unsigned } = proof;
  const bytes = signableBytes(unsigned);
  const publicKey = derB64ToKeyObject(publicKeyDerB64);
  try {
    return edVerify(null, bytes, publicKey, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

function derB64ToKeyObject(publicKeyDerB64: string): KeyObject {
  return createPublicKey({
    key: Buffer.from(publicKeyDerB64, "base64"),
    format: "der",
    type: "spki",
  });
}

export function identityOf(keypair: Ed25519Keypair, agentId: string, principalId: string): VortexIdentity {
  return {
    agent_id: agentId,
    principal_id: principalId,
    key_id: keypair.keyId,
    algorithm: "Ed25519",
    public_key: keypair.publicKeyB64,
  };
}
