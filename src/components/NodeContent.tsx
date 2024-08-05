import { Tooltip } from '@mantine/core';
import { capitalCase, noCase } from 'change-case';
export function NodeContent(props: {
  content: Record<string, string>;
  previousChangedValues?: Record<string, string>;
}) {
  const { content, previousChangedValues = {} } = props;

  return Object.entries(content).map(([key, value]) => {
    const previousChangedValue = previousChangedValues[key];

    return (
      <div key={key}>
        <b>{capitalCase(key)}</b>:{' '}
        <Tooltip
          label={
            <>
              <b>Previous {noCase(key)}:</b> {previousChangedValue}
            </>
          }
          disabled={!previousChangedValue}
        >
          <span
            className={
              previousChangedValue ? 'underline decoration-dotted italic' : ''
            }
          >
            {value}
          </span>
        </Tooltip>
      </div>
    );
  });
}
