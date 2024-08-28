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
    ArrowUpFromLineIcon,
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
    "Iterate (Propagating Change ↓↑)": TutorialItem[],
}

export const tutorialMenuData: tutorialMenuItem = {
    "Design Thinking": [
        {
            "title": "What is it?",
            "url": "https://www.youtube.com/embed/2wpaMLd3H6Q",
            "left_section": <CopyIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1.5 min
            </Text>
        },
    ],
    "Basic Components" : [
        {
            "title": "UI & Nodes",
            "url": "https://www.youtube.com/embed/vwtn2NU-gwk",
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
            "url": "https://www.youtube.com/embed/DIXUZq7kkHc",
            "left_section": <Move3DIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
                0.5 min
            </Text>
        },
        {
            "title": "Zoom",
            "url": "https://www.youtube.com/embed/MpG723qNkBY",
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
            "url": "https://www.youtube.com/embed/02YAf5JVeiA",
            "left_section": <UserRoundIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               0.5 min
            </Text>
        },
        {
            "title": "Add values",
            "url": "https://www.youtube.com/embed/bR0UVBybOCs",
            "left_section": <MessageSquareDiffIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1 min
            </Text>
        },
        {
            "title": "Fill in missing values",
            "url": "https://www.youtube.com/embed/nDgmP08xUNA",
            "left_section": <ReplaceIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
               0.7 min
            </Text>
        },
        {
            "title": "Start brainstorming",
            "url": "https://www.youtube.com/embed/DRFfpwX5uhQ",
            "left_section": <BotIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               3 min
            </Text>
        },
        {
            "title": "Use AI-generated suggestions",
            "url": "https://www.youtube.com/embed/GPujfTXfFUw",
            "left_section": <ShowerHeadIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
               0.9 min
            </Text>
        },
    ],
    "Generate": [
        {
            "title": "Generate _____ (next node)",
            "url": "https://www.youtube.com/embed/Iy0om7PoqRc",
            "left_section": <SparklesIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1.1 min
            </Text>
        },
        {
            "title": "Generate up to storyboard",
            "url": "https://www.youtube.com/embed/9EJIwyM_p2g",
            "left_section": <BookImageIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               2 min
            </Text>
        },
    ],
    "Storyboard": [
        {
            "title": "Add frame",
            "url": "https://www.youtube.com/embed/xXQVEQXBXQE",
            "left_section": <PlusIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               2 min
            </Text>
        },
        {
            "title": "Delete frame",
            "url": "https://www.youtube.com/embed/gi4I68bDMH0",
            "left_section": <Trash2 style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1 min
            </Text>
        },
        {
            "title": "Update frame(s)",
            "url": "https://www.youtube.com/embed/VUERVhD7AHM",
            "left_section": <RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1.5 min
            </Text>
        },
        {
            "title": "Update image style",
            "url": "https://www.youtube.com/embed/eZ790gHaFvQ",
            "left_section": <Rotate3DIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1.2 min
            </Text>
        },
    ],
    "Explore (Diverge)": [
        {
            "title": "Supporting exploration",
            "url": "https://www.youtube.com/embed/4usiUk-3YKY",
            "left_section": <RocketIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               0.6 min
            </Text>
        },
        {
            "title": "Duplicate",
            "url": "https://www.youtube.com/embed/Avs2XD7BWro",
            "left_section": <CopyIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1 min
            </Text>
        },
        {
            "title": "More",
            "url": "https://www.youtube.com/embed/tFtg4au7e_w",
            "left_section": <SquareStackIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               2.5 min
            </Text>
        },
    ],
    "Sensemaking & Organization": [
        {
            "title": "Semantic zoom",
            "url": "https://www.youtube.com/embed/5wweDJEekbE",
            "left_section": <ScanEyeIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1.6 min
            </Text>
        },
        {
            "title": "Use comment",
            "url": "https://www.youtube.com/embed/qgx6HAydcJ8",
            "left_section": <MessageSquareQuoteIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               0.5 min
            </Text>
        },
    ],
    "Focus (Converge)": [
        {
            "title": "Synthesize ideas",
            "url": "https://www.youtube.com/embed/_Ywjb1AKYwg",
            "left_section": <BlendIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               1.6 min
            </Text>
        },
    ],
    "Iterate (Propagating Change ↓↑)": [
        {
            "title": "Edit manually",
            "url": "https://www.youtube.com/embed/O0hPmom2ot0",
            "left_section": <PencilIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               3.3 min
            </Text>
        },
        {
            "title": "Revise with AI",
            "url": "https://www.youtube.com/embed/jkLnEACF4rw",
            "left_section": <WandSparklesIcon style={{ width: rem(14), height: rem(14) }} />,
            "right_section": 
            <Text size="xs" c="dimmed">
               2 min
            </Text>
        },
        {
            "title": "Connect nodes",
            "url": "https://www.youtube.com/embed/tdL4VCWEejc",
            "left_section": <CableIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
               1.9 min
            </Text>
        },
        {
            "title": "View feedback",
            "url": "https://www.youtube.com/embed/PA5uLwdYvE8",
            "left_section": <MessageSquareIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
               2.1 min
            </Text>
        },
        {
            "title": "Propagate changes ↑",
            "url": "https://www.youtube.com/embed/tdL4VCWEejc",
            "left_section": <ArrowUpFromLineIcon style={{ width: rem(14), height: rem(14) }}/>,
            "right_section": 
            <Text size="xs" c="dimmed">
               2.5 min
            </Text>
        },
    ],
}