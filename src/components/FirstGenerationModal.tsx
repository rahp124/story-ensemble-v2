import { useStore } from '@/store';
import {
  Button,
  Divider,
  LoadingOverlay,
  Modal,
  Select,
  Textarea
} from '@mantine/core';
import { useState } from 'react';
import { useReactFlow } from 'reactflow';

export interface FirstGenerationModal {
  opened: boolean;
  onClose: () => void;
}
export function FirstGenerationModal(props: FirstGenerationModal) {
  const { opened, onClose } = props;

  const {
    generatePersonaNodes,
    generateProblemNodes,
    generateSolutionNodes,
    generateStoryboardNode,

    selectNodes
  } = useStore((state) => ({
    generatePersonaNodes: state.generatePersonaNodes,
    generateProblemNodes: state.generateProblemNodes,
    generateSolutionNodes: state.generateSolutionNodes,
    generateStoryboardNode: state.generateStoryboardNode,

    selectNodes: state.selectNodes
  }));
  const { fitView } = useReactFlow();

  const [finalStep, setFinalStep] = useState<
    'Persona' | 'Problem' | 'Solution' | 'Storyboard'
  >('Persona');
  const [personaDescription, setPersonaDescription] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [solutionDescription, setSolutionDescription] = useState('');
  const [storyboardDescription, setStoryboardDescription] = useState('');

  const [generating, setGenerating] = useState(false);

  async function generateIdeas() {
    if (generating) return;
    setGenerating(true);

    const nodesToFocus: string[] = [];

    const personaIds = await generatePersonaNodes(personaDescription);
    nodesToFocus.push(...personaIds);

    if (finalStep !== 'Persona') {
      const problemIds = await generateProblemNodes(
        problemDescription,
        personaIds,
        true
      );
      nodesToFocus.push(...problemIds);

      if (finalStep !== 'Problem') {
        const solutionIds = await generateSolutionNodes(
          solutionDescription,
          problemIds,
          true
        );
        nodesToFocus.push(...solutionIds);

        if (finalStep !== 'Solution') {
          const middleIndex = Math.floor((personaIds.length - 1) / 2);

          const storyboardIds = await generateStoryboardNode(
            storyboardDescription,
            [personaIds[middleIndex]],
            [problemIds[middleIndex]],
            [solutionIds[middleIndex]]
          );
          nodesToFocus.push(...storyboardIds);
        }
      }
    }

    fitView({
      nodes: nodesToFocus.map((id) => ({ id })),
      duration: 1000
    });
    selectNodes(nodesToFocus);

    setGenerating(false);
    onClose();

    setPersonaDescription('');
    setProblemDescription('');
    setSolutionDescription('');
    setStoryboardDescription('');
    setFinalStep('Persona');
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={<span className="text-lg font-bold">Start brainstorming</span>}
    >
      <div className="relative">
        <LoadingOverlay visible={generating} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateIdeas();
          }}
        >
          <Select
            label="Design thinking step"
            description="Select the design thinking step you want to generate up to. Starting from personas, ideas will be generated for each step up to and including the selected step."
            className="mb-4"
            data={['Persona', 'Problem', 'Solution', 'Storyboard']}
            value={finalStep}
            onChange={setFinalStep as (value: string | null) => void}
            allowDeselect={false}
          />

          <Divider my="lg" />

          {[
            {
              show: true,
              label: 'Persona description',
              description:
                'Roughly describe the personas you want to generate.',
              value: personaDescription,
              onChange: setPersonaDescription
            },
            {
              show: finalStep !== 'Persona',
              label: 'Problem description',
              description:
                'Roughly describe the problems you want to generate.',
              value: problemDescription,
              onChange: setProblemDescription
            },
            {
              show: finalStep !== 'Persona' && finalStep !== 'Problem',
              label: 'Solution description',
              description:
                'Roughly describe the solutions you want to generate.',
              value: solutionDescription,
              onChange: setSolutionDescription
            },
            {
              show: finalStep === 'Storyboard',
              label: 'Storyboard description',
              description:
                'Roughly describe the storyboard you want to generate.',
              value: storyboardDescription,
              onChange: setStoryboardDescription
            }
          ]
            .filter(({ show }) => show)
            .map(({ label, description, value, onChange }) => (
              <Textarea
                key={label}
                label={label}
                description={description}
                className="mb-4"
                autosize
                minRows={3}
                maxRows={8}
                value={value}
                onChange={(event) => onChange(event.currentTarget.value)}
              />
            ))}
          <Button type="submit">Generate ideas</Button>
        </form>
      </div>
    </Modal>
  );
}
