-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MatchSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "round" INTEGER NOT NULL,
    "scoreA" INTEGER NOT NULL,
    "scoreB" INTEGER NOT NULL,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "matchId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchSet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MatchSet" ("createdAt", "id", "matchId", "round", "scoreA", "scoreB") SELECT "createdAt", "id", "matchId", "round", "scoreA", "scoreB" FROM "MatchSet";
DROP TABLE "MatchSet";
ALTER TABLE "new_MatchSet" RENAME TO "MatchSet";
CREATE UNIQUE INDEX "MatchSet_matchId_round_key" ON "MatchSet"("matchId", "round");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
