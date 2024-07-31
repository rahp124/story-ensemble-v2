import { Menu, Text, Button, Modal, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    ImageIcon,
    CopyIcon,
    MessageSquareIcon,
    ArrowDownFromLineIcon,
    RefreshCwIcon,
    PlusIcon,
    Trash2,
    PencilIcon,
    SquareStackIcon,
    WandSparklesIcon
} from 'lucide-react';
import { useState } from 'react';
import { Kbd } from '@mantine/core';

export function TutorialModal() {
    const [opened, { open, close }] = useDisclosure(true);
    const [url, setUrl] = useState<string | null>('https://www.youtube.com/embed/XoSfkqrGwhg?si=vPG5bZ3S1dU4_CP7');

    const handleOpen = (newUrl: string) => {
        setUrl(newUrl);
        open();
      };
    
    return (
        <>
            <Modal opened={opened} onClose={close} title="Tutorial" size="xl" withCloseButton={true} centered overlayProps={{ backgroundOpacity: 0.55, blur: 3, }}>
                {url && (
                    <>
                        <p className="text-sm mb-4">
                            This displays which action the tutorial video is for.
                        </p>
                        <div className='text-center' style={{
                                textAlign: 'center'
                                }}>
                            <iframe width="560" height="315" src={url} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen>
                            </iframe>
                        </div>
                    </>
                )}
            </Modal>
            <Menu trigger="hover" openDelay={100} closeDelay={400} shadow="md" width={300}>
                <Menu.Target>
                    <Button>Tutorial</Button>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>Basic Navigation</Menu.Label>
                        <Menu.Item 
                            leftSection={<ImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={
                                <Text size="xs" c="dimmed"> <Kbd>Space</Kbd> + Drag</Text>
                            }
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Pan
                        </Menu.Item>
                        <Menu.Item 
                            leftSection={<ImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={
                                <Text size="xs" c="dimmed"> <Kbd>⌘</Kbd> + Scroll</Text>
                            }
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Zoom
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Design Thinking</Menu.Label>
                        <Menu.Item
                            leftSection={<ImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={
                                <Text size="xs" c="dimmed"><Kbd>Start brainstorming</Kbd></Text>
                            }
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            With AI
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<ImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={
                                <Text size="xs" c="dimmed"><Kbd>Add empty node</Kbd></Text>
                            }
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Manually
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<ImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Hybrid
                        </Menu.Item>

                    <Menu.Divider />


                    <Menu.Label>Generate</Menu.Label>
                        <Menu.Item
                            leftSection={<ImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Generate _____ (next node)
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<ImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Generate up to storyboard
                        </Menu.Item>
                    <Menu.Divider />

                    <Menu.Label>Storyboarding</Menu.Label>

                        <Menu.Item
                            leftSection={<PlusIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Add Frame
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<Trash2 style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Delete Frame
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Update Single Frame
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Explore</Menu.Label>
                        <Menu.Item
                            leftSection={<CopyIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Duplicate
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<SquareStackIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            More ____
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<SquareStackIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Semantic Zoom
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Iterate</Menu.Label>
                        <Menu.Item
                            leftSection={<MessageSquareIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            View feedback
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<WandSparklesIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Revise (AI suggestions)
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<PencilIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Edit manually
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Update</Menu.Label>
                        <Menu.Item
                            leftSection={<RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Single Node
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<ArrowDownFromLineIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            All Nodes
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Example Workflow</Menu.Label>
                        <Menu.Item
                            leftSection={<ImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Connecting Nodes
                        </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </>
    );
}
