export interface ProjectTheme {
    theme: string;
    background: string;
    task: string;
}

export interface ProjectThemesProps {
    projectThemes: ProjectTheme[];
    [key: string]: any; // This allows for any additional prop
}

export const projectThemes: ProjectTheme[] = 
[
    {
        "theme": "[User-defined project]",
        "background": "",
        "task": "Design a solution that addresses the issue."
    },
    {
        "theme": "Accessibility in Public Spaces",
        "background": "Public spaces are essential for community interaction, but they are often not fully accessible to all individuals. This can create barriers to participation and inclusion.",
        "task": "Design a solution that enhances accessibility in public spaces for diverse users."
    },
    {
        "theme": "Sustainable Living",
        "background": "Environmental sustainability is becoming increasingly important, but many people struggle to incorporate sustainable practices into their daily lives.",
        "task": "Create a way to encourage and support sustainable living practices."
    },
    {
        "theme": "Digital Wellbeing",
        "background": "The pervasive use of digital devices can lead to challenges in maintaining a balanced lifestyle, impacting both mental and physical health.",
        "task": "Develop a solution that promotes healthy digital habits."
    },
    {
        "theme": "Remote Work Collaboration",
        "background": "The rise of remote work has transformed how teams collaborate, bringing new challenges in communication, coordination, and maintaining a sense of connection.",
        "task": "Improve the experience of remote team collaboration."
    },
    {
        "theme": "Health and Wellness Tracking",
        "background": "Tracking health and wellness metrics can help individuals lead healthier lives, but existing tools often fail to engage users consistently.",
        "task": "Design a tool that helps users engage with their health and wellness."
    },
    {
        "theme": "Education and Learning",
        "background": "Educational experiences vary widely in effectiveness, often depending on how well they cater to individual learning needs and styles.",
        "task": "Enhance educational experiences by addressing diverse learning needs."
    },
    {
        "theme": "Smart Home Interfaces",
        "background": "As smart home technology becomes more prevalent, users face challenges in managing multiple devices with varying levels of complexity.",
        "task": "Simplify and improve the interaction with smart home technology."
    },
    {
        "theme": "Community Engagement",
        "background": "Community engagement is essential for fostering strong, connected neighborhoods, but participation is often low due to a lack of awareness or accessible platforms.",
        "task": "Encourage and facilitate community involvement and participation."
    },
    {
        "theme": "Financial Literacy",
        "background": "Many individuals struggle with managing their finances due to a lack of accessible and engaging educational resources.",
        "task": "Help users better understand and manage their finances."
    },
    {
        "theme": "Transportation and Mobility",
        "background": "Urban mobility is a critical issue, with challenges such as traffic congestion, inefficient public transport, and accessibility for people with disabilities.",
        "task": "Improve urban mobility and the user experience of transportation."
    },
    {
        "theme": "Social Good and Nonprofit Support",
        "background": "Nonprofits play a vital role in addressing societal challenges, but they often struggle with limited resources to connect with volunteers, donors, and beneficiaries.",
        "task": "Support nonprofits in better engaging with their communities."
    },
    {
        "theme": "Mental Health Support",
        "background": "Mental health is a growing concern, yet many people hesitate to seek help due to stigma or a lack of accessible resources. Digital tools can offer discreet and accessible support.",
        "task": "Provide accessible support for mental health and well-being."
    },
    {
        "theme": "Elderly Care",
        "background": "As the population ages, there is a growing need for technology that supports the independence and well-being of older adults. However, many digital solutions are not designed with this demographic in mind.",
        "task": "Enhance the quality of life and independence for elderly users."
    },
    {
        "theme": "Cultural Heritage Preservation",
        "background": "Cultural heritage is at risk of being lost, especially as communities become more globalized and digital. Preserving and sharing this heritage digitally can keep traditions alive.",
        "task": "Preserve and share cultural heritage in an engaging way."
    },
    {
        "theme": "Gamification of Learning",
        "background": "Gamification has been shown to increase engagement and motivation in learning, but its application in education is still evolving. Effective design is key to balancing fun and educational value.",
        "task": "Make learning more engaging through innovative approaches."
    },
    {
        "theme": "Inclusive Fitness",
        "background": "Fitness apps often cater to a narrow demographic, leaving out users with different abilities or those new to fitness. Inclusivity in fitness technology can promote healthier lifestyles for all.",
        "task": "Create an inclusive approach to fitness for diverse users."
    },
    {
        "theme": "Crisis Management",
        "background": "Natural disasters, pandemics, and other crises require quick and effective communication and coordination. Current tools often fall short in providing timely, accurate, and accessible information.",
        "task": "Improve preparedness and response in crisis situations."
    },
    {
        "theme": "Personalized News Consumption",
        "background": "The rise of digital news has led to concerns about echo chambers and misinformation. Users need tools that allow them to consume news that is both personalized and balanced.",
        "task": "Enable personalized and balanced news consumption."
    },
    {
        "theme": "Urban Gardening",
        "background": "Urban environments often lack space for traditional gardening, yet there is a growing interest in sustainable living and self-sufficiency through urban gardening.",
        "task": "Support urban gardening in limited spaces effectively."
    },
    {
        "theme": "Youth Empowerment",
        "background": "Young people have the potential to drive social change, but they often lack the tools and resources needed to become effective leaders and advocates in their communities.",
        "task": "Empower young people to take action on issues they care about."
    }
]