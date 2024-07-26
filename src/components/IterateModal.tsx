import { Node } from 'reactflow';
import {
  ActionIcon,
  Button,
  InputLabel,
  Loader,
  LoadingOverlay,
  Modal,
  ScrollAreaAutosize,
  Table,
  Tabs,
  Text,
  Textarea,
  Tooltip
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { SelectedNodePreview } from './SelectedNodePreview';
import { useStore } from '@/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquareShare, PlusIcon, X } from 'lucide-react';
import { NodeType } from '@/rf-components';
import {
  generateMultipleNodeFeedback,
  generatePersonaFeedback,
  generateProblemFeedback,
  generateStoryboardFeedback
} from '@/api/feedback';
import { NodeData, StoryboardNodeData } from '@/types';
import { calculatePreviousChangedValues } from '@/lib/calculatePreviousChangedValues';
import { generateUpdateNodeDescriptionRecommendations } from '@/api/recommendations';
import { getSanitizedNodeContents } from '@/lib/getSanitizedNodeContent';
import { useDisplayStore } from '@/lib/displayStore';

const MISSING_VALUE_INSTRUCTIONS = 'Fill in missing values';

export interface IterateModalProps {}
export function IterateModal() {
  const {
    selectedNodes,

    iterateModalOpen,
    setIterateModalOpen,

    iterateModalTab,
    setIterateModalTab,

    regeneratePersonaNodes,
    regenerateProblemNodes,
    regenerateSolutionNodes,
    regenerateStoryboardNode,

    updatePersonaNode,
    updateProblemNode,
    updateSolutionNode
  } = useStore((state) => ({
    selectedNodes: state.nodes.filter((node) => node.selected),

    iterateModalOpen: state.iterateModalOpen,
    setIterateModalOpen: state.setIterateModalOpen,

    iterateModalTab: state.iterateModalTab,
    setIterateModalTab: state.setIterateModalTab,

    regeneratePersonaNodes: state.regeneratePersonaNodes,
    regenerateProblemNodes: state.regenerateProblemNodes,
    regenerateSolutionNodes: state.regenerateSolutionNodes,
    regenerateStoryboardNode: state.regenerateStoryboardNode,

    updatePersonaNode: state.updatePersonaNode,
    updateProblemNode: state.updateProblemNode,
    updateSolutionNode: state.updateSolutionNode
  }));

  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [feedback, setFeedback] = useState<string[] | null>(null);
  const [feedbackToIncorporate, setFeedbackToIncorporate] = useState<
    string | null
  >(null);

  const { previousChangedValuesById, setPreviousChangedValuesById } =
    useDisplayStore();

  const generateFeedback = useCallback(async () => {
    if (selectedNodes.length === 0) {
      return [];
    }

    if (selectedNodes.length > 1) {
      return generateMultipleNodeFeedback(
        selectedNodes.map((node) => {
          if (node.type === NodeType.Storyboard) {
            const storyboardNode = node as Node<StoryboardNodeData>;
            const { storyboard } = storyboardNode.data;
            const sanitizedStoryboard = {
              title: storyboard.title,
              outline: storyboard.outline.map((frame) => ({
                frameType: frame.frameType,
                description: frame.description,
                caption: frame.caption
              }))
            };
            return sanitizedStoryboard;
          }

          return node.data.content;
        })
      );
    }

    const selectedNode = selectedNodes[0];
    if (selectedNode.type === NodeType.Persona) {
      return generatePersonaFeedback(selectedNode.data.content);
    } else if (selectedNode.type === NodeType.Problem) {
      return generateProblemFeedback(selectedNode.data.content);
    } else if (selectedNode.type === NodeType.Solution) {
      return generateProblemFeedback(selectedNode.data.content);
    } else if (selectedNode.type === NodeType.Storyboard) {
      const storyboardNode = selectedNode as Node<StoryboardNodeData>;
      const { storyboard } = storyboardNode.data;
      const sanitizedStoryboard = {
        title: storyboard.title,
        outline: storyboard.outline.map((frame) => ({
          frameType: frame.frameType,
          description: frame.description,
          caption: frame.caption
        }))
      };

      return generateStoryboardFeedback(sanitizedStoryboard);
    }

    return [];
  }, [selectedNodes]);

  useEffect(() => {
    if (
      !iterateModalOpen ||
      feedback !== null ||
      iterateModalTab !== 'feedback'
    )
      return;

    if (generatingFeedback) return;
    setGeneratingFeedback(true);

    generateFeedback().then((feedback) => {
      setFeedback(feedback);
      setGeneratingFeedback(false);
    });
  }, [
    feedback,
    generateFeedback,
    generatingFeedback,
    iterateModalOpen,
    iterateModalTab
  ]);

  const [feedbackResponse, setFeedbackResponse] = useState('');

  const [editInstructions, setEditInstructions] = useState('');
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [generatingRecommendations, setGeneratingRecommendations] =
    useState(false);

  useEffect(() => {
    if (
      !iterateModalOpen ||
      recommendations !== null ||
      iterateModalTab !== 'regenerate'
    )
      return;

    if (generatingRecommendations) return;
    setGeneratingRecommendations(true);

    generateUpdateNodeDescriptionRecommendations(
      getSanitizedNodeContents(selectedNodes)
    ).then((recommendations) => {
      setRecommendations(recommendations);
      setGeneratingRecommendations(false);
    });
  }, [
    iterateModalOpen,
    recommendations,
    iterateModalTab,
    generatingRecommendations,
    selectedNodes
  ]);

  const resetInputs = () => {
    setFeedback(null);
    setFeedbackToIncorporate(null);
    setFeedbackResponse('');
    setEditInstructions('');
    setRecommendations(null);
  };

  const [regenerating, setRegenerating] = useState(false);
  const regenerateNodes = async (context: string) => {
    if (regenerating) return;
    setRegenerating(true);
    setPreviousChangedValuesById({});

    const personaIds = selectedNodes
      .filter((node) => node.type === NodeType.Persona)
      .map((node) => node.id);
    const problemIds = selectedNodes
      .filter((node) => node.type === NodeType.Problem)
      .map((node) => node.id);
    const solutionIds = selectedNodes
      .filter((node) => node.type === NodeType.Solution)
      .map((node) => node.id);
    const storyboardIds = selectedNodes
      .filter((node) => node.type === NodeType.Storyboard)
      .map((node) => node.id);

    if (personaIds.length > 0) {
      const { previousChangedValuesById: _previousChangedValuesById } =
        await regeneratePersonaNodes(personaIds, context);
      setPreviousChangedValuesById({
        ...previousChangedValuesById,
        ..._previousChangedValuesById
      });
    }

    if (problemIds.length > 0) {
      const { previousChangedValuesById: _previousChangedValuesById } =
        await regenerateProblemNodes(problemIds, context);
      setPreviousChangedValuesById({
        ...previousChangedValuesById,
        ..._previousChangedValuesById
      });
    }

    if (solutionIds.length > 0) {
      const { previousChangedValuesById: _previousChangedValuesById } =
        await regenerateSolutionNodes(solutionIds, context);
      setPreviousChangedValuesById({
        ...previousChangedValuesById,
        ..._previousChangedValuesById
      });
    }

    if (storyboardIds.length > 0) {
      await regenerateStoryboardNode(storyboardIds[0], context);
    }

    scrollToTop();

    setRegenerating(false);
    resetInputs();
  };

  const showEditForm =
    selectedNodes.length === 1 &&
    (
      [NodeType.Persona, NodeType.Problem, NodeType.Solution] as string[]
    ).includes(selectedNodes[0].type ?? '');
  const nodeToEdit: Node<NodeData> = selectedNodes[0];
  const nodeToEditHasEmptyFields =
    nodeToEdit &&
    Object.values(nodeToEdit.data.content).some((value) => value === '');
  const editForm = useForm({
    mode: 'controlled'
  });
  const setEditFormValues = editForm.setValues;
  useEffect(() => {
    if (showEditForm) {
      setEditFormValues({ ...nodeToEdit.data.content });
    }
  }, [showEditForm, setEditFormValues, nodeToEdit]);

  function editFormTab() {
    if (!showEditForm || !nodeToEdit) return null;

    return (
      <Tabs.Panel value="edit">
        <form
          className="pt-4"
          onSubmit={editForm.onSubmit((values) => {
            if (!nodeToEdit) return;

            if (nodeToEdit.type === NodeType.Persona) {
              updatePersonaNode(nodeToEdit.id, values);
            } else if (nodeToEdit.type === NodeType.Problem) {
              updateProblemNode(nodeToEdit.id, values);
            } else if (nodeToEdit.type === NodeType.Solution) {
              updateSolutionNode(nodeToEdit.id, values);
            }

            setPreviousChangedValuesById({
              ...previousChangedValuesById,
              [nodeToEdit.id]: calculatePreviousChangedValues(
                nodeToEdit.data.content,
                values
              )
            });

            resetInputs();

            notifications.show({
              message: `${nodeToEdit.type} edited`,
              autoClose: 5000
            });

            scrollToTop();
          })}
        >
          <h2 className="text-md font-bold mb-2">
            Manually edit selected node
          </h2>

          {Object.keys(nodeToEdit.data.content).map((key) => (
            <Textarea key={key} label={key} {...editForm.getInputProps(key)} />
          ))}

          <Button type="submit" className="mt-4">
            Edit
          </Button>
        </form>
      </Tabs.Panel>
    );
  }

  useEffect(() => {
    if (!iterateModalOpen || iterateModalTab !== 'regenerate') return;

    if (nodeToEditHasEmptyFields && !editInstructions) {
      setEditInstructions(MISSING_VALUE_INSTRUCTIONS);
    }
  }, [
    editInstructions,
    iterateModalOpen,
    iterateModalTab,
    nodeToEditHasEmptyFields,
    showEditForm
  ]);

  useEffect(() => {
    if (!iterateModalOpen) {
      resetInputs();
    }
  }, [iterateModalOpen]);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaComponent = useCallback(
    ({ ...props }) => (
      <ScrollAreaAutosize {...props} viewportRef={modalRef} scrollbars={'y'} />
    ),
    []
  );
  const scrollToTop = () =>
    modalRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  return (
    <Modal
      title="Iterate"
      size="xl"
      opened={iterateModalOpen}
      onClose={() => {
        setIterateModalOpen(false);
      }}
      scrollAreaComponent={scrollAreaComponent}
    >
      <div className="relative">
        <LoadingOverlay visible={regenerating} />
        <div className="mb-8">
          <h2 className="text-md font-bold mb-2">Selected nodes:</h2>
          <SelectedNodePreview
            selectedNodes={selectedNodes}
            previousChangedValuesById={previousChangedValuesById}
          />
        </div>

        <Tabs
          value={iterateModalTab}
          onChange={setIterateModalTab as (value: string | null) => void}
        >
          <Tabs.List>
            <Tabs.Tab value="feedback">Feedback</Tabs.Tab>
            <Tabs.Tab value="regenerate">Regenerate</Tabs.Tab>
            {showEditForm && <Tabs.Tab value="edit">Edit</Tabs.Tab>}
          </Tabs.List>

          <Tabs.Panel value="feedback">
            {generatingFeedback ? (
              <div className="p-4 flex flex-col justify-center items-center">
                <Loader className="m-4" />
                <Text c="blue" size="sm" className="font-semibold">
                  Generating feedback...
                </Text>
              </div>
            ) : !feedbackToIncorporate ? (
              <Table>
                <Table.Tbody>
                  {feedback?.map((idea, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{idea}</Table.Td>

                      <Table.Td>
                        <Tooltip label="Incorporate feedback">
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => {
                              setFeedbackToIncorporate(idea);
                            }}
                          >
                            <MessageSquareShare />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <form
                className="pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  regenerateNodes(
                    `Incorporate the following feedback:\nQ: ${feedbackToIncorporate}\nA: ${feedbackResponse}`
                  );
                }}
              >
                <h2 className="text-md font-bold mb-2">
                  Regenerate node(s) using feedback
                </h2>
                <div className="mb-4 flex justify-between items-center gap-4">
                  <div>
                    <InputLabel>Feedback to incorporate</InputLabel>
                    <p className="italic text-md">{feedbackToIncorporate}</p>
                  </div>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => setFeedbackToIncorporate(null)}
                  >
                    <X />
                  </ActionIcon>
                </div>
                <Textarea
                  label="Feedback response"
                  description="Enter your feedback response to regenerate the selected node(s)"
                  className="mb-4"
                  required
                  value={feedbackResponse}
                  onChange={(e) => setFeedbackResponse(e.target.value)}
                />

                <Button type="submit">Regenerate with feedback</Button>
              </form>
            )}
          </Tabs.Panel>
          <Tabs.Panel value="regenerate">
            <form
              className="pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                regenerateNodes(editInstructions);
              }}
            >
              <h2 className="text-md font-bold mb-2">
                Regenerate node(s) using instructions
              </h2>

              <Textarea
                label="Instructions"
                description="Enter instructions to regenerate the selected node(s)"
                className="mb-4"
                required
                autosize
                minRows={3}
                maxRows={8}
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
              />
              {generatingRecommendations ? (
                <p>Generating recommendations...</p>
              ) : recommendations ? (
                <div className="flex gap-2 flex-wrap">
                  {recommendations.map((recommendation) => (
                    <Button
                      key={recommendation}
                      variant="outline"
                      radius="xl"
                      size="compact-sm"
                      color="gray"
                      leftSection={<PlusIcon className="size-5" />}
                      disabled={editInstructions.includes(recommendation)}
                      onClick={() =>
                        setEditInstructions((curr) => {
                          if (curr) return curr + '\n' + recommendation;
                          return recommendation;
                        })
                      }
                    >
                      {recommendation}
                    </Button>
                  ))}
                </div>
              ) : null}

              <Button type="submit" className="mt-4">
                Regenerate
              </Button>
            </form>
          </Tabs.Panel>
          {editFormTab()}
        </Tabs>
      </div>
    </Modal>
  );
}
