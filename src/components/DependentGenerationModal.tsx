import { NodeType } from '@/rf-components';
import { useStore } from '@/store';
import {
  Modal,
  Textarea,
  MultiSelect,
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

export interface DependentGenerationModalProps {
  opened: boolean;
  onClose: () => void;
  nodeToGenerate: 'problem' | 'solution' | 'storyboard';
}
export function DependentGenerationModal(props: DependentGenerationModalProps) {
  const {
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
      selectedNodes: state.nodes.filter(({ selected }) => selected)
    }))
  );
  const { fitView } = useReactFlow();

  const [designPrompt, setDesignPrompt] = useState('');
  const [generatingDimensions, setGeneratingDimensions] = useState(false);
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
  // const selectedStoryboardNodes = selectedNodes.filter(
  //   ({ type }) => type === NodeType.Storyboard
  // );

  const nodeToMapGenerationMap = {
    problem: {
      dimensions: problemDimensions,
      pinFunc: pinProblemDimension,
      generateDimensionFunc: generateProblemDimensions,
      generateFunc: () =>
        generateProblemNodes(
          designPrompt,
          selectedPersonaNodes.map(({ id }) => id)
        ),
      dependentNodes: selectedPersonaNodes
    },
    solution: {
      dimensions: solutionDimensions,
      pinFunc: pinSolutionDimension,
      generateDimensionFunc: generateSolutionDimensions,
      generateFunc: () =>
        generateSolutionNodes(
          designPrompt,
          selectedProblemNodes.map(({ id }) => id)
        ),
      dependentNodes: selectedProblemNodes
    },
    storyboard: {
      dimensions: storyboardDimensions,
      pinFunc: pinStoryboardDimension,
      generateDimensionFunc: generateStoryboardDimensions,
      generateFunc: () =>
        generateStoryboardNode(
          designPrompt,
          selectedPersonaNodes.map(({ id }) => id),
          selectedProblemNodes.map(({ id }) => id),
          selectedSolutionNodes.map(({ id }) => id)
        ),
      dependentNodes: [
        ...selectedPersonaNodes,
        ...selectedProblemNodes,
        ...selectedSolutionNodes
      ]
    }
  } as const;

  const {
    dimensions,
    pinFunc,
    generateFunc,
    generateDimensionFunc,
    dependentNodes
  } = nodeToMapGenerationMap[props.nodeToGenerate];

  const handleGenerate = async () => {
    if (generating) return;

    setGenerating(true);
    const generatedNodeIds = await generateFunc();
    setGenerating(false);

    const nodesToFocus = [
      ...dependentNodes.map(({ id }) => ({ id })),
      ...generatedNodeIds.map((id) => ({ id }))
    ];

    fitView({
      nodes: nodesToFocus
    });
    selectNodes(nodesToFocus.map(({ id }) => id));
    props.onClose();
  };

  const numDimensions = dimensions.length;
  const numPinnedDimensions = dimensions.filter(
    (d) => d.currentValues.length > 0
  ).length;

  return (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      size="xl"
      title={
        <span className="text-xl font-bold">
          Generate dependent {props.nodeToGenerate}
        </span>
      }
    >
      <div className="mb-8">
        <h2 className="text-md font-bold mb-2">Selected input nodes:</h2>
        <NodeCountDisplayer nodeIds={dependentNodes.map(({ id }) => id)} />
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">Design Prompt</h2>
        <p className="text-sm mb-6">
          Enter a design prompt to start generating ideas and select which type
          of ideas you want to generate up to.
        </p>
        <Textarea
          label="Design prompt"
          className="mb-4"
          disabled={generatingDimensions || generating}
          value={designPrompt}
          onChange={(event) => setDesignPrompt(event.target.value)}
        />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Dimensions (optional)</h2>
        <p className="text-sm mb-4">
          Generate and select dimensions to steer idea generation.
        </p>
      </div>

      <Center className="flex justify-between">
        <div className="first-letter:capitalize">
          {props.nodeToGenerate} dimensions -{' '}
          <b>
            {numPinnedDimensions}/{numDimensions}
          </b>{' '}
          selected
        </div>
        <Tooltip label="Generate more dimensions">
          <ActionIcon
            variant="subtle"
            className="ml-2"
            loading={generatingDimensions}
            onClick={async () => {
              if (generatingDimensions) return;

              setGeneratingDimensions(true);
              await generateDimensionFunc(designPrompt);
              setGeneratingDimensions(false);
            }}
          >
            <Plus />
          </ActionIcon>
        </Tooltip>
      </Center>
      <div className="flex flex-col gap-4 mb-8">
        {dimensions.map((dimension) => (
          <MultiSelect
            key={dimension.id}
            label={dimension.name}
            description={dimension.description}
            placeholder="Pin dimension"
            data={dimension.values}
            value={dimension.currentValues}
            onChange={(value) => pinFunc(dimension.id, value)}
            withCheckIcon={true}
            checkIconPosition="right"
          />
        ))}
      </div>

      <Button onClick={handleGenerate}>Generate</Button>
      <LoadingOverlay visible={generating} />
    </Modal>
  );
}
