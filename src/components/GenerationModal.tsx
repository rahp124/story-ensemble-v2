import { NodeType } from '@/rf-components';
import { useStore } from '@/store';
import {
  Modal,
  Textarea,
  Select,
  MultiSelect,
  Accordion,
  Button,
  Center,
  ActionIcon,
  Tooltip,
  LoadingOverlay
} from '@mantine/core';
import { Plus } from 'lucide-react';
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
    personaDimensions,
    generatePersonaDimensions,
    pinPersonaDimension,
    generatePersonaNodes,

    problemDimensions,
    generateProblemDimensions,
    pinProblemDimension,
    generateProblemNodes,

    solutionDimensions,
    generateSolutionDimensions,
    pinSolutionDimension,
    generateSolutionNodes,

    storyboardDimensions,
    generateStoryboardDimensions,
    pinStoryboardDimension,
    generateStoryboardNode,

    selectNodes,
    selectedNodes
  } = useStore(
    useShallow((state) => ({
      personaDimensions: state.personaDimensions,
      generatePersonaDimensions: state.generatePersonaDimensions,
      pinPersonaDimension: state.pinPersonaDimension,
      generatePersonaNodes: state.generatePersonaNodes,

      problemDimensions: state.problemDimensions,
      generateProblemDimensions: state.generateProblemDimensions,
      pinProblemDimension: state.pinProblemDimension,
      generateProblemNodes: state.generateProblemNodes,

      solutionDimensions: state.solutionDimensions,
      generateSolutionDimensions: state.generateSolutionDimensions,
      pinSolutionDimension: state.pinSolutionDimension,
      generateSolutionNodes: state.generateSolutionNodes,

      storyboardDimensions: state.storyboardDimensions,
      generateStoryboardDimensions: state.generateStoryboardDimensions,
      pinStoryboardDimension: state.pinStoryboardDimension,
      generateStoryboardNode: state.generateStoryboardNode,

      selectNodes: state.selectNodes,
      selectedNodes: state.nodes.filter((node) => node.selected)
    }))
  );
  const { fitView } = useReactFlow();

  const [designPrompt, setDesignPrompt] = useState('');
  const [finalStep, setFinalStep] = useState<
    'Persona' | 'Problem' | 'Solution' | 'Storyboard'
  >('Storyboard');

  const generatingPersonaDimension = useState(false);
  const generatingProblemDimension = useState(false);
  const generatingSolutionDimension = useState(false);
  const generatingStoryboardDimension = useState(false);

  const [generating, setGenerating] = useState(false);
  const isDisabled =
    generatingPersonaDimension[0] ||
    generatingProblemDimension[0] ||
    generatingSolutionDimension[0] ||
    generatingStoryboardDimension[0] ||
    generating;

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

  const dimensions = [
    {
      title: 'Persona',
      dimensions: personaDimensions,
      pinFunc: pinPersonaDimension,
      generatingDimensionState: generatingPersonaDimension,
      generateFunc: generatePersonaDimensions,
      show: !dependentNodeToGenerate
    },
    {
      title: 'Problem',
      dimensions: problemDimensions,
      pinFunc: pinProblemDimension,
      generatingDimensionState: generatingProblemDimension,
      generateFunc: generateProblemDimensions,
      show:
        (!dependentNodeToGenerate && finalStep !== 'Persona') ||
        dependentNodeToGenerate === 'problem'
    },
    {
      title: 'Solution',
      dimensions: solutionDimensions,
      pinFunc: pinSolutionDimension,
      generatingDimensionState: generatingSolutionDimension,
      generateFunc: generateSolutionDimensions,
      show:
        (!dependentNodeToGenerate &&
          finalStep !== 'Persona' &&
          finalStep !== 'Problem') ||
        dependentNodeToGenerate === 'solution'
    },
    {
      title: 'Storyboard',
      dimensions: storyboardDimensions,
      pinFunc: pinStoryboardDimension,
      generatingDimensionState: generatingStoryboardDimension,
      generateFunc: generateStoryboardDimensions,
      show:
        (!dependentNodeToGenerate && finalStep === 'Storyboard') ||
        dependentNodeToGenerate === 'storyboard'
    }
  ];

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
      if (dependentNodeToGenerate === 'problem') {
        const problemIds = await generateProblemNodes(
          designPrompt,
          selectedPersonaNodes.map(({ id }) => id)
        );
        nodesToFocus.push(...problemIds);
      }

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
        <div className="mb-8">
          <h2 className="text-md font-bold mb-2">Selected input nodes:</h2>
          <NodeCountDisplayer nodeIds={dependentNodes.map(({ id }) => id)} />
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">Design Prompt</h2>
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
            disabled={isDisabled}
            value={designPrompt}
            onChange={(event) => setDesignPrompt(event.target.value)}
          />
          {!dependentNodeToGenerate && (
            <Select
              label="Final step"
              description="Select the step of the design process to generate up to"
              data={['Persona', 'Problem', 'Solution', 'Storyboard']}
              disabled={isDisabled}
              value={finalStep}
              onChange={(value) =>
                setFinalStep(
                  value as 'Persona' | 'Problem' | 'Solution' | 'Storyboard'
                )
              }
            />
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Dimensions (optional)</h2>
          <p className="text-sm mb-4">
            Generate and select dimensions to steer idea generation.
          </p>
        </div>

        <Accordion className="mb-8" chevronPosition="left">
          {dimensions
            .filter(({ show }) => show)
            .map(
              ({
                title,
                dimensions,
                pinFunc,
                generatingDimensionState: [
                  generatingDimensions,
                  setGeneratingDimensions
                ],
                generateFunc
              }) => {
                const numDimensions = dimensions.length;
                const numPinnedDimensions = dimensions.filter(
                  (d) => d.currentValues.length > 0
                ).length;

                return (
                  <Accordion.Item key={title} value={title}>
                    <Center className="flex justify-between">
                      <Accordion.Control>
                        <div>
                          {title} dimensions -{' '}
                          <b>
                            {numPinnedDimensions}/{numDimensions}
                          </b>{' '}
                          selected
                        </div>
                      </Accordion.Control>
                      <Tooltip label="Generate more dimensions">
                        <ActionIcon
                          variant="subtle"
                          className="ml-2"
                          loading={generatingDimensions}
                          onClick={async () => {
                            if (generatingDimensions) return;

                            setGeneratingDimensions(true);
                            await generateFunc(designPrompt);
                            setGeneratingDimensions(false);
                          }}
                        >
                          <Plus />
                        </ActionIcon>
                      </Tooltip>
                    </Center>
                    <Accordion.Panel>
                      <div className="flex flex-col gap-4">
                        {dimensions.map((dimension) => (
                          <MultiSelect
                            key={dimension.id}
                            label={dimension.name}
                            description={dimension.description}
                            placeholder="Pin dimension"
                            data={dimension.values}
                            disabled={generating}
                            value={dimension.currentValues}
                            onChange={(value) => pinFunc(dimension.id, value)}
                            withCheckIcon={true}
                            checkIconPosition="right"
                          />
                        ))}
                      </div>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              }
            )}
        </Accordion>

        <Button disabled={generating} onClick={handleGenerate}>
          Generate
        </Button>
      </div>
    </Modal>
  );
}
