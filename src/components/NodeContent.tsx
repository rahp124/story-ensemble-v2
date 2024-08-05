import { Tooltip } from '@mantine/core';
import { capitalCase, noCase } from 'change-case';

export function NodeContentValue(props: {
  value: string;
  previousChangedValue?: string;
}) {
  const { value, previousChangedValue } = props;

  return (
    <Tooltip
      label={
        <>
          <span className="font-semibold">Previous value:</span>{' '}
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
  );
}

export function SingleNodeContent(props: {
  itemKey: string;
  value: string;
  previousChangedValue?: string;
}) {
  const { itemKey, value, previousChangedValue } = props;

  return (
    <div>
      <span className="font-semibold">{capitalCase(itemKey)}</span>:{' '}
      <Tooltip
        label={
          <>
            <span className="font-semibold">Previous {noCase(itemKey)}:</span>{' '}
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
}

export function NodeContent(props: {
  content: Record<string, string>;
  previousChangedValues?: Record<string, string>;
}) {
  const { content, previousChangedValues = {} } = props;

  return Object.entries(content).map(([key, value]) => {
    const previousChangedValue = previousChangedValues[key];

    return (
      <SingleNodeContent
        key={key}
        itemKey={key}
        value={value}
        previousChangedValue={previousChangedValue}
      />
    );
  });
}
