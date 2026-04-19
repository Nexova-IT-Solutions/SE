import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error", "warn"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export function getMoodClient() {
  try {
    const moodClient = (db as any).mood;
    if (!moodClient || typeof moodClient.findMany !== "function") {
      return null;
    }

    return moodClient as {
      findMany: (...args: any[]) => Promise<any>;
      create: (...args: any[]) => Promise<any>;
      update: (...args: any[]) => Promise<any>;
      delete: (...args: any[]) => Promise<any>;
    };
  } catch {
    return null;
  }
}