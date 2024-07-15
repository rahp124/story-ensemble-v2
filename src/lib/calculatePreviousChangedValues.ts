export function calculatePreviousChangedValues(
  previousValues: Record<string, string>,
  newValues: Record<string, string>
): Record<string, string> {
  const previousChangedEntries = Object.keys(newValues)
    .filter((key) => newValues[key] !== previousValues[key])
    .map((key) => [key, previousValues[key]] as const);
  return Object.fromEntries(previousChangedEntries);
}
