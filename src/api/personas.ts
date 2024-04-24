import { z } from 'zod';
import { generateStructured } from './generateStructured';

const personaSchema = z.object({
  Persona: z.object({
    Name: z.string(),
    Age: z.number().min(0),
    Gender: z.string(),
    Occupation: z.string(),
    Education: z.string(),
    IncomeLevel: z.string(),
    Location: z.string(),
    FamilyStatus: z.string()
  }),
  Psychographics: z.object({
    PersonalityTraits: z.array(z.string()),
    Values: z.array(z.string()),
    Interests: z.array(z.string())
  }),
  Environment: z.object({
    Physical: z.string(),
    Social: z.string()
  }),
  BehavioralPatterns: z.object({
    DailyRoutines: z.array(z.string()),
    TechInteraction: z.array(z.string())
  }),
  NeedsAndChallenges: z.object({
    Needs: z.array(z.string()),
    Challenges: z.array(z.string())
  }),
  UsageContext: z.object({
    ProductUse: z.string(),
    UseInfluencers: z.array(z.string())
  }),
  TechnologyProficiency: z.object({
    ComfortLevel: z.enum(['Low', 'Medium', 'High']),
    PreferredDevices: z.array(z.string())
  }),
  InformationConsumption: z.object({
    PreferredSources: z.array(z.string()),
    MediaConsumption: z.array(z.string())
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
      content: `Generate a list of personas relevant to the following context: ${context}`
    }
  ]);
}

export async function editPersonas(personas: Persona[], directions: string) {
  const content = `Edit the following personas based on the directions.

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
