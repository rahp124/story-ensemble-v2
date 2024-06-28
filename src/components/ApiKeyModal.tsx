import {
  getOpenAiKey,
  getStabilityAiKey,
  setOpenAiKey,
  setStabilityAiKey,
  validateOpenAiKey,
  validateStabilityAiKey
} from '@/lib/envUtils';
import { Button, Modal, PasswordInput } from '@mantine/core';
import { FormEvent, useState } from 'react';

export function ApiKeyModal() {
  const [show, setShow] = useState(!getOpenAiKey() || !getStabilityAiKey());

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

    const errors = await Promise.all([
      await validateOpenAiKey(_openAiKey).then(({ error }) => {
        if (error) {
          setOpenAiError(
            'Invalid OpenAI API key. Please double check your key.'
          );
        }
        return error;
      }),
      await validateStabilityAiKey(_stabilityAiKey).then(
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
      )
    ]);

    const isErrors = errors.some((isError) => isError);

    if (!isErrors) {
      setOpenAiKey(_openAiKey);
      setStabilityAiKey(_stabilityAiKey);

      setShow(false);
    }

    setSubmitting(false);
  };

  return (
    <Modal opened={show} onClose={() => {}} withCloseButton={false}>
      <h1 className="text-lg font-bold mb-2">Welcome to StoryEnsemble</h1>
      <p className="text-sm mb-4">
        Enter your OpenAI API key and Stability AI API key to get started.
      </p>

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
          label="Stability AI API key"
          className="mb-4"
          required
          value={_stabilityAiKey}
          onChange={(e) => _setStabilityAiKey(e.target.value)}
          error={stabilityAiError}
        />
        <Button type="submit">Get started</Button>
      </form>
    </Modal>
  );
}
