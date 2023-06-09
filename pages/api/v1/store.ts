import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { generateId } from "pkg/id";
import redisConfig from "../../../pkg/config";

type Request = {
  encrypted: string;
  ttl?: number;
  reads: number;
  iv: string;
};

const redis = new Redis(redisConfig);
export default async function handler(req: NextRequest) {
  const { encrypted, ttl, reads, iv } = (await req.json()) as Request;

  const id = generateId();
  const key = ["kankyou", id].join(":");

  const tx = redis.multi();

  tx.hset(key, {
    remainingReads: reads > 0 ? reads : null,
    encrypted,
    iv,
  });
  if (ttl) {
    tx.expire(key, ttl);
  }
  tx.incr("kankyou:metrics:writes");

  await tx.exec();

  return NextResponse.json({ id });
}

export const config = {
  runtime: "edge",
};
