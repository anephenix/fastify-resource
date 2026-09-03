import Database from "better-sqlite3";
import { SQLiteQueue } from "@anephenix/job-queue";

/*
  A real job queue standing in for an email provider - jobs are enqueued
  here (see routes/auth.ts) and picked up by emailWorker.ts, which is what
  actually "sends" the email (a console.log of what would have gone out).
  Separate SQLite file from the app's own data - a self-managed queue table
  (via SQLiteQueue.migrate) shouldn't share a file with Knex-managed schema.
*/

const db = new Database(process.env.QUEUE_DB_FILE || "./data/queue.sqlite3");
SQLiteQueue.migrate(db);

export const emailQueue = new SQLiteQueue({ queueKey: "email", db });
