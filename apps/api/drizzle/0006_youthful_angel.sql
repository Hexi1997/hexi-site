CREATE TABLE `broadcastLike` (
	`id` text PRIMARY KEY NOT NULL,
	`postId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`postId`) REFERENCES `broadcastPost`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `broadcastLike_post_user_unique` ON `broadcastLike` (`postId`,`userId`);--> statement-breakpoint
CREATE TABLE `broadcastPost` (
	`id` text PRIMARY KEY NOT NULL,
	`parentId` text,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
