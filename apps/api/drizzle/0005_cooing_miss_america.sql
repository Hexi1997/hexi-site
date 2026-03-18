CREATE TABLE `comment` (
	`id` text PRIMARY KEY NOT NULL,
	`postSlug` text NOT NULL,
	`parentId` text,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
