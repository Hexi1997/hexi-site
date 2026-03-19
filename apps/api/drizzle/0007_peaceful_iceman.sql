CREATE TABLE `broadcastPostImage` (
	`id` text PRIMARY KEY NOT NULL,
	`postId` text NOT NULL,
	`imageUrl` text NOT NULL,
	`sortOrder` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`postId`) REFERENCES `broadcastPost`(`id`) ON UPDATE no action ON DELETE no action
);
