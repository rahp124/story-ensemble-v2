# Pilot Feedback

## Development updates

- [ ] Extend regenerate out of sync to regenerate the entire tree
- [ ] Store visualize changes globally and display inside and outside of the modal
  - [ ] Out of sync image bug - part of refactor - bad loading states
- [ ] Add a timed highlight to nodes to show that they've changed (replace selected with a recentlyHighlighted boolean)
  - [ ] Make it clear that multiple regenerate is in sequence rather than in parallel

---

- [ ] Storyboard global art style toggle
- [ ] Rename feedback to reflection questions (reflections, reflective prompts)
  - Reflect/Regenerate/Edit manually
  - Reflect/Direct/Edit

---

- Regenerate and update and regenerate image are confusing
  - Combine regenerate and edit (confusing) - give it feedback and other features higher priority
  - Edit (with feedback, with instructions, manually)
  - [ ] Two separate toolbars one above and below
- [ ] Telemetry
  - What do we want to track specifically
  - Export telemetry

---

- [ ] Prompt tuning - adjust fields to be generated
- [ ] Prompt tuning - Less feedback
- [ ] Switch to using system messages
- [ ] gpt-4o mini
- [ ] Do we need to save the user's intent to guide the future generations (array of instructions)
- [ ] Modals might look a little too similar

---

- [ ] StoryEnsemble name
- [ ] Add illustrative image to the selected node preview

---

- [x] Persist API keys in session storage
- [x] Add empty nodes - right click to open a context menu and select from one of four nodes
  - [x] Add ability to regenerate/fill in missing values
- [x] Generate/regenerate multiple storyboards - Leave it and see if there is anymore feedback
- [x] Copy and paste - add to tutorial DONE
- [x] Make it clear what regenerate has updated - tweak the styling
- [x] Undo-and-redo - disable feature
- Recommendations
  - [x] Select multiple recommendations
  - [x] Add recommendations to regenerate
- [x] Prevent closing modals while generating (DONT)
  - Use the user's start location
  - Use a loading notification to show it generating and add the ability to hop to the nodes
  - Apply to first generation, generate more, dependent generation
- [x] Feedback regenerating after updates is distracting - Add labels to the loading states
- [x] Out of sync
  - Add back regenerate button for out of sync nodes (w/o modal)
- [ ] Storyboard editing
  - [x] Out of sync
  - [x] Add a tooltip for editing individual frames
  - [x] Add before and after panels
  - [x] delete frame button
  - [x] Edit frame type button
  - [x] Wrap frames
  - [x] Storyboard loading state + images loading state
  - [ ] Export screenshot image
- [x] Storyboard generation workflow
  - [x] Allow users to generate with just a solution (but crawl up the edges)
  - [x] Let's crawl up the dependencies (and add the edges)
- [x] Switch illustrative image art style
- [x] Storyboard node - resize after updating nodes
- [x] Change labels to describe a brainstorm of solutions rather than a single solution
- [x] Extend generate dependent to add the option to generate the entire chain
