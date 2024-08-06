import { Menu, Text, Button, Modal, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    ImageIcon,
    CopyIcon,
    MessageSquareIcon,
    ArrowDownFromLineIcon,
    RefreshCwIcon,
    MonitorPlayIcon,
    PlusIcon,
    Trash2,
    PencilIcon,
    SquareStackIcon,
    WandSparklesIcon,
    Move3DIcon,
    ScanSearchIcon,
    BotIcon,
    UserRoundIcon,
    HeartHandshakeIcon,
    SparklesIcon,
    BookImageIcon,
    ScanEyeIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Kbd } from '@mantine/core';

export function TutorialModal() {
    const [opened, { open, close }] = useDisclosure(false);
    const [url, setUrl] = useState<string | null>('https://www.youtube.com/embed/XoSfkqrGwhg?si=vPG5bZ3S1dU4_CP7');
    const [tutorialTopic, setTutorialTopic] = useState<string | null>(null);

    const handleOpen = (topic: string, newUrl: string) => {
        setUrl(newUrl);
        setTutorialTopic(topic);
        open();
      };
    
    return (
        <>
            <Modal.Root opened={opened} onClose={close} size="xl" centered>
                <Modal.Overlay backgroundOpacity={0.55} blur={3} />
                <Modal.Content>
                    <Modal.Header style={{
                                    display: 'flex',
                                    fontWeight: 'bold',
                                    padding: '10px 25px',
                                }}>
                        <>  
                            <MonitorPlayIcon/>&nbsp;<Modal.Title>{tutorialTopic}</Modal.Title>
                            <Modal.CloseButton />
                        </>
                    </Modal.Header>
                    <Modal.Body style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginBottom: '20px'
                                }}>
                        {url && (
                            <>
                                <div className='text-center' style={{
                                    textAlign: 'center'
                                }}>
                                    <iframe width="560" height="315" src={url} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen>
                                    </iframe>
                                </div>
                            </>
                        )}
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>
            <Menu trigger="hover" openDelay={100} closeDelay={400} shadow="md" width={300}>
                <Menu.Target>
                    <Button>Tutorial</Button>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>Basic Navigation</Menu.Label>
                        <Menu.Item 
                            leftSection={<Move3DIcon style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={
                                <Text size="xs" c="dimmed"> <Kbd>Space</Kbd> + Drag</Text>
                            }
                            onClick={() => handleOpen('Pan', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Pan
                        </Menu.Item>
                        <Menu.Item 
                            leftSection={<ScanSearchIcon style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={
                                <Text size="xs" c="dimmed"> <Kbd>⌘</Kbd> + Scroll</Text>
                            }
                            onClick={() => handleOpen('Zoom', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Zoom
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Design Thinking</Menu.Label>
                        <Menu.Item
                            leftSection={<BotIcon style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={
                                <Text size="xs" c="dimmed"><Kbd>Start brainstorming</Kbd></Text>
                            }
                            onClick={() => handleOpen('Design Thinking - with AI', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            With AI
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<UserRoundIcon style={{ width: rem(14), height: rem(14) }} />}
                            rightSection={
                                <Text size="xs" c="dimmed"><Kbd>Add empty node</Kbd></Text>
                            }
                            onClick={() => handleOpen('Design Thinking - Manually', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Manually
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<HeartHandshakeIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Design Thinking - Hybriad Approach','https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Hybrid
                        </Menu.Item>

                    <Menu.Divider />


                    <Menu.Label>Generate</Menu.Label>
                        <Menu.Item
                            leftSection={<SparklesIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Generate ____', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Generate _____ (next node)
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<BookImageIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Generate up to storyboard', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Generate up to storyboard
                        </Menu.Item>
                    <Menu.Divider />

                    <Menu.Label>Storyboarding</Menu.Label>

                        <Menu.Item
                            leftSection={<PlusIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Storyboarding - Add Frame','https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Add Frame
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<Trash2 style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Storyboarding - Delete Frame', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Delete Frame
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Storyboarding - Updating Single Frame', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Update Single Frame
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Explore</Menu.Label>
                        <Menu.Item
                            leftSection={<CopyIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Explore - Duplicate', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Duplicate
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<SquareStackIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Explore - More ___', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            More ____
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<ScanEyeIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Explore - Semantic Zoom', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Semantic Zoom
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Iterate</Menu.Label>
                        <Menu.Item
                            leftSection={<MessageSquareIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Iterate - View Feedback', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            View feedback
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<WandSparklesIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Iterate - Revise (AI suggestions)', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Revise (AI suggestions)
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<PencilIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Iterate - Edit manually', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Edit manually
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Update</Menu.Label>
                        <Menu.Item
                            leftSection={<RefreshCwIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Update - Single Node', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Single Node
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<ArrowDownFromLineIcon style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleOpen('Update - All Nodes', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            All Nodes
                        </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Example: Iterative Workflow</Menu.Label>
                        <Menu.Item
                            leftSection={<>👤</>}
                            onClick={() => handleOpen('Example Workflow - Return to Persona & Iterate', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Iterate w/ Persona
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<>🚨</>}
                            onClick={() => handleOpen('Example Workflow - Return to Problem & Iterate', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Iterate w/ Problem
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<>💡</>}
                            onClick={() => handleOpen('Example Workflow - Return to Solution & Iterate', 'https://www.youtube.com/embed/xpVMp1WRwI0?si=8pjPtVNAOdltBADS')}
                        >
                            Iterate w/ Solution
                        </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </>
    );
}
