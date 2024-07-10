import NotificationDot from '@/components/NotificationDot';
import { RefreshImageIcon } from '@/components/RefreshImageIcon';
import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { useStore } from '@/store';
import { NodeData } from '@/types';
import {
  ActionIcon,
  Tooltip,
  Image,
  Skeleton,
  Modal,
  Button,
  Switch,
  Loader,
  Textarea,
  Table,
  Tabs,
  InputLabel,
  LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  ImageIcon,
  ImageOff,
  Info,
  Pencil,
  MessageSquareShare,
  X,
  MessageSquareIcon
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import {
  NodeProps,
  NodeResizer,
  ReactFlowState,
  useStore as useRfStore
} from 'reactflow';

const zoomSelector = (s: ReactFlowState) => s.transform[2];

export interface BaseNodeProps<T extends Record<string, string>> {
  nodeProps: NodeProps<NodeData>;

  nodeName: ReactNode;
  nodeBackgroundClass: string;
  textAreaBackgroundClass: string;

  content: T;
  onUpdateContent: (content: Partial<T>) => void;
  onRegenerateContent: (instructions: string) => Promise<void>;

  onRegenerateImage: () => Promise<void>;
  onGenerateFeedback: () => Promise<void>;

  targetHandle: boolean;
  sourceHandle: boolean;
}
export default function BaseNode<T extends Record<string, string>>(
  props: BaseNodeProps<T>
) {
  const { nodeProps } = props;
  const { image, imageOutOfSync, outOfSync, feedback, feedbackOutOfSync } =
    nodeProps.data;

  const [regenerating, setRegenerating] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  const [showImage, setShowImage] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('feedback');

  const [editInstructions, setEditInstructions] = useState('');
  const [editFeedback, setEditFeedback] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState(false);

  const zoom = useRfStore(zoomSelector);
  const zoomShowImage = zoom < 0.7;

  const { globalShowImage } = useStore();

  function cardContent() {
    if (globalShowImage || showImage || zoomShowImage) {
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
        <div>
          {Object.entries(props.content).map(([key, value]) => (
            <div key={key}>
              <b>{key}</b>: {value}
            </div>
          ))}
        </div>
      );
    }
  }

  const feedbackTable = (
    <Table>
      <Table.Tbody>
        {generatingFeedback ? (
          <div className="px-4 pb-4 flex justify-center">
            <Loader className="m-4" />
          </div>
        ) : (
          feedback?.map((idea, idx) => (
            <Table.Tr key={idx}>
              <Table.Td>{idea}</Table.Td>

              <Table.Td>
                <Tooltip label="Incorporate feedback">
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      setEditFeedback(idea);
                      setActiveTab('edit');
                    }}
                  >
                    <MessageSquareShare />
                  </ActionIcon>
                </Tooltip>
              </Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );

  const handleEditSubmit = async () => {
    if (editingNode) return;

    setEditingNode(true);

    const instructions = editFeedback
      ? `Feedback: ${editFeedback}\nResponse: ${editInstructions}`
      : editInstructions;
    await props.onRegenerateContent(instructions);

    setEditInstructions('');
    setEditFeedback(null);

    setModalOpen(false);
    setEditingNode(false);
  };

  const editForm = (
    <form
      className="pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleEditSubmit();
      }}
    >
      {editFeedback && (
        <div className="mb-4 flex justify-between items-center gap-4">
          <div>
            <InputLabel>Feedback to incorporate</InputLabel>
            <p className="italic text-md">{editFeedback}</p>
          </div>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => setEditFeedback(null)}
          >
            <X />
          </ActionIcon>
        </div>
      )}
      <Textarea
        label="Edit instructions"
        description="Provide instructions for how to update this node, provide feedback, or respond to feedback."
        className="mb-4"
        required={true}
        value={editInstructions}
        onChange={(e) => setEditInstructions(e.target.value)}
      />

      <Button type="submit">Edit</Button>
    </form>
  );

  async function generateFeedbackIfNeeded() {
    if ((!feedback || feedbackOutOfSync) && !generatingFeedback) {
      setGeneratingFeedback(true);
      await props.onGenerateFeedback();
      setGeneratingFeedback(false);
    }
  }

  const icons = [
    {
      key: 'regenerate',
      tooltip: 'Regenerate illustrative image',
      icon: <RefreshImageIcon />,
      notification: imageOutOfSync,
      loading: regenerating,
      onClick: async () => {
        if (regenerating) return;

        setRegenerating(true);
        await props.onRegenerateImage();
        setRegenerating(false);
      }
    },
    {
      key: 'feedback',
      tooltip: 'Feedback',
      icon: <MessageSquareIcon />,
      notification: !feedback || feedbackOutOfSync,
      onClick: () => {
        setActiveTab('feedback');
        setModalOpen(true);
        generateFeedbackIfNeeded();
      }
    },
    {
      key: 'edit',
      tooltip: outOfSync ? 'Dependencies updated. Update node' : 'Edit',
      icon: <Pencil />,
      notification: outOfSync,
      onClick: () => {
        if (outOfSync) {
          setEditInstructions(
            'Update the node taking into account the updated dependencies.'
          );
        }

        setActiveTab('edit');
        setModalOpen(true);
      }
    }
  ].map(({ key, tooltip, icon, notification, loading, onClick }) => {
    const iconElement = (
      <ActionIcon
        key={key}
        variant="subtle"
        size="sm"
        loading={loading}
        onClick={onClick}
      >
        {icon}
        {notification && <NotificationDot />}
      </ActionIcon>
    );

    return tooltip ? (
      <Tooltip key={key} label={tooltip}>
        {iconElement}
      </Tooltip>
    ) : (
      iconElement
    );
  });

  const nodeForm = useForm({
    mode: 'uncontrolled',
    initialValues: props.content
  });

  const nodeFormElement = (
    <form
      onSubmit={nodeForm.onSubmit((values) => {
        props.onUpdateContent(values);
      })}
    >
      {Object.keys(props.content).map((key) => (
        <Textarea key={key} label={key} {...nodeForm.getInputProps(key)} />
      ))}

      <Button type="submit">Submit</Button>
    </form>
  );

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
        className={`h-full flex flex-col min-w-[300px] min-h-[300px] p-3 border-2 ${
          nodeProps.selected ? 'nowheel border-blue-600' : 'border-transparent'
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
            {icons}
          </div>
        </div>
        <div className="w-full flex-grow flex flex-col overflow-hidden">
          {cardContent()}
        </div>
      </div>
      {props.targetHandle && <TargetHandle />}
      {props.sourceHandle && <SourceHandle />}
      <Modal
        title={<b>Node content</b>}
        size="lg"
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
      >
        <div className={`p-2 ${props.nodeBackgroundClass} mb-4`}>
          <h3 className="font-bold text-sm mb-2">{props.nodeName}</h3>
          {nodeFormElement}
        </div>

        <Tabs
          value={activeTab}
          onChange={(value) => {
            setActiveTab(value);
            if (value === 'feedback') {
              generateFeedbackIfNeeded();
            }
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="feedback">
              Feedback
              {(!feedback || feedbackOutOfSync) && <NotificationDot />}
            </Tabs.Tab>
            <Tabs.Tab value="edit">Edit</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="feedback">
            {generatingFeedback ? (
              <div className="p-4 flex justify-center">
                <Loader />
              </div>
            ) : (
              feedbackTable
            )}
          </Tabs.Panel>
          <Tabs.Panel value="edit">{editForm}</Tabs.Panel>
        </Tabs>
        <LoadingOverlay visible={editingNode} />
      </Modal>
    </>
  );
}
