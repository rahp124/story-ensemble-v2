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
        <span className="font-semibold">{capitalCase(key)}</span>:{' '}
        <Tooltip
          label={
            <>
              <span className="font-semibold">Previous {noCase(key)}:</span>{' '}
              {previousChangedValue}
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
