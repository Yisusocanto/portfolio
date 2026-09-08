import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projectCollection = defineCollection({
	loader: glob({
		pattern: "**/[^_]*.{md,mdx}",
		base: "./src/content/projects",
	}),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			github: z.string().optional(),
			techs: z.array(z.string()),
			live: z.string().optional(),
			imageUrl: image(),
			type: z.string(),
			year: z.string(),
			category: z.enum(["work", "project"]).default("project"),
			isOpenSource: z.boolean().default(false),
		}),
});

export const collections = { projects: projectCollection };
