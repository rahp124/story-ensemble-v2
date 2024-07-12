import { Node } from 'reactflow';
import {
  ActionIcon,
  Button,
  InputLabel,
  Loader,
  LoadingOverlay,
  Modal,
  Table,
  Tabs,
  Textarea,
  Tooltip
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { SelectedNodePreview } from './SelectedNodePreview';
import { useStore } from '@/store';
import { useCallback, useEffect, useState } from 'react';
import { MessageSquareShare, X } from 'lucide-react';
import { NodeType } from '@/rf-components';
import {
  generateMultipleNodeFeedback,
  generatePersonaFeedback,
  generateProblemFeedback,
  generateStoryboardFeedback
} from '@/api/feedback';
import { NodeData, StoryboardNodeData } from '@/types';

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

  const resetInputs = () => {
    setFeedback(null);
    setFeedbackToIncorporate(null);
    setFeedbackResponse('');
    setEditInstructions('');
  };

  const [regenerating, setRegenerating] = useState(false);
  const regenerateNodes = async (context: string) => {
    if (regenerating) return;
    setRegenerating(true);

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
      await regeneratePersonaNodes(personaIds, context);
    }

    if (problemIds.length > 0) {
      await regenerateProblemNodes(problemIds, context);
    }

    if (solutionIds.length > 0) {
      await regenerateSolutionNodes(solutionIds, context);
    }

    if (storyboardIds.length > 0) {
      await regenerateStoryboardNode(storyboardIds[0], context);
    }

    setRegenerating(false);
    resetInputs();
  };

  const showEditForm =
    selectedNodes.length === 1 &&
    (
      [NodeType.Persona, NodeType.Problem, NodeType.Solution] as string[]
    ).includes(selectedNodes[0].type ?? '');
  const nodeToEdit: Node<NodeData> = selectedNodes[0];
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

            resetInputs();
            notifications.show({
              message: `${nodeToEdit.type} edited`,
              autoClose: 5000
            });
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
    if (!iterateModalOpen) {
      resetInputs();
    }
  }, [iterateModalOpen]);

  return (
    <Modal
      title="Iterate"
      size="lg"
      opened={iterateModalOpen}
      onClose={() => {
        setIterateModalOpen(false);
      }}
    >
      <div className="relative">
        <LoadingOverlay visible={regenerating} />
        <div className="mb-8">
          <h2 className="text-md font-bold mb-2">Selected nodes:</h2>
          <SelectedNodePreview selectedNodes={selectedNodes} />
        </div>

        <Tabs
          value={iterateModalTab}
          onChange={setIterateModalTab as (value: string | null) => void}
        >
          <Tabs.List>
            <Tabs.Tab value="feedback">Feedback</Tabs.Tab>
            <Tabs.Tab value="regenerate">Regenerate</Tabs.Tab>
            {selectedNodes.length === 1 && (
              <Tabs.Tab value="edit">Edit</Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="feedback">
            {generatingFeedback ? (
              <div className="px-4 pb-4 flex justify-center">
                <Loader className="m-4" />
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
                    `Q: ${feedbackToIncorporate}\nA: ${feedbackResponse}`
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
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
              />

              <Button type="submit">Regenerate</Button>
            </form>
          </Tabs.Panel>
          {editFormTab()}
        </Tabs>
      </div>
    </Modal>
  );
}
