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
  dependentNodeToGenerate: 'problem' | 'solution' | 'storyboard' | null;
}
export function GenerationModal(props: GenerationModalProps) {
  const { opened, onClose, dependentNodeToGenerate } = props;

  const {
    generatePersonaNodes,
    generateProblemNodes,
    generateSolutionNodes,
    generateStoryboardNode,

    selectNodes,
    selectedNodes
  } = useStore(
    useShallow((state) => ({
      generatePersonaNodes: state.generatePersonaNodes,
      generateProblemNodes: state.generateProblemNodes,
      generateSolutionNodes: state.generateSolutionNodes,
      generateStoryboardNode: state.generateStoryboardNode,

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
  const dependentNodes =
    dependentNodeToGenerate === 'problem'
      ? selectedPersonaNodes
      : dependentNodeToGenerate === 'solution'
      ? selectedSolutionNodes
      : dependentNodeToGenerate === 'storyboard'
      ? [
          ...selectedPersonaNodes,
          ...selectedProblemNodes,
          ...selectedSolutionNodes
        ]
      : [];

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);

    const nodesToFocus: string[] = [];

    if (!dependentNodeToGenerate) {
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
    } else {
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

      nodesToFocus.push(...generatedNodeIds);
      nodesToFocus.push(...dependentNodes.map(({ id }) => id));
    }

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
      title={
        <span className="text-xl font-bold">
          {dependentNodeToGenerate
            ? `Generate dependent ${dependentNodeToGenerate}`
            : 'Generate ideas'}
        </span>
      }
    >
      <div className="relative">
        <LoadingOverlay visible={generating} />
        {dependentNodeToGenerate && (
          <div className="mb-8">
            <h2 className="text-md font-bold mb-2">Selected input nodes:</h2>
            <NodeCountDisplayer nodeIds={dependentNodes.map(({ id }) => id)} />
          </div>
        )}
        <div className="mb-8">
          <p className="text-sm mb-6">
            Enter a design prompt to start generating ideas and select which
            type of ideas you want to generate up to.
          </p>
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
          {!dependentNodeToGenerate && (
            <Select
              label="Final step"
              description="Select the step of the design process to generate up to"
              data={['Persona', 'Problem', 'Solution', 'Storyboard']}
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
