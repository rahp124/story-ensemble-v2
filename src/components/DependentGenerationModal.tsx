import { displayConfigByNodeType, NodeType } from '@/rf-components';
import { useStore } from '@/store';
import { Anchor, Button, LoadingOverlay, Modal, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { SelectedNodePreview } from './SelectedNodePreview';
import { generateDependentNodeDescriptionRecommendations } from '@/api/recommendations';
import { getSanitizedNodeContents } from '@/lib/getSanitizedNodeContent';
import { CheckIcon, PlusIcon } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { findDirectDependencies } from '@/lib/graphHelper';

const TEXT_CONTENT = {
  Problem: {
    title: 'Generate problems from personas',
    inputLabel: 'Problem ideas',
    inputDescription:
      'Provide initial ideas and context for the problems to generate.',
    buttonText: `Generate problems ${
      displayConfigByNodeType[NodeType.Problem].emoji
    }`,
    notificationTitle: 'Generating problems from personas'
  },
  Solution: {
    title: 'Generate solutions from problems',
    inputLabel: 'Solution description',
    inputDescription:
      'Provide initial ideas and context for the solutions to generate.',
    buttonText: `Generate solutions ${
      displayConfigByNodeType[NodeType.Solution].emoji
    }`,
    notificationTitle: 'Generating solutions from problems'
  },
  Storyboard: {
    title: 'Generate storyboard from solutions',
    inputLabel: 'Storyboard description',
    inputDescription: 'Roughly describe the storyboard to generate',
    buttonText: `Generate storyboard ${
      displayConfigByNodeType[NodeType.Storyboard].emoji
    }`,
    notificationTitle: 'Generating storyboard from solutions'
  }
};

export interface DependentGenerationModalProps {
  opened: boolean;
  onClose: () => void;

  nodeToGenerate: 'Problem' | 'Solution' | 'Storyboard';
}
export function DependentGenerationModal(props: DependentGenerationModalProps) {
  const { opened, onClose, nodeToGenerate } = props;

  const {
    edges,

    generateProblemNodes,
    generateSolutionNodes,
    generateStoryboardNode,

    selectedNodes,
    selectNodes,

    addStudyEvent
  } = useStore((state) => ({
    edges: state.edges,

    generateProblemNodes: state.generateProblemNodes,
    generateSolutionNodes: state.generateSolutionNodes,
    generateStoryboardNode: state.generateStoryboardNode,

    selectedNodes: state.nodes.filter((node) => node.selected),
    selectNodes: state.selectNodes,

    addStudyEvent: state.addStudyEvent
  }));

  const selectedPersonaNodes = selectedNodes.filter(
    ({ type }) => type === NodeType.Persona
  );
  const selectedProblemNodes = selectedNodes.filter(
    ({ type }) => type === NodeType.Problem
  );
  const selectedSolutionNodes = selectedNodes.filter(
    ({ type }) => type === NodeType.Solution
  );

  const { fitView } = useReactFlow();

  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [generatingRecommendations, setGeneratingRecommendations] =
    useState(false);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (!opened || recommendations !== null) return;

    if (generatingRecommendations) return;
    setGeneratingRecommendations(true);

    generateDependentNodeDescriptionRecommendations(
      getSanitizedNodeContents(selectedNodes),
      nodeToGenerate
    ).then((recommendations) => {
      setRecommendations(recommendations);
      setGeneratingRecommendations(false);

      addStudyEvent({
        initiator: 'system',
        type: 'GENERATE_DEPENDENT_RECOMMENDATIONS',
        count: recommendations.length,
        data: {
          selectedNodeIds: selectedNodes.map(({ id }) => id),
          nodeToGenerate
        }
      });
    });
  }, [
    addStudyEvent,
    generatingRecommendations,
    nodeToGenerate,
    opened,
    recommendations,
    selectedNodes
  ]);

  const [generating, setGenerating] = useState(false);

  const { title, inputLabel, inputDescription, notificationTitle, buttonText } =
    TEXT_CONTENT[nodeToGenerate];

  async function generateIdeas() {
    if (generating) return;
    setGenerating(true);

    const notificationId = notifications.show({
      title: notificationTitle,
      message: 'Generating...',

      loading: true,
      autoClose: false,
      withCloseButton: false
    });
    onClose();

    const nodesToFocus =
      nodeToGenerate === 'Problem'
        ? await generateProblemNodes(
            instructions,
            selectedPersonaNodes.map(({ id }) => id)
          )
        : nodeToGenerate === 'Solution'
        ? await generateSolutionNodes(
            instructions,
            selectedProblemNodes.map(({ id }) => id)
          )
        : await generateStoryboardNode(
            instructions,
            selectedPersonaNodes.map(({ id }) => id),
            selectedProblemNodes.map(({ id }) => id),
            selectedSolutionNodes.map(({ id }) => id)
          );

    addStudyEvent({
      initiator: 'user',
      type:
        nodeToGenerate === 'Problem'
          ? 'DEPENDENT_GENERATE_PROBLEMS'
          : nodeToGenerate === 'Solution'
          ? 'DEPENDENT_GENERATE_SOLUTIONS'
          : 'DEPENDENT_GENERATE_STORYBOARDS',
      count: nodesToFocus.length,
      data: {
        instructions,
        nodeToGenerate
      }
    });

    notifications.update({
      id: notificationId,
      message: (
        <>
          Generation complete.{' '}
          <Anchor
            size="sm"
            onClick={() => {
              fitView({
                nodes: nodesToFocus.map((id) => ({ id })),
                duration: 1000
              });
              selectNodes(nodesToFocus);
            }}
          >
            Jump to nodes
          </Anchor>
        </>
      ),

      icon: <CheckIcon />,
      loading: false,
      withCloseButton: true,
      autoClose: 6 * 1000
    });

    setGenerating(false);

    setRecommendations(null);
    setInstructions('');
  }

  async function generateUpToStoryboard() {
    if (generating) return;
    setGenerating(true);

    const notificationId = notifications.show({
      title: 'Generating up to storyboard',
      message: 'Generating...',

      loading: true,
      autoClose: false,
      withCloseButton: false
    });
    onClose();

    const nodesToFocus: string[] = [];

    const personaIds = selectedPersonaNodes.map(({ id }) => id);
    let problemIds = selectedProblemNodes.map(({ id }) => id);
    let solutionIds = selectedSolutionNodes.map(({ id }) => id);

    if (nodeToGenerate === 'Problem') {
      notifications.update({
        id: notificationId,
        message: 'Generating problems...'
      });

      problemIds = await generateProblemNodes(
        instructions,
        personaIds,
        nodeToGenerate !== 'Problem'
      );
      nodesToFocus.push(...problemIds);

      addStudyEvent({
        initiator: 'user',
        type: 'DEPENDENT_TO_STORYBOARD_GENERATE_PROBLEMS',
        count: problemIds.length,
        data: {
          instructions,
          nodeToGenerate
        }
      });
    }

    if (nodeToGenerate === 'Problem' || nodeToGenerate === 'Solution') {
      notifications.update({
        id: notificationId,
        message: 'Generating solutions...'
      });

      solutionIds = await generateSolutionNodes(
        instructions,
        problemIds,
        nodeToGenerate !== 'Solution'
      );
      nodesToFocus.push(...solutionIds);

      addStudyEvent({
        initiator: 'user',
        type: 'DEPENDENT_TO_STORYBOARD_GENERATE_SOLUTIONS',
        count: solutionIds.length,
        data: {
          instructions,
          nodeToGenerate
        }
      });
    }

    notifications.update({
      id: notificationId,
      message: 'Generating storyboard...'
    });

    const middleIndex = Math.floor((solutionIds.length - 1) / 2);
    const solution = solutionIds[middleIndex];

    const dependentProblemIds = findDirectDependencies([solution], edges);
    const dependentPersonaIds = findDirectDependencies(
      dependentProblemIds,
      edges
    );

    const storyboardIds = await generateStoryboardNode(
      instructions,
      dependentPersonaIds,
      dependentProblemIds,
      [solution]
    );
    nodesToFocus.push(...storyboardIds);

    addStudyEvent({
      initiator: 'user',
      type: 'DEPENDENT_TO_STORYBOARD_GENERATE_STORYBOARDS',
      count: storyboardIds.length,
      data: {
        instructions,
        nodeToGenerate
      }
    });

    notifications.update({
      id: notificationId,
      message: (
        <>
          Generate complete.{' '}
          <Anchor
            size="sm"
            onClick={() => {
              fitView({
                nodes: nodesToFocus.map((id) => ({ id })),
                duration: 1000
              });
              selectNodes(nodesToFocus);
            }}
          >
            Jump to nodes
          </Anchor>
        </>
      ),

      icon: <CheckIcon />,
      loading: false,
      withCloseButton: true,
      autoClose: 6 * 1000
    });

    setGenerating(false);

    setRecommendations(null);
    setInstructions('');
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();

        if (!generating) {
          setRecommendations(null);
          setInstructions('');
        }
      }}
      size="xl"
      title={<span className="text-lg font-bold">{title}</span>}
    >
      <div className="relative">
        <LoadingOverlay visible={generating} />

        <div className="mb-8">
          <h2 className="text-md font-bold mb-2">Selected nodes:</h2>
          <SelectedNodePreview selectedNodes={selectedNodes} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateIdeas();
          }}
        >
          <Textarea
            label={inputLabel}
            description={inputDescription}
            className="mb-2"
            autosize
            minRows={3}
            maxRows={8}
            value={instructions}
            onChange={(event) => setInstructions(event.currentTarget.value)}
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
                  disabled={instructions.includes(recommendation)}
                  onClick={() =>
                    setInstructions((curr) => {
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

          <div className="flex gap-2 mt-6">
            <Button type="submit">{buttonText}</Button>
            {nodeToGenerate !== 'Storyboard' && (
              <Button variant="outline" onClick={generateUpToStoryboard}>
                Generate up to storyboard{' '}
                {displayConfigByNodeType[NodeType.Storyboard].emoji}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}
