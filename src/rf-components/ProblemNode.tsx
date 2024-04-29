import SourceHandle from '@/components/SourceHandle';
import TargetHandle from '@/components/TargetHandle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { NodeProps } from 'reactflow';

export interface ProblemNodeData {
  problem: string;
}
export default function ProblemNode(props: NodeProps<ProblemNodeData>) {
  return (
    <Card className="nowheel flex flex-col w-full h-full bg-red-50">
      <CardHeader className="flex-none">
        <CardTitle>Problem</CardTitle>
      </CardHeader>
      <CardContent className="flex-auto overflow-auto">
        <p>{props.data.problem}</p>
      </CardContent>
      <TargetHandle />
      <SourceHandle />
    </Card>
  );
}
