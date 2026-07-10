import { Modal } from '@mantine/core';

export type ImagePreviewResult = { image: string; caption?: string };

export type ImageComparisonChoice = 'original' | 'updated';

interface AestheticUpdateComparisonModalProps {
  opened: boolean;
  original: ImagePreviewResult;
  preview: ImagePreviewResult;
  onSelect: (choice: ImageComparisonChoice) => void;
  onClose: () => void;
}

function ComparisonColumn({
  label,
  image,
  caption,
  onClick
}: {
  label: string;
  image: string;
  caption?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 text-left rounded-xl border-2 border-gray-200 p-3 transition-colors hover:border-blue-500 hover:bg-blue-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden aspect-square flex items-center justify-center">
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-cover" />
        ) : (
          <p className="text-sm text-gray-500 px-4 text-center">No image</p>
        )}
      </div>
      {caption !== undefined && caption !== '' && (
        <p className="text-sm text-gray-600 italic leading-relaxed">
          &ldquo;{caption}&rdquo;
        </p>
      )}
    </button>
  );
}

export function AestheticUpdateComparisonModal({
  opened,
  original,
  preview,
  onSelect,
  onClose
}: AestheticUpdateComparisonModalProps) {
  const handleClose = () => {
    onSelect('original');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="90%"
      centered
      title="Choose which version to keep"
    >
      <p className="text-sm text-gray-500 mb-4">Click an image to accept it.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComparisonColumn
          label="Current"
          image={original.image}
          caption={original.caption}
          onClick={() => onSelect('original')}
        />
        <ComparisonColumn
          label="Updated"
          image={preview.image}
          caption={preview.caption}
          onClick={() => onSelect('updated')}
        />
      </div>
    </Modal>
  );
}
