export type QuestionType =
	| 'single_choice'
	| 'multiple_choice'
	| 'short_text'
	| 'long_text'
	| 'scale';

export interface DependsOn {
	questionId: string;
	value: string;
}

export interface Question {
	id: string;
	category: 'warm_up' | 'early_problem' | 'branching_choice' | string;
	text: string;
	type: QuestionType;
	options?: string[];
	dependsOn?: DependsOn;
}

export const STORY_QUESTIONS: Question[] = [
	{
		id: 'q1-where-are-you',
		category: 'warm_up',
		text: 'It is lunch time on campus. Where are you right now?',
		type: 'single_choice',
		options: ['Dorm', 'Library', 'Classroom building', 'Student center', 'Outside']
	},
	{
		id: 'q2-what-matters-most',
		category: 'warm_up',
		text: 'What matters most for your next meal?',
		type: 'single_choice',
		options: ['Price', 'Speed', 'Healthy options', 'Taste', 'Convenience']
	},
	{
		id: 'q3-how-do-you-decide',
		category: 'early_problem',
		text: 'How do you usually decide what to eat on campus?',
		type: 'single_choice',
		options: [
			'Walk around and check lines',
			'Ask friends',
			'Use a delivery app',
			'Go to the same place every time'
		]
	},
	{
		id: 'q4-delivery-scroll-time',
		category: 'branching_choice',
		text: 'When you use a delivery app, do you spend a long time scrolling before choosing?',
		type: 'single_choice',
		options: ['Yes, often', 'Sometimes', 'No, I decide quickly'],
		dependsOn: {
			questionId: 'q3-how-do-you-decide',
			value: 'Use a delivery app'
		}
	},
	{
		id: 'q5-repeat-place-reason',
		category: 'branching_choice',
		text: 'If you go to the same place every time, what is the main reason?',
		type: 'single_choice',
		options: ['Reliable timing', 'Predictable price', 'No better options nearby', 'Less decision stress'],
		dependsOn: {
			questionId: 'q3-how-do-you-decide',
			value: 'Go to the same place every time'
		}
	},
	{
		id: 'q6-frustration-note',
		category: 'early_problem',
		text: 'What is the most frustrating part of choosing food on campus?',
		type: 'short_text'
	}
];

export interface SceneQuestion {
	id: string;
	text: string;
	type: 'single_choice' | 'multiple_choice' | 'scale' | 'short_text';
	options?: string[];
}

