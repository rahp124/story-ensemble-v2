import { FrameOutline } from '@/api/storyboards';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import useStore from '@/store';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { NodeProps } from 'reactflow';

export interface StoryboardNodeData {
  variations: {
    title: string;
    outlines: {
      outline: (FrameOutline & { image?: string })[];
    }[];
  }[];
}
export default function StoryboardNode(props: NodeProps<StoryboardNodeData>) {
  const { id, data } = props;

  const maxVariationIndex = data.variations.length - 1;
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0);
  const variation = data.variations.at(currentVariationIndex);

  const maxOutlineIndex = variation ? variation.outlines.length - 1 : 0;
  const [currentOutlineIndex, setCurrentOutlineIndex] = useState(0);
  const outline = variation?.outlines.at(currentOutlineIndex)?.outline;

  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [generatingOutlines, setGeneratingOutlines] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);

  const {
    generateStoryboardTitles,
    generateStoryboardOutlines,
    generateStoryboardImages
  } = useStore((state) => ({
    generateStoryboardTitles: state.generateStoryboardTitles,
    generateStoryboardOutlines: state.generateStoryboardOutlines,
    generateStoryboardImages: state.generateStoryboardImages
  }));

  return (
    <Card className="w-[1200px]">
      {variation && (
        <CardHeader>
          <div className="flex gap-4 justify-between items-center">
            <Button
              variant="outline"
              size="icon"
              disabled={currentVariationIndex === 0}
              onClick={() => {
                setCurrentVariationIndex((idx) => idx - 1);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-center">{variation.title}</CardTitle>
            <Button
              variant="outline"
              size="icon"
              disabled={currentVariationIndex === maxVariationIndex}
              onClick={() => {
                setCurrentVariationIndex((idx) => idx + 1);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      )}
      {outline && (
        <CardContent className="mt-8">
          <div className="flex justify-between gap-6">
            <Button
              variant="outline"
              size="icon"
              disabled={currentOutlineIndex === 0}
              onClick={() => {
                setCurrentOutlineIndex((idx) => idx - 1);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-full flex flex-col justify-center">
              <div className="flex gap-4 justify-between mb-8">
                {outline.map((frame, idx) => {
                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-4 w-[200px] justify-between"
                    >
                      <div className="h-auto w-full">
                        {frame.image ? (
                          <img src={frame.image} />
                        ) : (
                          <p>{frame.description}</p>
                        )}
                      </div>
                      <p>{frame.caption}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={currentOutlineIndex === maxOutlineIndex}
              onClick={() => {
                setCurrentOutlineIndex((idx) => idx + 1);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
      <CardFooter className="flex justify-center">
        {!variation ? (
          <Button
            className="mt-6"
            disabled={generatingTitles}
            onClick={async () => {
              setGeneratingTitles(true);
              await generateStoryboardTitles(id);
              setGeneratingTitles(false);
            }}
          >
            Generate storyboard titles
            {generatingTitles && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </Button>
        ) : !outline ? (
          <Button
            className="pointer-events-auto"
            disabled={generatingOutlines}
            onClick={async () => {
              setGeneratingOutlines(true);
              await generateStoryboardOutlines(
                id,
                currentVariationIndex,
                variation.title
              );
              setGeneratingOutlines(false);
            }}
          >
            Generate frames
            {generatingOutlines && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </Button>
        ) : outline.some((frame) => !frame.image) ? (
          <Button
            className="w-fit m-auto"
            disabled={generatingImages}
            onClick={async () => {
              setGeneratingImages(true);
              await generateStoryboardImages(
                id,
                currentVariationIndex,
                currentOutlineIndex
              );
              setGeneratingImages(false);
            }}
          >
            Generate storyboard images
            {generatingImages && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
