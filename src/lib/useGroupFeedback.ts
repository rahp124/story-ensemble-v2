import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';

export function useGroupFeedback() {
  const { groupFeedback, generateGroupFeedback } = useStore(
    useShallow((state) => ({
      groupFeedback: state.groupFeedback,
      generateGroupFeedback: state.generateGroupFeedback
    }))
  );

  return { groupFeedback, generateGroupFeedback };
}
