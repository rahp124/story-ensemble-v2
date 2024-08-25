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
    BlendIcon,
    CableIcon,
    MessageSquareQuoteIcon,
} from "lucide-react"
import {
    rem,
    Text,
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
    "Explore (Diverge)": TutorialItem[],
    "Sensemaking & Organization": TutorialItem[],
    "Focus (Converge)": TutorialItem[],
    "Iterate (cascading changes)": TutorialItem[],
}

export const tutorialMenuData: tutorialMenuItem = {
    "Design Thinking": [
        {
            "title": "What is it?",
            "url": "https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS",
            "left_section": <CopyIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
    ],
    "Basic Components" : [
        {
            "title": "UI & Nodes",
            "url": "https://www.youtube.com/embed/ri9fEu4iZ_4",
            "left_section": <AppWindowIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                1 m
            </Text>
        },
    ],
    "Basic Navigation" : [
        {
            "title": "Pan",
            "url": "https://www.youtube.com/embed/v1pU3UtcHiw",
            "left_section": <Move3DIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                0.5 min
            </Text>
        },
        {
            "title": "Zoom",
            "url": "https://www.youtube.com/embed/_UXTudlMudc",
            "left_section": <ScanSearchIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                0.5 min
            </Text>
        },
    ],
    "Create": [
        {
            "title": "Add empty node",
            "url": "https://www.youtube.com/embed/5krg8HNvIg8",
            "left_section": <UserRoundIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Add values",
            "url": "https://www.youtube.com/embed/SmSGp3WJ1xQ",
            "left_section": <MessageSquareDiffIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Fill in missing values",
            "url": "https://www.youtube.com/embed/iaF1N8jQ8Yo",
            "left_section": <ReplaceIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Start brainstorming",
            "url": "https://www.youtube.com/embed/NDzwv7rKhwM",
            "left_section": <BotIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Use AI-generated suggestions",
            "url": "https://www.youtube.com/embed/lKxOaaZP5TI",
            "left_section": <ShowerHeadIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
    ],
    "Generate": [
        {
            "title": "Generate _____ (next node)",
            "url": "https://www.youtube.com/embed/IJPQO-Jpcc4",
            "left_section": <SparklesIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Generate up to storyboard",
            "url": "https://www.youtube.com/embed/atRBSxO5vwo",
            "left_section": <BookImageIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
    ],
    "Storyboard": [
        {
            "title": "Add frame",
            "url": "https://www.youtube.com/embed/Y2Q7QOALk3g",
            "left_section": <PlusIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Delete frame",
            "url": "https://www.youtube.com/embed/IErc0PgbrAE",
            "left_section": <Trash2 style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Update frame(s)",
            "url": "https://www.youtube.com/embed/KX5TyebxzOM",
            "left_section": <RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Update image style",
            "url": "https://www.youtube.com/embed/a053X_SFoFY",
            "left_section": <Rotate3DIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
    ],
    "Explore (Diverge)": [
        {
            "title": "Supporting exploration",
            "url": "https://www.youtube.com/embed/uEmG0bF_cZA",
            "left_section": <RocketIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Duplicate",
            "url": "https://www.youtube.com/embed/E_sVXimnyVI",
            "left_section": <CopyIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "More",
            "url": "https://www.youtube.com/embed/nsMqmdq34lY",
            "left_section": <SquareStackIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
    ],
    "Sensemaking & Organization": [
        {
            "title": "Semantic zoom",
            "url": "https://www.youtube.com/embed/jgcszBFpQ94",
            "left_section": <ScanEyeIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Use comment",
            "url": "https://www.youtube.com/embed/lhiC4slErlI",
            "left_section": <MessageSquareQuoteIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
    ],
    "Focus (Converge)": [
        {
            "title": "Synthesize ideas",
            "url": "https://www.youtube.com/embed/mIiIz_7sCdA",
            "left_section": <BlendIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
    ],
    "Iterate (cascading changes)": [
        {
            "title": "Edit manually",
            "url": "https://www.youtube.com/embed/KAB0IAQOJbM",
            "left_section": <PencilIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Revise with AI",
            "url": "https://www.youtube.com/embed/y2q_BhCjt7o",
            "left_section": <WandSparklesIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "Connect nodes",
            "url": "https://www.youtube.com/embed/5DoJJEzwh7k",
            "left_section": <CableIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
        {
            "title": "View feedback",
            "url": "https://www.youtube.com/embed/dq1JVwbeGuc",
            "left_section": <MessageSquareIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
                min
            </Text>
        },
    ],
}