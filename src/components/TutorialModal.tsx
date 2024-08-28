import {
  Menu,
  Button,
  Modal,
  ScrollAreaAutosize,
  rem
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  MonitorPlayIcon,
  SquareMenuIcon,
  SparkleIcon,
  BookOpenTextIcon
} from 'lucide-react';
import { useState } from 'react';
import { ProjectThemesList } from './ProjectList';
import { projectThemes } from '@/data/projects';
import { tutorialMenuData } from '@/data/tutorial';

export function TutorialModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [url, setUrl] = useState<string | null>(
    null
  );
  const [tutorialTopic, setTutorialTopic] = useState<string | null>(null);

  const handleOpen = (topic: string, newUrl: string) => {
    setUrl(newUrl);
    setTutorialTopic(topic);
    open();
  };

  const showProjectList = () => {
    setUrl(null);
    setTutorialTopic('Project Ideas');
    open();
  };

  return (
    <>
      <Modal.Root opened={opened} onClose={close} size="90%" centered>
        <Modal.Overlay backgroundOpacity={0.55} blur={0} />
        <Modal.Content>
          <Modal.Header
            style={{
              display: 'flex',
              fontWeight: 'bold',
              padding: '10px 25px'
            }}
          >
            <>
              <MonitorPlayIcon />
              &nbsp;<Modal.Title>{tutorialTopic}</Modal.Title>
              <Modal.CloseButton />
            </>
          </Modal.Header>
          <Modal.Body
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px'
            }}
          >
            {url ? (
              <>
                <div
                  className="text-center"
                  style={{
                    textAlign: 'center',
                    width: '100%',
                    height: '0',
                    paddingBottom: '56.25%',
                    position: 'relative',
                    border: 'none'
                  }}
                >
                  <iframe
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      width: '100%',
                      height: '100%',
                    }}
                    src={url}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              </>
            ):
            (
                <ProjectThemesList projectThemes={projectThemes} close={close}/>
            )
          }
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
      <Menu
        // opened={true}
        trigger="hover"
        openDelay={100}
        closeDelay={400}
        shadow="md"
        width={300}
        styles={{
          dropdown: {
            maxHeight: '85vh' // Hack to make the dropdown scrollable without overflow
          }
        }}
      >
        <Menu.Target>
          <Button 
          leftSection={<BookOpenTextIcon />}
          >Tutorial</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <ScrollAreaAutosize
            offsetScrollbars={true}
            scrollbars="y"
            type="auto"
            mah="80vh" // Hack to make the dropdown scrollable without overflow
          > 
            {Object.keys(tutorialMenuData).map((key, index) => (
              <>
                <Menu.Label key={index}>{key}</Menu.Label>
                <>{
                    tutorialMenuData[key].map((item:any, idx:number) => (
                      <Menu.Item 
                          key={index + '-' + idx}
                          leftSection={item.left_section}
                          rightSection={item.right_section}
                          onClick={() => handleOpen(item.title, item.url)}
                        >
                        { item.title }
                      </Menu.Item>
                    ))
                  }
                </>
                <Menu.Divider />
              </>
            ))}

            <Menu.Label>Task</Menu.Label>
            <Menu.Item
              leftSection={<SquareMenuIcon style={{ width: rem(14), height: rem(14) }} />}
              onClick={() =>
                handleOpen("Task Instruction", "https://www.youtube.com/embed/JmWrs_Xxb3w")
              }
            >
              Instruction
            </Menu.Item>
            <Menu.Item
              leftSection={<SparkleIcon style={{ width: rem(14), height: rem(14) }} />}
              onClick={() =>
                showProjectList()
              }
            >
              Projects
            </Menu.Item>

          </ScrollAreaAutosize>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
