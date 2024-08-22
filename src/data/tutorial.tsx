import { 
    BookImageIcon, 
    BotIcon, 
    CopyIcon, 
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
    WandSparklesIcon,
    RocketIcon,
    AppWindowIcon,
    MessageSquareDiffIcon,
    ShowerHeadIcon,
    ReplaceIcon,
    Rotate3DIcon,
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
    "Basic Components": TutorialItem[],
    "Generate": TutorialItem[],
    "Storyboard": TutorialItem[],
    "Explore": TutorialItem[],
    "Iterate": TutorialItem[],
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
    "Basic Components" : [
        {
            "title": "UI & Nodes",
            "url": "https://www.youtube.com/embed/ri9fEu4iZ_4",
            "left_section": <AppWindowIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
    ],
    "Basic Navigation" : [
        {
            "title": "Pan",
            "url": "https://www.youtube.com/embed/1r6zH3yAoCE",
            "left_section": <Move3DIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                {' '}
                <Kbd>Space</Kbd> + Drag
            </Text>
        },
        {
            "title": "Zoom",
            "url": "https://www.youtube.com/embed/_UXTudlMudc",
            "left_section": <ScanSearchIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                {' '}
                <Kbd>⌘</Kbd> + Scroll
            </Text>,
        },
    ],
    "Create": [
        {
            "title": "Manually",
            "url": "https://www.youtube.com/embed/5krg8HNvIg8",
            "left_section": <UserRoundIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                <Kbd>Add empty node</Kbd>
            </Text>
        },
        {
            "title": "Add values",
            "url": "https://www.youtube.com/embed/SmSGp3WJ1xQ",
            "left_section": <MessageSquareDiffIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                <Kbd>Edit manually</Kbd>
            </Text>
        },
        {
            "title": "Fill in missing values",
            "url": "https://www.youtube.com/embed/iaF1N8jQ8Yo",
            "left_section": <ReplaceIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": ''
        },
        {
            "title": "Start brainstorming",
            "url": "https://www.youtube.com/embed/NDzwv7rKhwM",
            "left_section": <BotIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Use AI-generated Suggestions",
            "url": "https://www.youtube.com/embed/lKxOaaZP5TI",
            "left_section": <ShowerHeadIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": ''
        },
    ],
    "Generate": [
        {
            "title": "Generate _____ (next node)",
            "url": "https://www.youtube.com/embed/IJPQO-Jpcc4",
            "left_section": <SparklesIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Generate up to storyboard",
            "url": "https://www.youtube.com/embed/atRBSxO5vwo",
            "left_section": <BookImageIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
    ],
    "Storyboard": [
        {
            "title": "Add Frame",
            "url": "https://www.youtube.com/embed/Y2Q7QOALk3g",
            "left_section": <PlusIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Delete Frame",
            "url": "https://www.youtube.com/embed/IErc0PgbrAE",
            "left_section": <Trash2 style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Update Frame(s)",
            "url": "https://www.youtube.com/embed/KX5TyebxzOM",
            "left_section": <RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Update Image Style",
            "url": "https://www.youtube.com/embed/a053X_SFoFY",
            "left_section": <Rotate3DIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
    ],
    "Explore": [
        {
            "title": "Supporting Exploration",
            "url": "https://www.youtube.com/embed/uEmG0bF_cZA",
            "left_section": <RocketIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Duplicate",
            "url": "https://www.youtube.com/embed/E_sVXimnyVI",
            "left_section": <CopyIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "More",
            "url": "https://www.youtube.com/embed/nsMqmdq34lY",
            "left_section": <SquareStackIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Semantic Zoom",
            "url": "https://www.youtube.com/embed/jgcszBFpQ94",
            "left_section": <ScanEyeIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
    ],
    "Iterate": [
        {
            "title": "Edit Manually",
            "url": "https://www.youtube.com/embed/KAB0IAQOJbM",
            "left_section": <PencilIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "Revise with AI",
            "url": "https://www.youtube.com/embed/y2q_BhCjt7o",
            "left_section": <WandSparklesIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": ''
        },
        {
            "title": "View Feedback",
            "url": "https://www.youtube.com/embed/dq1JVwbeGuc",
            "left_section": <MessageSquareIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": ''
        },
    ],
}