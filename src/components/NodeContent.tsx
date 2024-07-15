import { Tooltip } from '@mantine/core';
import { capitalCase } from 'change-case';
export function NodeContent(props: {
  content: Record<string, string>;
  changedKeys?: string[];
}) {
  const { content, changedKeys = [] } = props;

  return Object.entries(content).map(([key, value]) => {
    const changed = changedKeys.includes(key);

    return (
      <div key={key}>
        <b>{capitalCase(key)}</b>:{' '}
        <Tooltip label="Value changed" disabled={!changed}>
          <span className={changed ? 'underline italic' : ''}>{value}</span>
        </Tooltip>
      </div>
    );
  });
}
