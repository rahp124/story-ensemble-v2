import { NodeType } from '@/rf-components';
import { useStore } from '@/store';
import { Anchor, Button, LoadingOverlay, Modal, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { SelectedNodePreview } from './SelectedNodePreview';
import { generateMoreNodeDescriptionRecommendations } from '@/api/recommendations';
import { getSanitizedNodeContents } from '@/lib/getSanitizedNodeContent';
import { CheckIcon, PlusIcon } from 'lucide-react';
import { notifications } from '@mantine/notifications';

const TEXT_CONTENT = {
  Persona: {
    title: 'Generate more personas',
    inputLabel: 'Persona ideas',
    inputDescription:
      'Provide initial ideas and context for personas to generate and how they differ from the existing personas.',
    notificationTitle: 'Generating more personas'
  },
  Problem: {
    title: 'Generate more problems',
    inputLabel: 'Problem ideas',
    inputDescription:
      'Provide initial ideas and context for problems to generate and how they differ from the existing problems.',
    notificationTitle: 'Generating more problems'
  },
  Solution: {
    title: 'Generate more solutions',
    inputLabel: 'Solution ideas',
    inputDescription:
      'Provide initial ideas and context for solutions to generate and how they differ from the existing solutions.',
    notificationTitle: 'Generating more solutions'
  },
  Storyboard: {
    title: 'Generate another storyboard',
    inputLabel: 'Storyboard description',
    inputDescription:
      'Roughly describe the storyboard to generate and how it differs from the existing storyboards.',
    notificationTitle: 'Generating another storyboard'
  }
};

export interface GenerateMoreModalProps {
  opened: boolean;
  onClose: () => void;

  nodeToGenerate: 'Persona' | 'Problem' | 'Solution' | 'Storyboard';
}
export function GenerateMoreModal(props: GenerateMoreModalProps) {
  const { opened, onClose, nodeToGenerate } = props;

  const {
    generateMorePersonaNodes,
    generateMoreProblemNodes,
    generateMoreSolutionNodes,
    generateMoreStoryboardNode,

    selectedNodes,
    selectNodes
  } = useStore((state) => ({
    generateMorePersonaNodes: state.generateMorePersonaNodes,
    generateMoreProblemNodes: state.generateMoreProblemNodes,
    generateMoreSolutionNodes: state.generateMoreSolutionNodes,
    generateMoreStoryboardNode: state.generateMoreStoryboardNode,

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
  const selectedStoryboardNodes = selectedNodes.filter(
    ({ type }) => type === NodeType.Storyboard
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

    generateMoreNodeDescriptionRecommendations(
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
      nodeToGenerate === 'Persona'
        ? await generateMorePersonaNodes(
            instructions,
            selectedPersonaNodes.map(({ id }) => id)
          )
        : nodeToGenerate === 'Problem'
        ? await generateMoreProblemNodes(
            instructions,
            selectedProblemNodes.map(({ id }) => id)
          )
        : nodeToGenerate === 'Solution'
        ? await generateMoreSolutionNodes(
            instructions,
            selectedSolutionNodes.map(({ id }) => id)
          )
        : await generateMoreStoryboardNode(
            instructions,
            selectedStoryboardNodes.map(({ id }) => id)
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
