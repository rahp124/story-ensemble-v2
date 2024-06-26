import { useStore } from '@/store';
import {
  Modal,
  Stepper,
  Textarea,
  Select,
  Button,
  LoadingOverlay,
  Loader,
  MultiSelect
} from '@mantine/core';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

export interface GenerationModalProps {
  opened: boolean;
  onClose: () => void;
}
export function GenerationModal(props: GenerationModalProps) {
  const {
    personaDimensions,
    pinPersonaDimension,
    problemDimensions,
    pinProblemDimension,
    solutionDimensions,
    pinSolutionDimension,
    storyboardDimensions,
    pinStoryboardDimension
  } = useStore(
    useShallow((state) => ({
      personaDimensions: state.personaDimensions,
      pinPersonaDimension: state.pinPersonaDimension,
      problemDimensions: state.problemDimensions,
      pinProblemDimension: state.pinProblemDimension,
      solutionDimensions: state.solutionDimensions,
      pinSolutionDimension: state.pinSolutionDimension,
      storyboardDimensions: state.storyboardDimensions,
      pinStoryboardDimension: state.pinStoryboardDimension
    }))
  );

  const [active, setActive] = useState(0);

  const [designPrompt, setDesignPrompt] = useState('');
  const [finalStep, setFinalStep] = useState<
    'Persona' | 'Problem' | 'Solution' | 'Storyboard'
  >('Storyboard');
  const [generatingDimensions, setGeneratingDimensions] = useState(false);

  const dimensions = [
    {
      title: 'Persona',
      dimensions: personaDimensions,
      pinFunc: pinPersonaDimension
    },
    {
      title: 'Problem',
      dimensions: problemDimensions,
      pinFunc: pinProblemDimension
    },
    {
      title: 'Solution',
      dimensions: solutionDimensions,
      pinFunc: pinSolutionDimension
    },
    {
      title: 'Storyboard',
      dimensions: storyboardDimensions,
      pinFunc: pinStoryboardDimension
    }
  ];

  return (
    <Modal opened={props.opened} onClose={props.onClose} size="xl">
      <Stepper active={active}>
        <Stepper.Step label="Design prompt">
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setGeneratingDimensions(true);
              setTimeout(() => {
                setGeneratingDimensions(false);
                setActive(1);
              }, 1000);
            }}
          >
            <Textarea
              label="Design prompt"
              value={designPrompt}
              onChange={(event) => setDesignPrompt(event.target.value)}
            />
            <Select
              label="Final step"
              description="Select the step of the design process to generate up to"
              data={['Persona', 'Problem', 'Solution', 'Storyboard']}
              value={finalStep}
              onChange={(value) =>
                setFinalStep(
                  value as 'Persona' | 'Problem' | 'Solution' | 'Storyboard'
                )
              }
            />
            <Button type="submit">Generate dimensions</Button>
            <LoadingOverlay
              visible={generatingDimensions}
              loaderProps={{
                children: (
                  <div className="flex flex-col justify-center items-center gap-2">
                    <Loader />
                    <p>Generating dimensions...</p>
                  </div>
                )
              }}
            />
          </form>
        </Stepper.Step>
        <Stepper.Step label="Select dimensions">
          {dimensions.map(({ title, dimensions, pinFunc }) => (
            <div key={title} className="mb-8">
              <h2 className="text-lg font-bold mb-4">{title}</h2>
              <div className="flex flex-col gap-2">
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
            </div>
          ))}
        </Stepper.Step>
      </Stepper>
    </Modal>
  );
}
