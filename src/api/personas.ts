import { z } from 'zod';
import { generateStructured } from './generateStructured';

const personaSchema = z.object({
  // PersonaSummary: z.object({
  //   Summary: z.string()
  // }),
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

export const mockPersonas: Persona[] = [
  {
    Persona: {
      Name: 'Maria Rodriguez',
      Age: 35,
      Gender: 'Female',
      Occupation: 'Retail Associate',
      Education: 'High School Diploma',
      IncomeLevel: 'Low Income',
      Location: 'Urban Area',
      FamilyStatus: 'Single Mother'
    },
    Psychographics: {
      PersonalityTraits: ['Hardworking', 'Resilient', 'Caring'],
      Values: ['Family', 'Health', 'Convenience'],
      Interests: ['Cooking', 'Savings', 'Childcare']
    },
    Environment: {
      Physical: 'Small apartment with basic kitchen facilities',
      Social: 'Limited social support system'
    },
    BehavioralPatterns: {
      DailyRoutines: [
        'Work long hours',
        'Pick up child from daycare',
        'Cook quick meals'
      ],
      TechInteraction: [
        'Uses smartphone for recipes',
        'Limited access to computers'
      ]
    },
    NeedsAndChallenges: {
      Needs: ['Affordable meal options', 'Convenient cooking solutions'],
      Challenges: ['Limited time for meal preparation', 'Budget constraints']
    },
    UsageContext: {
      ProductUse: 'Meal kits as a convenient and affordable dinner option',
      UseInfluencers: ['Online reviews', 'Recommendations from friends']
    },
    TechnologyProficiency: {
      ComfortLevel: 'Medium',
      PreferredDevices: ['Smartphone']
    },
    InformationConsumption: {
      PreferredSources: ['Social media', 'Recipe websites'],
      MediaConsumption: ['Occasional TV cooking shows']
    },
    AdditionalMetadata: {}
  },
  {
    Persona: {
      Name: 'John Thompson',
      Age: 42,
      Gender: 'Male',
      Occupation: 'Delivery Driver',
      Education: 'Some College',
      IncomeLevel: 'Low Income',
      Location: 'Suburban Area',
      FamilyStatus: 'Married with 3 children'
    },
    Psychographics: {
      PersonalityTraits: ['Practical', 'Resourceful', 'Loyal'],
      Values: ['Family', 'Financial stability', 'Efficiency'],
      Interests: ['Outdoor activities', 'DIY projects', 'Budgeting']
    },
    Environment: {
      Physical: 'Single-family home with a small backyard',
      Social: 'Active community involvement'
    },
    BehavioralPatterns: {
      DailyRoutines: [
        'Early morning deliveries',
        'Family dinner time',
        'DIY projects on weekends'
      ],
      TechInteraction: [
        'Basic smartphone usage for work',
        'Limited social media presence'
      ]
    },
    NeedsAndChallenges: {
      Needs: [
        'Affordable and nutritious meals for family',
        'Time-saving cooking solutions'
      ],
      Challenges: ['Limited cooking skills', 'Long work hours']
    },
    UsageContext: {
      ProductUse: 'Meal kits as a convenient solution for family meals',
      UseInfluencers: [
        'Advertisements on delivery routes',
        'Recommendations from coworkers'
      ]
    },
    TechnologyProficiency: {
      ComfortLevel: 'Low',
      PreferredDevices: ['Basic cellphone']
    },
    InformationConsumption: {
      PreferredSources: ['Company newsletters', 'Local newspapers'],
      MediaConsumption: ['News radio during driving']
    },
    AdditionalMetadata: {}
  },
  {
    Persona: {
      Name: 'Linda Chen',
      Age: 28,
      Gender: 'Female',
      Occupation: 'Freelance Graphic Designer',
      Education: "Bachelor's Degree in Design",
      IncomeLevel: 'Low Income',
      Location: 'Urban Area',
      FamilyStatus: 'Single'
    },
    Psychographics: {
      PersonalityTraits: ['Creative', 'Adventurous', 'Independent'],
      Values: ['Creativity', 'Health', 'Financial independence'],
      Interests: ['Art and design', 'Healthy living', 'Budget travel']
    },
    Environment: {
      Physical: 'Studio apartment with a small kitchenette',
      Social: 'Active in creative community'
    },
    BehavioralPatterns: {
      DailyRoutines: [
        'Flexible work hours',
        'Attends art events',
        'Experimental cooking'
      ],
      TechInteraction: [
        'Uses multiple devices for work and leisure',
        'Active on social media'
      ]
    },
    NeedsAndChallenges: {
      Needs: [
        'Healthy and inspiring meal options',
        'Convenient cooking solutions'
      ],
      Challenges: ['Irregular income', 'Limited kitchen space']
    },
    UsageContext: {
      ProductUse: 'Meal kits for creative and healthy cooking options',
      UseInfluencers: ['Food blogs', 'Online reviews']
    },
    TechnologyProficiency: {
      ComfortLevel: 'High',
      PreferredDevices: ['Laptop', 'Tablet', 'Smartphone']
    },
    InformationConsumption: {
      PreferredSources: ['Blogs', 'Online magazines'],
      MediaConsumption: ['Documentaries on food and travel']
    },
    AdditionalMetadata: {}
  }
];
