import { capitalCase } from 'change-case';
export function NodeContent(props: { content: Record<string, string> }) {
  const { content } = props;

  return Object.entries(content).map(([key, value]) => (
    <div key={key}>
      <b>{capitalCase(key)}</b>: {value}
    </div>
  ));
}
