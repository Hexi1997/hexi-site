CREATE TABLE `broadcastImageUpload` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`objectKey` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `broadcastImageUpload_user_createdAt_idx` ON `broadcastImageUpload` (`userId`,`createdAt`);
