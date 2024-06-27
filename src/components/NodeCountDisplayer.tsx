import { Breadcrumbs } from '@mantine/core';
import pluralize from 'pluralize';

function countNodes(nodeIds: string[]) {
  const numPersonaNodes = nodeIds.filter((id) =>
    id.startsWith('persona-')
  ).length;
  const numProblemNodes = nodeIds.filter((id) =>
    id.startsWith('problem-')
  ).length;
  const numSolutionNodes = nodeIds.filter((id) =>
    id.startsWith('solution-')
  ).length;
  const numStoryboardNodes = nodeIds.filter((id) =>
    id.startsWith('storyboard-')
  ).length;

  return {
    numPersonaNodes,
    numProblemNodes,
    numSolutionNodes,
    numStoryboardNodes
  };
}

export function NodeCountDisplayer({ nodeIds }: { nodeIds: string[] }) {
  const {
    numPersonaNodes,
    numProblemNodes,
    numSolutionNodes,
    numStoryboardNodes
  } = countNodes(nodeIds);

  return (
    <Breadcrumbs
      separator="•"
      styles={{
        root: {
          rowGap: '10px',
          flexWrap: 'wrap'
        }
      }}
    >
      {numPersonaNodes > 0 && (
        <p className="whitespace-nowrap">
          👤 <b>{numPersonaNodes}</b> {pluralize('Persona', numPersonaNodes)}
        </p>
      )}
      {numProblemNodes > 0 && (
        <p className="whitespace-nowrap">
          🚨 <b>{numProblemNodes}</b> {pluralize('Problem', numProblemNodes)}
        </p>
      )}
      {numSolutionNodes > 0 && (
        <p className="whitespace-nowrap">
          💡 <b>{numSolutionNodes}</b> {pluralize('Solution', numSolutionNodes)}
        </p>
      )}
      {numStoryboardNodes > 0 && (
        <p className="whitespace-nowrap">
          🎞 <b>{numStoryboardNodes}</b>{' '}
          {pluralize('Storyboard', numStoryboardNodes)}
        </p>
      )}
    </Breadcrumbs>
  );
}
