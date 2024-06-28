import NotificationDot from '@/components/NotificationDot';
import { RefreshImageIcon } from '@/components/RefreshImageIcon';
import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { Dimension, NodeData } from '@/types';
import {
  ActionIcon,
  Tooltip,
  Image,
  Skeleton,
  Modal,
  MultiSelect,
  Button,
  Switch,
  Divider,
  ScrollAreaAutosize,
  Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  RefreshCw,
  ImageIcon,
  ImageOff,
  Info,
  TagsIcon,
  MessageCircleQuestion
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from 'reactflow';

export interface BaseNodeProps {
  nodeProps: NodeProps<NodeData>;

  nodeName: ReactNode;
  nodeBackgroundClass: string;
  textAreaBackgroundClass: string;

  content: string;
  onUpdateContent: (content: string) => void;
  onRegenerateContent: () => Promise<void>;

  onRegenerateImage: () => Promise<void>;
  onUpdateDimensions: (dimensions: Dimension[]) => void;
  onGenerateFeedback: () => Promise<void>;

  allDimensions: Dimension[];

  targetHandle: boolean;
  sourceHandle: boolean;
}
export default function BaseNode(props: BaseNodeProps) {
  const { nodeProps } = props;
  const {
    dimensions,
    image,
    imageOutOfSync,
    outOfSync,
    feedback,
    feedbackOutOfSync
  } = nodeProps.data;

  const [regenerating, setRegenerating] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  const [content, setContent] = useState(props.content);
  useEffect(() => {
    setContent(props.content);
  }, [props.content]);

  const [showImage, setShowImage] = useState(false);

  const [modalOpened, { open, close }] = useDisclosure(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const initialNodeDimensions = useMemo(
    () =>
      props.allDimensions.map((dimension) => {
        const pinnedDimension = dimensions.find((d) => d.id === dimension.id);
        return pinnedDimension ? pinnedDimension : dimension;
      }),
    [dimensions, props.allDimensions]
  );
  const [nodeDimensions, setNodeDimensions] = useState(initialNodeDimensions);

  const { globalShowImage } = useStore();
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodeDimensions(initialNodeDimensions);
  }, [initialNodeDimensions]);

  const handleNodeDimensionChange = (dimensionId: string, values: string[]) => {
    const newDimensions = nodeDimensions.map((dimension) => {
      if (dimension.id === dimensionId) {
        return {
          ...dimension,
          currentValues: values
        };
      }
      return dimension;
    });

    setNodeDimensions(newDimensions);
  };

  function cardContent() {
    if (globalShowImage || showImage) {
      if (regenerating || !image) {
        return <Skeleton className="h-full w-full" />;
      } else {
        return (
          <div className="relative size-full">
            <Tooltip
              variant=""
              label="Illustrative image to visualize the node"
            >
              <ActionIcon
                className="absolute top-1 right-1"
                radius="xl"
                size="sm"
                color="gray"
              >
                <Info className="w-full h-full" />
              </ActionIcon>
            </Tooltip>
            <Image src={image} className="h-full object-cover" />
          </div>
        );
      }
    } else {
      return (
        <>
          <textarea
            className={`block w-full resize-none p-2 text-md flex-grow ${props.textAreaBackgroundClass} nodrag`}
            disabled={regenerating}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => {
              if (content !== props.content) {
                props.onUpdateContent(content);
              }
            }}
            onFocus={() =>
              fitView({
                nodes: [{ id: nodeProps.id }],
                duration: 1000,
                padding: 0.5
              })
            }
          />
        </>
      );
    }
  }

  return (
    <>
      <NodeResizer
        nodeId={nodeProps.id}
        isVisible={nodeProps.selected}
        handleClassName="[&:is(.top,.bottom.left)]:hidden"
        lineClassName="hidden"
        minWidth={300}
        minHeight={200}
        handleStyle={{
          width: 10,
          height: 10
        }}
      />
      <div
        className={`h-full flex flex-col min-w-[300px] min-h-[300px] p-3 ${
          nodeProps.selected ? 'nowheel' : ''
        } ${props.nodeBackgroundClass}`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-sm">{props.nodeName}</h3>
          <div className="flex gap-2 items-center nodrag">
            <Switch
              size="sm"
              checked={showImage}
              onChange={(event) => setShowImage(event.currentTarget.checked)}
              onLabel={<ImageIcon className="w-3 h-3" />}
              offLabel={<ImageOff className="w-3 h-3" />}
            />
            <ActionIcon variant="subtle" size="sm" onClick={open}>
              <TagsIcon className="w-5 h-5" />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={async () => {
                setFeedbackOpen(!feedbackOpen);

                if ((!feedback || feedbackOutOfSync) && !generatingFeedback) {
                  setGeneratingFeedback(true);
                  await props.onGenerateFeedback();
                  setGeneratingFeedback(false);
                }
              }}
            >
              <MessageCircleQuestion className="w-5 h-5" />
              {feedback && feedbackOutOfSync && <NotificationDot />}
            </ActionIcon>
            <Tooltip label="Regenerate illustrative image">
              <ActionIcon
                variant="subtle"
                size="sm"
                loading={regenerating}
                onClick={async () => {
                  if (regenerating) return;

                  setRegenerating(true);
                  await props.onRegenerateImage();
                  setRegenerating(false);
                }}
              >
                <RefreshImageIcon />
                {imageOutOfSync && <NotificationDot />}
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={
                <p>
                  {outOfSync ? 'Dependencies updated. ' : ''}
                  Regenerate
                </p>
              }
            >
              <ActionIcon
                variant="subtle"
                size="sm"
                loading={regenerating}
                onClick={async () => {
                  if (regenerating) return;

                  setRegenerating(true);
                  await props.onRegenerateContent();
                  setRegenerating(false);
                }}
              >
                <RefreshCw className="w-5 h-5" />
                {outOfSync && <NotificationDot />}
              </ActionIcon>
            </Tooltip>
          </div>
        </div>
        <div className="w-full flex-grow flex flex-col overflow-hidden">
          {cardContent()}
        </div>
      </div>
      {props.targetHandle && <TargetHandle />}
      {props.sourceHandle && <SourceHandle />}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setNodeDimensions(initialNodeDimensions);
          close();
        }}
        title="Edit node dimensions"
        classNames={{
          root: 'h-full',
          content: 'flex flex-col',
          body: 'flex flex-col h-full overflow-hidden p-0'
        }}
      >
        <form
          className="flex flex-col h-full overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            const newDimensions = nodeDimensions.filter(
              ({ currentValues }) => currentValues.length
            );
            props.onUpdateDimensions(newDimensions);
            close();
          }}
        >
          <ScrollAreaAutosize>
            <div className="px-4 pb-4">
              {nodeDimensions.map((dimension) => (
                <MultiSelect
                  key={dimension.id}
                  label={dimension.name}
                  data={dimension.values}
                  value={dimension.currentValues}
                  onChange={(value) =>
                    handleNodeDimensionChange(dimension.id, value)
                  }
                  withCheckIcon={true}
                  checkIconPosition="right"
                />
              ))}
            </div>
          </ScrollAreaAutosize>

          <div className="px-4 pb-4">
            <Divider />
            <Button type="submit" className="mt-4">
              Update dimensions
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        opened={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
        }}
        title={<b>Node content</b>}
        classNames={{
          root: 'h-full',
          content: 'flex flex-col',
          body: 'flex flex-col h-full overflow-hidden p-0'
        }}
      >
        <div className="px-4 pb-4">
          <p className="">{props.content}</p>
        </div>
        <p className="px-4 pb-1">
          <b>💬 Feedback</b>
        </p>
        {generatingFeedback ? (
          <div className="px-4 pb-4 flex justify-center">
            <Loader />
          </div>
        ) : (
          <ScrollAreaAutosize>
            <ul className="px-4 pb-4 flex flex-col gap-2">
              {feedback?.map((idea, idx) => (
                <li key={idx} className="list-disc list-inside">
                  {idea}
                </li>
              ))}
            </ul>
          </ScrollAreaAutosize>
        )}
      </Modal>
    </>
  );
}
