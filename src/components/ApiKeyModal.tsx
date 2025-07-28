import {
  getOpenAiKey,
  setOpenAiKey,
  setStabilityAiKey,
  validateOpenAiKey,
  validateStabilityAiKey
} from '@/lib/envUtils';
import { Button, Divider, Modal, PasswordInput } from '@mantine/core';
import { FormEvent, useState } from 'react';

export function ApiKeyModal() {
  const [show, setShow] = useState(!getOpenAiKey());

  const [_openAiKey, _setOpenAiKey] = useState('');
  const [openAiError, setOpenAiError] = useState('');
  const [_stabilityAiKey, _setStabilityAiKey] = useState('');
  const [stabilityAiError, setStabilityAiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setOpenAiError('');
    setStabilityAiError('');

    // Only validate OpenAI key (required)
    const openAiError = await validateOpenAiKey(_openAiKey).then(
      ({ error }) => {
        if (error) {
          setOpenAiError(
            'Invalid OpenAI API key. Please double check your key.'
          );
        }
        return error;
      }
    );

    // Only validate Stability AI key if provided (optional)
    let stabilityAiError = false;
    if (_stabilityAiKey.trim()) {
      stabilityAiError = await validateStabilityAiKey(_stabilityAiKey).then(
        (validationResponse) => {
          if (validationResponse.error === 'INVALID_API_KEY') {
            setStabilityAiError(
              'Invalid Stability AI API key. Please double check your key.'
            );
          } else if (validationResponse.error === 'INSUFFICIENT_CREDITS') {
            setStabilityAiError(
              `Insufficient credits: ${validationResponse.credits}. Please top up your credits and try again.`
            );
          }

          return !!validationResponse.error;
        }
      );
    }

    const hasErrors = openAiError || stabilityAiError;

    if (!hasErrors) {
      setOpenAiKey(_openAiKey);
      if (_stabilityAiKey.trim()) {
        setStabilityAiKey(_stabilityAiKey);
      }

      setShow(false);
    }

    setSubmitting(false);
  };

  return (
    <Modal opened={show} onClose={() => {}} withCloseButton={false}>
      <h1 className="text-lg font-bold mb-2">Welcome to StoryEnsemble</h1>
      <div className="mb-4">
        <p className="mb-3">
          StoryEnsemble is an interactive system designed to help users rapidly
          explore and flexibly iterate on personas, problem statements,
          solutions, and storyboards. Input an OpenAI API key to get started.
        </p>

        <Divider my="md" />

        <p className="mb-3">
          OpenAI's GPT-4o handles text generation, while DALL-E 3 serves as a
          fallback for image generation. For the best experience, we recommend
          adding a Stability AI key - this project was developed and tested with
          Stability AI's Stable Image Core, so the style presets and aspect
          ratios are optimized for their API.
        </p>
        <p className="text-sm">
          API keys are stored in sessionStorage and are not persisted or shared
          between sessions. A complete generation from persona to storyboard
          will cost roughly 12-24 image generations and 8,000-16,000 GPT-4o
          input and output tokens.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <PasswordInput
          label="OpenAI API key"
          className="mb-4"
          required
          value={_openAiKey}
          onChange={(e) => _setOpenAiKey(e.target.value)}
          error={openAiError}
        />
        <PasswordInput
          label="Stability AI API key (optional)"
          className="mb-4"
          value={_stabilityAiKey}
          onChange={(e) => _setStabilityAiKey(e.target.value)}
          error={stabilityAiError}
        />
        <Button type="submit">Get started</Button>
      </form>
    </Modal>
  );
}
