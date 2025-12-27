"use server"

import { prisma } from "@/lib/prisma"

export async function getUserUploadsSummary(userId: string, pageSize: number) {
  const [uploads, total, styles, collections] = await Promise.all([
    prisma.userUpload.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      select: {
        id: true,
        url: true,
        prompt: true,
        style: true,
        tags: true,
        favorite: true,
        createdAt: true,
        collection: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.userUpload.count({ where: { userId } }),
    prisma.userUpload.findMany({
      where: { userId, style: { not: null } },
      distinct: ["style"],
      select: { style: true },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ])

  return {
    uploads,
    total,
    styles: styles.map((item) => item.style ?? "").filter(Boolean),
    collections,
  }
}
