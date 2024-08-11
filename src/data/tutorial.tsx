import { 
    ArrowDownFromLineIcon, 
    BookImageIcon, 
    BotIcon, 
    CopyIcon, 
    HeartHandshakeIcon, 
    MessageSquareIcon, 
    Move3DIcon, 
    PencilIcon, 
    PlusIcon, 
    RefreshCwIcon, 
    ScanEyeIcon, 
    ScanSearchIcon, 
    SparklesIcon, 
    SquareStackIcon, 
    Trash2, 
    UserRoundIcon, 
    WandSparklesIcon 
} from "lucide-react"
import {
    rem,
    Text,
    Kbd,
} from '@mantine/core';

export interface TutorialItem {    
    title: string,
    url: string,
    left_section: any,
    right_section: any,
}

export interface tutorialMenuItem {
    [key: string]: any, // This allows access via any string key,
    "Design Thinking": TutorialItem[],
    "Basic Navigation": TutorialItem[],
    "Design": TutorialItem[],
    "Generate": TutorialItem[],
    "Storyboarding": TutorialItem[],
    "Explore": TutorialItem[],
    "Iterate": TutorialItem[],
    "Update": TutorialItem[],
    "Example: Iterative Workflow": TutorialItem[],
}

export const tutorialMenuData: tutorialMenuItem = {
    "Design Thinking": [
        {
            "title": "What is it?",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <CopyIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
                <Text size="xs" c="dimmed">
                {' '}
                <Kbd>Space</Kbd> + Drag
              </Text>
        },
    ],
    "Basic Navigation" : [
        {
            "title": "Pan",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <Move3DIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                {' '}
                <Kbd>Space</Kbd> + Drag
            </Text>
        },
        {
            "title": "Zoom",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <ScanSearchIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                {' '}
                <Kbd>⌘</Kbd> + Scroll
            </Text>,
        },
    ],
    "Design": [
        {
            "title": "With AI",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <BotIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                <Kbd>Start brainstorming</Kbd>
            </Text>
        },
        {
            "title": "Manually",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <UserRoundIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                <Kbd>Add empty node</Kbd>
            </Text>
        },
        {
            "title": "Hybrid",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <HeartHandshakeIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": ''
        },
    ],
    "Generate": [
        {
            "title": "Generate _____ (next node)",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <SparklesIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Generate up to storyboard",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <BookImageIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
    ],
    "Storyboarding": [
        {
            "title": "Add Frame",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <PlusIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Delete Frame",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <Trash2 style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Update Single Frame",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
    ],
    "Explore": [
        {
            "title": "Duplicate",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <CopyIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "More",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <SquareStackIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Semantic Zoom",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <ScanEyeIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
    ],
    "Iterate": [
        {
            "title": "View Feedback",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <MessageSquareIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": ''
        },
        {
            "title": "Revise with AI",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <WandSparklesIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Edit Manually",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <PencilIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
    ],
    "Update": [
        {
            "title": "Single Node",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "All Nodes",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <ArrowDownFromLineIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": ''
        },
    ],
    "Example: Iterative Workflow": [
        {
            "title": "Iterate with Persona",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <>👤</>,
            "right_section": ''
        },
        {
            "title": "Iterate with Problem",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section":<>🚨</>,
            "right_section": ''
        },
        {
            "title": "Iterate with Solution",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <>💡</>,
            "right_section": ''
        },
        {
            "title": "Iterate with Storyboard",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <>🎞</>,
            "right_section": ''
        },
    ],
}