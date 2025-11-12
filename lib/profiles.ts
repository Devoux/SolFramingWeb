import { promises as fs } from 'node:fs';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z, type ZodIssue } from 'zod';

import type { Dirent } from 'node:fs';

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

export const profileSchema = z
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

export type Point = z.infer<typeof pointSchema>;
export type LineCommand = z.infer<typeof lineCommandSchema>;
export type ArcCommand = z.infer<typeof arcCommandSchema>;
export type ContourElement = z.infer<typeof contourElementSchema>;
export type Profile = z.infer<typeof profileSchema>;

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

export async function loadProfiles(options: ProfileLoaderOptions = {}): Promise<Profile[]> {
  const { directory = DEFAULT_PROFILES_DIRECTORY, includeSchema = false } = options;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = filterProfileFiles(entries, includeSchema).map((entry) => path.join(directory, entry.name));
  return Promise.all(files.map((file) => readProfileFile(file)));
}

export function loadProfilesSync(options: ProfileLoaderOptions = {}): Profile[] {
  const { directory = DEFAULT_PROFILES_DIRECTORY, includeSchema = false } = options;
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = filterProfileFiles(entries, includeSchema).map((entry) => path.join(directory, entry.name));
  return files.map((file) => readProfileFileSync(file));
}

async function readProfileFile(filePath: string): Promise<Profile> {
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

  const result = profileSchema.safeParse(payload);
  if (!result.success) {
    throw new ProfileValidationError(filePath, result.error.issues);
  }

  return result.data;
}

function readProfileFileSync(filePath: string): Profile {
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

  return profileSchema.parse(payload);
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
