import {
  getOpenAiKey,
  getStabilityAiKey,
  setOpenAiKey,
  setStabilityAiKey
} from '@/lib/envUtils';
import { Button, Modal, PasswordInput } from '@mantine/core';
import { useState } from 'react';

export function ApiKeyModal() {
  const [show, setShow] = useState(!getOpenAiKey() || !getStabilityAiKey());

  const [_openApiKey, _setOpenApiKey] = useState('');
  const [_stabilityApiKey, _setStabilityApiKey] = useState('');

  return (
    <Modal opened={show} onClose={() => {}} withCloseButton={false}>
      <h1 className="text-lg font-bold mb-2">Welcome to StoryEnsemble</h1>
      <p className="text-sm mb-4">
        Enter your OpenAI API key and Stability AI API key to get started.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          setOpenAiKey(_openApiKey);
          setStabilityAiKey(_stabilityApiKey);

          setShow(false);
        }}
      >
        <PasswordInput
          label="OpenAI API key"
          className="mb-4"
          required
          value={_openApiKey}
          onChange={(e) => _setOpenApiKey(e.target.value)}
        />
        <PasswordInput
          label="Stability AI API key"
          className="mb-4"
          required
          value={_stabilityApiKey}
          onChange={(e) => _setStabilityApiKey(e.target.value)}
        />
        <Button type="submit">Get started</Button>
      </form>
    </Modal>
  );
}
