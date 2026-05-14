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
			id: 'wu-1-campus-location',
			text: 'Where on campus are you when deciding what to eat?',
			type: 'single_choice',
			options: ['Dorm', 'Library', 'Classroom building', 'Student center', 'Outside']
		},
		{
			id: 'wu-2-priority',
			text: 'What matters most right now?',
			type: 'single_choice',
			options: ['Speed', 'Price', 'Healthy option', 'Taste', 'Comfort']
		}
	],
	scene_1_context: [
		{
			id: 's1-1-hunger-level',
			text: 'How hungry would you be?',
			type: 'scale',
			options: ['1', '2', '3', '4', '5']
		},
		{
			id: 's1-2-first-option',
			text: 'What is the first option that comes to mind?',
			type: 'single_choice',
			options: ['Dining hall', 'Delivery app', 'Cook at home', 'Snack and wait']
		},
		{
			id: 's1-3-context-detail',
			text: 'Describe your situation in one line (time pressure, weather, mood, etc.).',
			type: 'short_text'
		}
	],
	scene_2_problem: [
		{
			id: 's2-1-easiest-option',
			text: 'Which option feels easiest?',
			type: 'single_choice',
			options: ['Dining hall', 'Delivery app', 'Cook at home', 'Cafe/grab-and-go']
		},
		{
			id: 's2-2-biggest-friction',
			text: 'What is the biggest friction point right now?',
			type: 'multiple_choice',
			options: [
				'Long lines',
				'High prices',
				'Too many choices',
				'Unclear wait times',
				'Not enough healthy options'
			]
		},
		{
			id: 's2-3-problem-note',
			text: 'What makes this decision stressful?',
			type: 'short_text'
		}
	],
	scene_3_delivery: [
		{
			id: 's3d-1-scroll-time',
			text: 'If you open a delivery app, how long do you usually scroll?',
			type: 'single_choice',
			options: ['Under 2 minutes', '2-5 minutes', '5-10 minutes', 'Over 10 minutes']
		},
		{
			id: 's3d-2-order-driver',
			text: 'What finally pushes you to place an order?',
			type: 'single_choice',
			options: ['Discount', 'Fast ETA', 'Familiar restaurant', 'Friend recommendation']
		},
		{
			id: 's3-ideal-fix',
			text: 'What would an ideal solution look like for this moment?',
			type: 'short_text'
		},
		{
			id: 's3-must-have-feature',
			text: 'Which feature would help most?',
			type: 'single_choice',
			options: [
				'Real-time line/wait prediction',
				'Personalized meal recommendations',
				'Budget + nutrition filter',
				'Faster checkout/order flow'
			]
		}
	],
	scene_3_home: [
		{
			id: 's3h-1-home-choice',
			text: 'If you decide to eat at home, what do you do?',
			type: 'single_choice',
			options: ['Cook quickly', 'Heat leftovers', 'Skip meal', 'Snack only']
		},
		{
			id: 's3h-2-home-feeling',
			text: 'How do you feel about that choice?',
			type: 'short_text'
		},
		{
			id: 's3-ideal-fix',
			text: 'What would an ideal solution look like for this moment?',
			type: 'short_text'
		},
		{
			id: 's3-must-have-feature',
			text: 'Which feature would help most?',
			type: 'single_choice',
			options: [
				'Real-time line/wait prediction',
				'Personalized meal recommendations',
				'Budget + nutrition filter',
				'Faster checkout/order flow'
			]
		}
	],
	scene_3_dining: [
		{
			id: 's3n-1-dining-experience',
			text: 'If you go to the dining hall, what usually happens?',
			type: 'multiple_choice',
			options: [
				'Line is long',
				'Food is okay but repetitive',
				'I find something quickly',
				'I leave and choose something else'
			]
		},
		{
			id: 's3n-2-dining-satisfaction',
			text: 'How satisfied are you after choosing the dining hall?',
			type: 'scale',
			options: ['1', '2', '3', '4', '5']
		},
		{
			id: 's3-ideal-fix',
			text: 'What would an ideal solution look like for this moment?',
			type: 'short_text'
		},
		{
			id: 's3-must-have-feature',
			text: 'Which feature would help most?',
			type: 'single_choice',
			options: [
				'Real-time line/wait prediction',
				'Personalized meal recommendations',
				'Budget + nutrition filter',
				'Faster checkout/order flow'
			]
		}
	],
	scene_4_solution: [
		{
			id: 's4-reflection',
			text: 'Looking at this solution, how confident are you that this would improve your daily campus food decisions?',
			type: 'scale',
			options: ['1', '2', '3', '4', '5']
		}
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
		familiarity: { id: 'sc0-familiarity', text: 'How familiar does this situation feel to you? What would make it feel more realistic for you?', type: 'short_text' },
		mindset:     { id: 'sc0-mindset',     text: 'How would you describe the environment around you when this happens? What\'s your mood in this moment?',  type: 'short_text' },
		frustration: { id: 'sc0-frustration', text: 'What\'s on your mind at this moment in this situation?',   type: 'short_text' }
	},
	// Scene 1 — Problem/Conflict
	{
		familiarity: { id: 'sc1-familiarity', text: 'How familiar does this situation feel to you? What would make it feel more realistic for you?', type: 'short_text' },
		mindset:     { id: 'sc1-mindset',     text: 'What\'s on your mind at this moment in this situation?', type: 'short_text' },
		frustration: { id: 'sc1-frustration', text: 'When does this start to feel problematic? What part makes it most frustrating or worse?', type: 'short_text' }
	},
	// Scene 2 — Action / Response
	{
		familiarity: { id: 'sc2-familiarity', text: 'What would make this situation feel more realistic for you?', type: 'short_text' },
		mindset:     { id: 'sc2-mindset',     text: 'What best describes your mindset right now?', type: 'short_text' },
		frustration: { id: 'sc2-frustration', text: 'What part of this situation feels like progress? What would make it even better?', type: 'short_text' }
	},
	// Scene 3 — Resolution
	{
		familiarity: { id: 'sc3-familiarity', text: 'What would make this outcome feel more realistic for you?', type: 'short_text' },
		mindset:     { id: 'sc3-mindset',     text: 'How do you feel about how this situation was resolved?', type: 'short_text' },
		frustration: { id: 'sc3-frustration', text: 'What part of this feels like a good solution? What could make it even better?', type: 'short_text' }
	}
];
