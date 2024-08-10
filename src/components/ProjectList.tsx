import { ProjectTheme, ProjectThemesProps } from "@/data/projects";
import { useStore } from '@/store';

export const ProjectThemesList: React.FC<ProjectThemesProps> = ({ projectThemes, ...restProps }) => {
    const closeModal = restProps.close;

    const {
        addCommentNode,
      } = useStore((state) => ({
        addCommentNode: state.addCommentNode,
      }));

    const handleClick = (projectTheme: ProjectTheme) => {
        addCommentNode(
            'Theme \n' + projectTheme.theme + '\n' + 
            'Background \n' + projectTheme.background + '\n' + 
            'Task \n' + projectTheme.task
        )
        closeModal();
    }

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
                        padding: '10px',
                    }}
                    onClick={() => handleClick(projectTheme)}
                >
                    <h1><strong>{projectTheme.theme}</strong></h1>
                    <p><strong>Background:</strong> {projectTheme.background}</p>
                    <p><strong>Task:</strong> {projectTheme.task}</p>
                </div>
            ))}
        </div>
    );
};