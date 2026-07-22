-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_name_key" ON "Member"("name");

-- 既存タスクに入力済みの担当者名・起票者名を初期メンバーとして登録する
INSERT INTO "Member" ("id", "name", "sortOrder")
SELECT gen_random_uuid()::text, t.name, (row_number() OVER (ORDER BY t.name)) - 1
FROM (
    SELECT "assignee" AS name FROM "Task" WHERE "assignee" <> ''
    UNION
    SELECT "createdBy" FROM "Task" WHERE "createdBy" <> ''
) t;
