/*
  Warnings:

  - You are about to drop the column `rounds` on the `Match` table. All the data in the column will be lost.
  - Added the required column `roundRecordData` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scoreBoardData` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "matchDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdById" INTEGER NOT NULL,
    "refereeId" INTEGER NOT NULL,
    "roundRecordData" JSONB NOT NULL,
    "scoreBoardData" JSONB NOT NULL,
    CONSTRAINT "Match_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("createdAt", "createdById", "id", "location", "matchDate", "name", "refereeId", "status") SELECT "createdAt", "createdById", "id", "location", "matchDate", "name", "refereeId", "status" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
