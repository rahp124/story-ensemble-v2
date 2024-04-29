import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { NodeProps } from 'reactflow';

export interface SolutionNodeData {
  solution: string;
}
export default function SolutionNode(props: NodeProps<SolutionNodeData>) {
  return (
    <Card className="nowheel flex flex-col w-full h-full bg-sky-50">
      <CardHeader className="flex-none">
        <CardTitle>Solution</CardTitle>
      </CardHeader>
      <CardContent className="flex-auto overflow-auto">
        <p>{props.data.solution}</p>
      </CardContent>
      <TargetHandle />
      <SourceHandle />
    </Card>
  );
}
