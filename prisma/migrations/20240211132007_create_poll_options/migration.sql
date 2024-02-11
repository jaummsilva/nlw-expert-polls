-- CreateTable
CREATE TABLE "polls_options" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,

    CONSTRAINT "polls_options_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "polls_options" ADD CONSTRAINT "polls_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
