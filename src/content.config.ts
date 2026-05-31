import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projectCollection = defineCollection({
	loader: glob({
		pattern: "**/[^_]*.{md,mdx}",
		base: "./src/content/projects",
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		github: z.url(),
		techs: z.array(z.string()),
		live: z.url().optional(),
		imageUrl: z.string(),
		type: z.string(),
	}),
});

export const collections = { projects: projectCollection };
