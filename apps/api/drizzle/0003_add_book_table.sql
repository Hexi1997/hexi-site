CREATE TABLE `bookmarkedPost` (
	`id` text PRIMARY KEY NOT NULL,
	`postId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
