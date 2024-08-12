import { ProjectTheme, ProjectThemesProps } from '@/data/projects';
import { useStore } from '@/store';

export const ProjectThemesList: React.FC<ProjectThemesProps> = ({
  projectThemes,
  ...restProps
}) => {
  const closeModal = restProps.close;

  const { addProjectNode } = useStore((state) => ({
    addProjectNode: state.addProjectNode
  }));

  const handleClick = (projectTheme: ProjectTheme) => {
    addProjectNode(projectTheme as unknown as Record<string, string>);
    closeModal();
  };

  return (
    <div style={{ padding: '10px' }}>
      {projectThemes.map((projectTheme, index) => (
        <div
          className="project"
          key={index}
          style={{
            marginBottom: '20px',
            border: '1px solid gray',
            borderRadius: '10px',
            padding: '10px'
          }}
          onClick={() => handleClick(projectTheme)}
        >
          <h1>
            <strong>{projectTheme.theme}</strong>
          </h1>
          <p>
            <strong>Background:</strong> {projectTheme.background}
          </p>
          <p>
            <strong>Task:</strong> {projectTheme.task}
          </p>
        </div>
      ))}
    </div>
  );
};