export const SCENE_QUESTION_MAP: {
	warm_up: SceneQuestion[];
	scene_1_context: SceneQuestion[];
	scene_2_problem: SceneQuestion[];
	scene_3_delivery: SceneQuestion[];
	scene_3_home: SceneQuestion[];
	scene_3_dining: SceneQuestion[];
	scene_4_solution: SceneQuestion[];
} = {
	warm_up: [
		{
			id: 'wu-1-mindset',
			text: "What best describes your mindset at that moment?",
			type: 'short_text'
		},
		{
			id: 'wu-2-before',
			text: "What was happening right before this moment?",
			type: 'short_text'
		},
		{
			id: 'wu-3-what-were-you-trying',
			text: "What were you trying to accomplish in your last experience?",
			type: 'short_text'
		},
		{
			id: 'wu-4-familiarity',
			text: "How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?",
			type: 'short_text'
		},
        
	],
	scene_1_context: [
		{
			id: 's1-1-mindset',
			text: "What best describes your mindset at that moment?",
			type: 'short_text'
		},
		{
			id: 's1-2-before',
			text: "What was happening right before this moment?",
			type: 'short_text'
		},
		{
			id: 's1-3-what-were-you-trying',
			text: "What were you trying to accomplish in your last experience?",
			type: 'short_text'
		},
		{
			id: 's1-4-familiarity',
			text: "How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?",
			type: 'short_text'
		},
        
	],
	scene_2_problem: [
		{
			id: 's2-1-what-made-it-difficult',
			text: "What made it more difficult for you to accomplish what you wanted?",
			type: 'short_text'
		},
		{
			id: 's2-2-where-did-it-start',
			text: "Where did this experience begin to feel inconvenient or problematic?",
			type: 'short_text'
		},
		{
			id: 's2-3-most-frustrating',
			text: "What was most frustrating about this experience?",
			type: 'short_text'
		},
		{
			id: 's2-4-mindset',
			text: "What best describes your mindset at that moment?",
			type: 'short_text'
		},
		{
			id: 's2-5-familiarity',
			text: "How familiar does this visualized image feel to your experience? What stands out as similar and what stands out as different from your experience?",
			type: 'short_text'
		},
        
	],
	scene_3_delivery: [
		{
			id: 's3-1-better-what',
			text: "Was there something that made this situation better for you? What was it, or what could it have been?",
			type: 'short_text'
		},
		{
			id: 's3-2-familiarity-solution',
			text: "How familiar does this visualized image feel to your experience? How well would this solution address your problem?",
			type: 'short_text'
		},
		{
			id: 's3-3-alternatives',
			text: "What alternatives would you consider for addressing the problem?",
			type: 'short_text'
		},
		{
			id: 's3-4-needed-info',
			text: "What information would you need before you felt you could address this problem?",
			type: 'short_text'
		},
		{
			id: 's3-5-what-else-change',
			text: "What else would you change in order for you to better accomplish what you want?",
			type: 'short_text'
		},
        
	],
	scene_3_home: [
		{
			id: 's3h-1-better-what',
			text: "Was there something that made this situation better for you? What was it, or what could it have been?",
			type: 'short_text'
		},
		{
			id: 's3h-2-familiarity-solution',
			text: "How familiar does this visualized image feel to your experience? How well would this solution address your problem?",
			type: 'short_text'
		},
		{
			id: 's3h-3-alternatives',
			text: "What alternatives would you consider for addressing the problem?",
			type: 'short_text'
		},
		{
			id: 's3h-4-needed-info',
			text: "What information would you need before you felt you could address this problem?",
			type: 'short_text'
		},
		{
			id: 's3h-5-what-else-change',
			text: "What else would you change in order for you to better accomplish what you want?",
			type: 'short_text'
		},
        
	],
	scene_3_dining: [
		{
			id: 's3n-1-better-what',
			text: "Was there something that made this situation better for you? What was it, or what could it have been?",
			type: 'short_text'
		},
		{
			id: 's3n-2-familiarity-solution',
			text: "How familiar does this visualized image feel to your experience? How well would this solution address your problem?",
			type: 'short_text'
		},
		{
			id: 's3n-3-alternatives',
			text: "What alternatives would you consider for addressing the problem?",
			type: 'short_text'
		},
		{
			id: 's3n-4-needed-info',
			text: "What information would you need before you felt you could address this problem?",
			type: 'short_text'
		},
		{
			id: 's3n-5-what-else-change',
			text: "What else would you change in order for you to better accomplish what you want?",
			type: 'short_text'
		},
        
	],
	scene_4_solution: [
		{
			id: 's4-1-realism',
			text: "How realistic does this visualized image feel to your experience? What stands out as similar and different from your experience?",
			type: 'short_text'
		},
		{
			id: 's4-2-what-else-change',
			text: "What else would you change in order for you to better accomplish what you want?",
			type: 'short_text'
		},
		{
			id: 's4-3-avoid',
			text: "What do you need in order to avoid the problem in the future?",
			type: 'short_text'
		},

	]
};

export interface SceneContentSet {
	familiarity: SceneQuestion;
	mindset: SceneQuestion;
	frustration: SceneQuestion;
}

export const SCENE_CONTENT_QUESTIONS: SceneContentSet[] = [
	// Scene 0 — Context
	{
		familiarity: { id: 'sc0-familiarity', text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?', type: 'short_text' },
		mindset:     { id: 'sc0-mindset',     text: 'Briefly describe what this moment felt like for you.', type: 'short_text' },
		frustration: { id: 'sc0-frustration', text: 'What was the main thing on your mind at this moment? Write a sentence describing your specific thought or feeling at this moment.', type: 'short_text' }
	},
	// Scene 1 — Problem/Conflict
	{
		familiarity: { id: 'sc1-familiarity', text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?', type: 'short_text' },
		mindset:     { id: 'sc1-mindset',     text: 'Briefly describe what this moment felt like for you.', type: 'short_text' },
		frustration: { id: 'sc1-frustration', text: 'What was the main thing on your mind at this moment? Write a sentence describing your specific thought or feeling at this moment.', type: 'short_text' }
	},
	// Scene 2 — Action / Response
	{
		familiarity: { id: 'sc2-familiarity', text: 'How familiar does this visualized image feel to your experience? How well would this solution address your problem?', type: 'short_text' },
		mindset:     { id: 'sc2-mindset',     text: 'Briefly describe what this moment felt like for you.', type: 'short_text' },
		frustration: { id: 'sc2-frustration', text: 'What was the main thing on your mind at this moment? Write a sentence describing your specific thought or feeling at this moment.', type: 'short_text' }
	},
	// Scene 3 — Resolution
	{
		familiarity: { id: 'sc3-familiarity', text: 'How realistic does this visualized image feel to your experience? What stands out as similar and different from your experience?', type: 'short_text' },
		mindset:     { id: 'sc3-mindset',     text: 'Briefly describe what this moment felt like for you.', type: 'short_text' },
		frustration: { id: 'sc3-frustration', text: 'What was the main thing on your mind at this moment? Write a sentence describing your specific thought or feeling at this moment.', type: 'short_text' }
	}
];
