CREATE TABLE `game_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`game` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text NOT NULL,
	`completed` integer NOT NULL,
	`wrong` integer NOT NULL,
	`premature` integer NOT NULL,
	`hints` integer NOT NULL,
	`retries` integer NOT NULL,
	`pauses` integer NOT NULL,
	`difficulty` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `record_meta` (
	`id` integer PRIMARY KEY NOT NULL,
	`epoch` integer NOT NULL
);
