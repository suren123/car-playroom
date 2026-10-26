import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const gameRounds=sqliteTable('game_rounds',{
 id:text('id').primaryKey(),game:text('game').notNull(),startedAt:text('started_at').notNull(),endedAt:text('ended_at').notNull(),
 completed:integer('completed').notNull(),wrong:integer('wrong').notNull(),premature:integer('premature').notNull(),
 hints:integer('hints').notNull(),retries:integer('retries').notNull(),pauses:integer('pauses').notNull(),difficulty:text('difficulty').notNull(),
});
export const recordMeta=sqliteTable('record_meta',{id:integer('id').primaryKey(),epoch:integer('epoch').notNull()});
