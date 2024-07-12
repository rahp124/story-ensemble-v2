import { useStore as useRfStore } from 'reactflow';

export const useZoom = () => {
  const zoom = useRfStore((s) => s.transform[2]);
  const zoomShowImage = zoom < 0.7;

  return { zoomShowImage };
};
