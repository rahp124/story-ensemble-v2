# Pilot Next Steps

## Key Findings

**It's difficult for users to iterate on ideas**

Overall, it felt difficult for users to iterate on ideas, regeneration often didn't work as users hoped which forced users to manually make changes.

- Need to better capture and automate the edit intents of users
  - Users required too much manual editing.
  - Consider letting users edit node(s) using natural language instructions for the changes they would like to make. This could integrate with the existing feedback features.
- Regenerate is currently too strong and causes users to lose their edits since it only takes into account dependencies and dimensions.
  - Add option for regenerate to create a new node
  - Give a warning that regeneration replaces the current content. Make undo-redo more obvious
  - Change the regenerate behavior to take into account the current content (however, then it's unclear what changes should be made)

**Feedback**

Overall feedback generation quality was good, but not actionable.

- Let users accept and apply feedback
- Allow users to apply their own feedback (could be similar to regenerate feature)
- Feedback list a little bit too long

**Dimensions**

The role of dimensions was unclear throughout the system.

- It was unclear how dimensions influence the generation, i.e.,users must select values.
- It was unclear that the design prompt affected dimension generation
- Dimensions w/o multi-output doesn't really make sense

**Variation Exploration**

Users didn't gravitate towards using the copy-and-paste features to explore the design space.

- Make copy-and-paste and duplication functionality more obvious
- Switch back to multi-output generation

**Tutorial**

User didn't use many of the features and potential alternative workflows as they weren't presented or given emphasis during the tutorial.

## Missing Features/Bugs

**Storyboard Node**

- Customization (art-style)
- Fix storyboard feedback
- Enable storyboard dimension updates
- Add ability to regenerate individual frames
- Add ability to customize the number of frames

**Feedback bugs**

- Allow users to generate feedback for a single group of nodes instead of all nodes

**Dimension Actions**

- Replace dimensions
- Delete individual dimensions
- Add dimensions and dimension values

**Prompt tuning**

- Idea text might be too long for persona, problem, and solutions
- Dimensions might overlap with other nodes like personas, problem, or solution
- Illustrative image is not super helpful

**Misc**

- Clear canvas button
- Semantic zoom to illustrative image (this might be too jarring)

## Usability Issues

- Test navigation scenarios
  - Mouse users
  - Windows
- Zoom on textarea focus feels too jarring
