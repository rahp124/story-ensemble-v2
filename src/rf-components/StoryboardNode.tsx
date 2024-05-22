import { FrameOutline } from '@/api/storyboards';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { useStore } from '@/store';
import { ChevronLeft, ChevronRight, Code, Loader2 } from 'lucide-react';
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

  const arrowsDisabled =
    generatingTitles || generatingOutlines || generatingImages;

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
              disabled={currentVariationIndex === 0 || arrowsDisabled}
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
              disabled={
                currentVariationIndex === maxVariationIndex || arrowsDisabled
              }
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
              disabled={currentOutlineIndex === 0 || arrowsDisabled}
              onClick={() => {
                setCurrentOutlineIndex((idx) => idx - 1);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-full grid grid-cols-4 gap-4">
              {outline.map((frame, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 border-2 border-black rounded-sm pb-2 relative"
                  >
                    <div className="w-full">
                      {frame.image ? (
                        <img src={frame.image} />
                      ) : (
                        <p className="p-1">{frame.description}</p>
                      )}
                    </div>
                    {frame.image && (
                      <HoverCard openDelay={100}>
                        <HoverCardTrigger
                          asChild
                          className="absolute top-1 right-1"
                        >
                          <Button variant="outline" size="icon">
                            <Code className="h-4 w-4" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="flex flex-col gap-4">
                          <p className="mb-2">
                            <b>Prompt</b>: {frame.imagePrompt}
                          </p>
                          <p>
                            <b>Negative prompt</b>: {frame.imageNegativePrompt}
                          </p>
                          <Button variant="secondary">Regenerate image</Button>
                        </HoverCardContent>
                      </HoverCard>
                    )}
                    {frame.image && (
                      <p className="text-sm text-center">{frame.caption}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={
                currentOutlineIndex === maxOutlineIndex || arrowsDisabled
              }
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
