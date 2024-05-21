import { z } from 'zod';
import { generateStructured } from './generateStructured';

const personaSchema = z.object({
  Persona: z.object({
    Name: z.string(),
    Age: z.string(),
    Gender: z.string(),
    Occupation: z.string(),
    Education: z.string(),
    IncomeLevel: z.string(),
    Location: z.string(),
    FamilyStatus: z.string()
  }),
  Psychographics: z.object({
    PersonalityTraits: z.string(),
    Values: z.string(),
    Interests: z.string()
  }),
  Environment: z.object({
    Physical: z.string(),
    Social: z.string()
  }),
  BehavioralPatterns: z.object({
    DailyRoutines: z.string(),
    TechInteraction: z.string()
  }),
  NeedsAndChallenges: z.object({
    Needs: z.string(),
    Challenges: z.string()
  }),
  UsageContext: z.object({
    ProductUse: z.string(),
    UseInfluencers: z.string()
  }),
  TechnologyProficiency: z.object({
    ComfortLevel: z.string(),
    PreferredDevices: z.string()
  }),
  InformationConsumption: z.object({
    PreferredSources: z.string(),
    MediaConsumption: z.string()
  }),
  AdditionalMetadata: z.record(z.string(), z.string())
});
export type Persona = z.infer<typeof personaSchema>;

const personaListSchema = z.object({
  personas: z.array(personaSchema)
});

export async function generatePersonas(context: string) {
  return generateStructured(personaListSchema, [
    {
      role: 'user',
      content: `Generate a 3 distinct, representative personas that have different challenges relevant to the following context: ${context}`
    }
  ]);
}

export async function editPersonas(personas: Persona[], directions: string) {
  const content = `Edit the following personas based on the directions. Feel free to add additional personas if needed.

PERSONAS: """
${JSON.stringify(personas, null, 2)}
"""

DIRECTIONS: """
${directions}
"""`;

  return generateStructured(personaListSchema, [
    {
      role: 'user',
      content
    }
  ]);
}
