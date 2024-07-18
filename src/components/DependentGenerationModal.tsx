import { NodeType } from '@/rf-components';
import { useStore } from '@/store';
import { Anchor, Button, LoadingOverlay, Modal, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { SelectedNodePreview } from './SelectedNodePreview';
import { generateDependentNodeDescriptionRecommendations } from '@/api/recommendations';
import { getSanitizedNodeContents } from '@/lib/getSanitizedNodeContent';
import { CheckIcon, PlusIcon } from 'lucide-react';
import { notifications } from '@mantine/notifications';

const TEXT_CONTENT = {
  Problem: {
    title: 'Generate problems from personas',
    inputLabel: 'Problem description',
    inputDescription: 'Roughly describe the problems to generate',
    notificationTitle: 'Generating problems from personas'
  },
  Solution: {
    title: 'Generate solutions from problems',
    inputLabel: 'Solution description',
    inputDescription: 'Roughly describe the solutions to generate',
    notificationTitle: 'Generating solutions from problems'
  },
  Storyboard: {
    title: 'Generate storyboard from solutions',
    inputLabel: 'Storyboard description',
    inputDescription: 'Roughly describe the storyboard to generate',
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
    generateProblemNodes,
    generateSolutionNodes,
    generateStoryboardNode,

    selectedNodes,
    selectNodes
  } = useStore((state) => ({
    generateProblemNodes: state.generateProblemNodes,
    generateSolutionNodes: state.generateSolutionNodes,
    generateStoryboardNode: state.generateStoryboardNode,

    selectedNodes: state.nodes.filter((node) => node.selected),
    selectNodes: state.selectNodes
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
    });
  }, [
    generatingRecommendations,
    nodeToGenerate,
    opened,
    recommendations,
    selectedNodes
  ]);

  const [generating, setGenerating] = useState(false);

  const { title, inputLabel, inputDescription, notificationTitle } =
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
            Jump to nodes.
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

          <Button type="submit" className="mt-4">
            Generate ideas
          </Button>
        </form>
      </div>
    </Modal>
  );
}
