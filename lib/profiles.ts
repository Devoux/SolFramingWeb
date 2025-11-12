import type { Dirent } from 'node:fs';
import { promises as fs, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z, type ZodIssue } from 'zod';

export type ProfileSummary = {
  slug: string;
  name: string;
  title: string;
  description: string;
  heroColor: string;
  thumbnail: string;
};

const PROFILE_SUMMARIES: ProfileSummary[] = [
  {
    slug: 'aurora-lee',
    name: 'Aurora Lee',
    title: 'Mixed Media Visionary',
    description: 'Aurora blends analog textures with digital gradients to create immersive dreamscapes.',
    heroColor: 'from-purple-400 via-fuchsia-500 to-orange-300',
    thumbnail: 'https://images.unsplash.com/photo-1526481280695-3c4693fcf66d?auto=format&fit=crop&w=640&q=80'
  },
  {
    slug: 'marco-fernandez',
    name: 'Marco Fernandez',
    title: 'Minimalist Photographer',
    description: 'Marco captures architectural silhouettes and the interplay of sunlight across modern cities.',
    heroColor: 'from-sky-400 via-primary-500 to-emerald-300',
    thumbnail: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=640&q=80'
  },
  {
    slug: 'sylvie-park',
    name: 'Sylvie Park',
    title: 'Ceramic Storyteller',
    description: 'Sylvie sculpts tactile narratives that celebrate organic textures and ancient motifs.',
    heroColor: 'from-amber-300 via-rose-300 to-primary-500',
    thumbnail: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=640&q=80'
  }
];

export async function listProfiles(): Promise<ProfileSummary[]> {
  return PROFILE_SUMMARIES;
}

export async function getProfile(slug: string): Promise<ProfileSummary | undefined> {
  return PROFILE_SUMMARIES.find((profile) => profile.slug === slug);
}

const unitsSchema = z.enum(['mm', 'cm', 'm', 'in', 'ft']);

const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

const segmentMetadataSchema = z.record(z.string(), z.unknown()).optional();

const lineCommandSchema = z.object({
  type: z.literal('line'),
  to: pointSchema,
  metadata: segmentMetadataSchema
});

const arcCommandSchema = z.object({
  type: z.literal('arc'),
  to: pointSchema,
  radius: z.number().positive(),
  clockwise: z.boolean(),
  largeArc: z.boolean().optional(),
  metadata: segmentMetadataSchema
});

const contourElementSchema = z.discriminatedUnion('type', [lineCommandSchema, arcCommandSchema]);

const profileMetadataSchema = z
  .object({
    finish: z.string().min(1).optional(),
    notes: z.string().optional(),
    tags: z.array(z.string().min(1)).optional(),
    reference: z.string().optional()
  })
  .strict()
  .optional();

export const profileDefinitionSchema = z
  .object({
    $schema: z.string().optional(),
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    units: unitsSchema,
    version: z.string().optional(),
    dimensions: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
        depth: z.number().positive().optional()
      })
      .strict(),
    start: pointSchema.optional(),
    contour: z.array(contourElementSchema).min(1),
    metadata: profileMetadataSchema
  })
  .strict();

export type ProfileDefinition = z.infer<typeof profileDefinitionSchema>;

const DEFAULT_PROFILES_DIRECTORY = path.resolve(process.cwd(), 'data', 'profiles');
const SCHEMA_FILE_NAME = 'schema.json';

export interface ProfileLoaderOptions {
  /**
   * Directory that stores profile definition JSON files. Defaults to `data/profiles`.
   */
  directory?: string;
  /**
   * Include `schema.json` in the returned results. Normally skipped because it is not a profile definition.
   */
  includeSchema?: boolean;
}

export class ProfileValidationError extends Error {
  constructor(public readonly filePath: string, public readonly issues: ZodIssue[]) {
    super(`Invalid profile definition in ${filePath}\n${formatIssues(issues)}`);
    this.name = 'ProfileValidationError';
  }
}

export class ProfileParseError extends Error {
  constructor(public readonly filePath: string, public readonly cause: unknown) {
    super(`Failed to parse JSON in ${filePath}: ${extractMessage(cause)}`);
    this.name = 'ProfileParseError';
  }
}

export async function loadProfiles(options: ProfileLoaderOptions = {}): Promise<ProfileDefinition[]> {
  const { directory = DEFAULT_PROFILES_DIRECTORY, includeSchema = false } = options;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = filterProfileFiles(entries, includeSchema).map((entry) => path.join(directory, entry.name));
  return Promise.all(files.map((file) => readProfileFile(file)));
}

export function loadProfilesSync(options: ProfileLoaderOptions = {}): ProfileDefinition[] {
  const { directory = DEFAULT_PROFILES_DIRECTORY, includeSchema = false } = options;
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = filterProfileFiles(entries, includeSchema).map((entry) => path.join(directory, entry.name));
  return files.map((file) => readProfileFileSync(file));
}

async function readProfileFile(filePath: string): Promise<ProfileDefinition> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read profile file ${filePath}: ${(error as Error).message}`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new ProfileParseError(filePath, error);
  }

  const result = profileDefinitionSchema.safeParse(payload);
  if (!result.success) {
    throw new ProfileValidationError(filePath, result.error.issues);
  }

  return result.data;
}

function readProfileFileSync(filePath: string): ProfileDefinition {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read profile file ${filePath}: ${(error as Error).message}`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new ProfileParseError(filePath, error);
  }

  return profileDefinitionSchema.parse(payload);
}

function filterProfileFiles(entries: Dirent[], includeSchema: boolean): Dirent[] {
  return entries.filter((entry) => isProfileJson(entry, includeSchema)).sort((a, b) => a.name.localeCompare(b.name));
}

function isProfileJson(entry: Dirent, includeSchema: boolean): boolean {
  if (!entry.isFile()) {
    return false;
  }

  if (!entry.name.toLowerCase().endsWith('.json')) {
    return false;
  }

  if (!includeSchema && entry.name === SCHEMA_FILE_NAME) {
    return false;
  }

  return true;
}

function formatIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '<root>';
      return `- ${path}: ${issue.message}`;
    })
    .join('\n');
}

function extractMessage(input: unknown): string {
  return input instanceof Error ? input.message : String(input);
}
