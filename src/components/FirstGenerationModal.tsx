import { useStore } from '@/store';
import {
  Anchor,
  Button,
  Divider,
  LoadingOverlay,
  Modal,
  Select,
  Textarea
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { useReactFlow } from 'reactflow';

export interface FirstGenerationModal {
  opened: boolean;
  onClose: () => void;
}
export function FirstGenerationModal(props: FirstGenerationModal) {
  const { opened, onClose } = props;

  const {
    addCommentNode,

    generatePersonaNodes,
    generateProblemNodes,
    generateSolutionNodes,
    generateStoryboardNode,

    selectNodes
  } = useStore((state) => ({
    addCommentNode: state.addCommentNode,

    generatePersonaNodes: state.generatePersonaNodes,
    generateProblemNodes: state.generateProblemNodes,
    generateSolutionNodes: state.generateSolutionNodes,
    generateStoryboardNode: state.generateStoryboardNode,

    selectNodes: state.selectNodes
  }));
  const { fitView } = useReactFlow();

  const [finalStep, setFinalStep] = useState<
    '👤 Persona' | '🚨 Problem' | '💡 Solution' | '🎞 Storyboard'
  >('🎞 Storyboard');
  const [designContext, setDesignContext] = useState('');
  const [personaDescription, setPersonaDescription] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [solutionDescription, setSolutionDescription] = useState('');
  const [storyboardDescription, setStoryboardDescription] = useState('');

  const [generating, setGenerating] = useState(false);

  async function generateIdeas() {
    if (generating) return;
    setGenerating(true);

    const notificationId = notifications.show({
      title: 'Generating ideas',
      message: 'Generating personas...',

      loading: true,
      autoClose: false,
      withCloseButton: false
    });
    onClose();

    const nodesToFocus: string[] = [];

    const commentId = addCommentNode(designContext);

    const personaIds = await generatePersonaNodes(
      `${designContext}\n${personaDescription}`,
      undefined,
      [commentId]
    );
    nodesToFocus.push(...personaIds);

    if (finalStep !== '👤 Persona') {
      notifications.update({
        id: notificationId,
        message: 'Generating problems...'
      });

      const problemIds = await generateProblemNodes(
        `${designContext}\n${problemDescription}`,
        personaIds,
        true
      );
      nodesToFocus.push(...problemIds);

      if (finalStep !== '🚨 Problem') {
        notifications.update({
          id: notificationId,
          message: 'Generating solutions...'
        });

        const solutionIds = await generateSolutionNodes(
          `${designContext}\n${solutionDescription}`,
          problemIds,
          true
        );
        nodesToFocus.push(...solutionIds);

        if (finalStep !== '💡 Solution') {
          notifications.update({
            id: notificationId,
            message: 'Generating storyboard...'
          });

          const middleIndex = Math.floor((personaIds.length - 1) / 2);

          const storyboardIds = await generateStoryboardNode(
            `${designContext}\n${storyboardDescription}`,
            [personaIds[middleIndex]],
            [problemIds[middleIndex]],
            [solutionIds[middleIndex]]
          );
          nodesToFocus.push(...storyboardIds);
        }
      }
    }

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

    setDesignContext('');
    setPersonaDescription('');
    setProblemDescription('');
    setSolutionDescription('');
    setStoryboardDescription('');
    setFinalStep('👤 Persona');
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
            required
            data={['👤 Persona', '🚨 Problem', '💡 Solution', '🎞 Storyboard']}
            value={finalStep}
            onChange={setFinalStep as (value: string | null) => void}
            allowDeselect={false}
          />
          <Textarea
            label="Design context"
            description="Describe the context you are designing for. Descriptions for specific design thinking steps can be added below."
            className="mb-4"
            required
            autosize
            minRows={3}
            maxRows={8}
            value={designContext}
            onChange={(event) => setDesignContext(event.currentTarget.value)}
          />

          <Divider my="lg" label="Specific node ideas (optional)" />

          {[
            {
              show: true,
              label: '👤 Persona ideas',
              description:
                'Provide initial ideas and context for the personas you want to generate.',
              value: personaDescription,
              onChange: setPersonaDescription
            },
            {
              show: finalStep !== '👤 Persona',
              label: '🚨 Problem ideas',
              description:
                'Provide initial ideas and context for the problems you want to generate.',
              value: problemDescription,
              onChange: setProblemDescription
            },
            {
              show: finalStep !== '👤 Persona' && finalStep !== '🚨 Problem',
              label: '💡 Solution ideas',
              description:
                'Provide initial ideas and context for the solutions you want to generate.',
              value: solutionDescription,
              onChange: setSolutionDescription
            },
            {
              show: finalStep === '🎞 Storyboard',
              label: '🎞 Storyboard description',
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
                minRows={1}
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
