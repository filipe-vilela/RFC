import { Prisma } from "@/app/generated/prisma/client";

export function isForeignKeyConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
