import { z } from 'zod';

/**
 * Zod schema for validating race configuration files
 */

const HorseStatsSchema = z.object({
  speed: z.number().min(0).max(1),
  stamina: z.number().min(0).max(1),
  acceleration: z.number().min(0).max(1),
});

const HatTypeSchema = z.enum(['horse-ears', 'reindeer-antlers', 'top-hat', 'crown', 'propeller-hat']);
const FaceTypeSchema = z.enum(['happy', 'innocent', 'red-nose', 'angry', 'shocked', 'glasses']);

const HorseDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  stats: HorseStatsSchema,
  baseSpeed: z.number().min(6).max(10),
  color: z.number().int().min(0).max(0xFFFFFF),
  hat: HatTypeSchema,
  face: FaceTypeSchema,
});

export const RaceConfigSchema = z.object({
  version: z.literal('1.0'),
  raceSeed: z.number().int(),
  horses: z.array(HorseDataSchema).min(1).max(8),
});

export type RaceConfig = z.infer<typeof RaceConfigSchema>;

/**
 * Validate a race configuration object
 * @returns validation result with typed data or error
 */
export function validateRaceConfig(data: unknown): { success: true; data: RaceConfig } | { success: false; error: string; issues?: string[] } {
  try {
    const result = RaceConfigSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
        return `• ${path}: ${issue.message}`;
      });
      return {
        success: false,
        error: 'Invalid race configuration file',
        issues
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
