import { NodeType } from '@/rf-components';
import { useStore } from '@/store';
import { Modal, Textarea, Select, Button, LoadingOverlay } from '@mantine/core';
import { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import { NodeCountDisplayer } from './NodeCountDisplayer';

export interface GenerationModalProps {
  opened: boolean;
  onClose: () => void;
  generationType:
    | {
        type: 'dependent';
        dependentNodeToGenerate: 'problem' | 'solution' | 'storyboard';
      }
    | {
        type: 'similar';
        similarNodeToGenerate:
          | 'persona'
          | 'problem'
          | 'solution'
          | 'storyboard';
      }
    | {
        type: 'ideas';
      };
}
export function GenerationModal(props: GenerationModalProps) {
  const { opened, onClose, generationType } = props;

  const {
    generatePersonaNodes,
    generateProblemNodes,
    generateSolutionNodes,
    generateStoryboardNode,

    generateSimilarPersonaNodes,
    generateSimilarProblemNodes,
    generateSimilarSolutionNodes,
    generateSimilarStoryboardNode,

    selectNodes,
    selectedNodes
  } = useStore(
    useShallow((state) => ({
      generatePersonaNodes: state.generatePersonaNodes,
      generateProblemNodes: state.generateProblemNodes,
      generateSolutionNodes: state.generateSolutionNodes,
      generateStoryboardNode: state.generateStoryboardNode,

      generateSimilarPersonaNodes: state.generateSimilarPersonaNodes,
      generateSimilarProblemNodes: state.generateSimilarProblemNodes,
      generateSimilarSolutionNodes: state.generateSimilarSolutionNodes,
      generateSimilarStoryboardNode: state.generateSimilarStoryboardNode,

      selectNodes: state.selectNodes,
      selectedNodes: state.nodes.filter((node) => node.selected)
    }))
  );
  const { fitView } = useReactFlow();

  const [designPrompt, setDesignPrompt] = useState('');
  const [finalStep, setFinalStep] = useState<
    'Persona' | 'Problem' | 'Solution' | 'Storyboard'
  >('Persona');

  const [generating, setGenerating] = useState(false);

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

  const getDependentNodes = () => {
    if (generationType.type === 'dependent') {
      switch (generationType.dependentNodeToGenerate) {
        case 'problem':
          return selectedPersonaNodes;
        case 'solution':
          return selectedProblemNodes;
        case 'storyboard':
          return [
            ...selectedPersonaNodes,
            ...selectedProblemNodes,
            ...selectedSolutionNodes
          ];
      }
    } else if (generationType.type === 'similar') {
      switch (generationType.similarNodeToGenerate) {
        case 'persona':
          return selectedPersonaNodes;
        case 'problem':
          return selectedProblemNodes;
        case 'solution':
          return selectedSolutionNodes;
        case 'storyboard':
          return selectedStoryboardNodes;
      }
    } else {
      return [];
    }
  };
  const dependentNodes = getDependentNodes();

  const getModalTitle = () => {
    if (generationType.type === 'dependent') {
      switch (generationType.dependentNodeToGenerate) {
        case 'problem':
          return 'Generate dependent problems';
        case 'solution':
          return 'Generate dependent solutions';
        case 'storyboard':
          return 'Generate dependent storyboard';
      }
    } else if (generationType.type === 'similar') {
      switch (generationType.similarNodeToGenerate) {
        case 'persona':
          return 'Generate similar personas';
        case 'problem':
          return 'Generate similar problems';
        case 'solution':
          return 'Generate similar solutions';
        case 'storyboard':
          return 'Generate similar storyboard';
      }
    } else {
      return 'Generate ideas';
    }
  };
  const modalTitle = getModalTitle();

  const showSelectedNodeCounter = generationType.type !== 'ideas';

  const handleGenerateIdeas = async () => {
    const nodesToFocus: string[] = [];

    const personaIds = await generatePersonaNodes(designPrompt);
    nodesToFocus.push(...personaIds);

    if (finalStep !== 'Persona') {
      const problemIds = await generateProblemNodes(designPrompt, personaIds);
      nodesToFocus.push(...problemIds);

      if (finalStep !== 'Problem') {
        const solutionIds = await generateSolutionNodes(
          designPrompt,
          problemIds
        );
        nodesToFocus.push(...solutionIds);

        if (finalStep !== 'Solution') {
          const storyboardIds = await generateStoryboardNode(
            designPrompt,
            personaIds,
            problemIds,
            solutionIds
          );
          nodesToFocus.push(...storyboardIds);
        }
      }
    }

    return nodesToFocus;
  };

  const handleGenerateDependent = async () => {
    if (generationType.type !== 'dependent') return [];

    const { dependentNodeToGenerate } = generationType;

    const generatedNodeIds =
      dependentNodeToGenerate === 'problem'
        ? await generateProblemNodes(
            designPrompt,
            selectedPersonaNodes.map(({ id }) => id)
          )
        : dependentNodeToGenerate === 'solution'
        ? await generateSolutionNodes(
            designPrompt,
            selectedProblemNodes.map(({ id }) => id)
          )
        : dependentNodeToGenerate === 'storyboard'
        ? await generateStoryboardNode(
            designPrompt,
            selectedPersonaNodes.map(({ id }) => id),
            selectedProblemNodes.map(({ id }) => id),
            selectedSolutionNodes.map(({ id }) => id)
          )
        : [];

    return generatedNodeIds;
  };

  const handleGenerateSimilar = async () => {
    if (generationType.type !== 'similar') return [];

    const { similarNodeToGenerate } = generationType;

    const generatedNodeIds =
      similarNodeToGenerate === 'persona'
        ? await generateSimilarPersonaNodes(
            designPrompt,
            selectedPersonaNodes.map(({ id }) => id)
          )
        : similarNodeToGenerate === 'problem'
        ? await generateSimilarProblemNodes(
            designPrompt,
            selectedProblemNodes.map(({ id }) => id)
          )
        : similarNodeToGenerate === 'solution'
        ? await generateSimilarSolutionNodes(
            designPrompt,
            selectedSolutionNodes.map(({ id }) => id)
          )
        : similarNodeToGenerate === 'storyboard'
        ? await generateSimilarStoryboardNode(
            designPrompt,
            selectedStoryboardNodes.map(({ id }) => id)
          )
        : [];

    return generatedNodeIds;
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);

    const nodesToFocus: string[] =
      generationType.type === 'ideas'
        ? await handleGenerateIdeas()
        : generationType.type === 'dependent'
        ? await handleGenerateDependent()
        : generationType.type === 'similar'
        ? await handleGenerateSimilar()
        : [];

    setGenerating(false);

    fitView({
      nodes: nodesToFocus.map((id) => ({ id }))
    });
    selectNodes(nodesToFocus);

    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={<span className="text-xl font-bold">{modalTitle}</span>}
    >
      <div className="relative">
        <LoadingOverlay visible={generating} />
        {showSelectedNodeCounter && (
          <div className="mb-8">
            <h2 className="text-md font-bold mb-2">Selected input nodes:</h2>
            <NodeCountDisplayer nodeIds={dependentNodes.map(({ id }) => id)} />
          </div>
        )}
        <div className="mb-8">
          <Textarea
            label="Design prompt"
            className="mb-4"
            autosize
            minRows={3}
            maxRows={8}
            disabled={generating}
            value={designPrompt}
            onChange={(event) => setDesignPrompt(event.target.value)}
          />
          {generationType.type === 'ideas' && (
            <Select
              label="Final step"
              description="Select the step of the design process to generate up to"
              data={['Persona', 'Problem', 'Solution', 'Storyboard']}
              allowDeselect={false}
              disabled={generating}
              value={finalStep}
              onChange={(value) =>
                setFinalStep(
                  value as 'Persona' | 'Problem' | 'Solution' | 'Storyboard'
                )
              }
            />
          )}
        </div>

        <Button disabled={generating} onClick={handleGenerate}>
          Generate
        </Button>
      </div>
    </Modal>
  );
}
