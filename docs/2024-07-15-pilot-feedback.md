# Pilot Feedback

## Development updates

- [ ] Change labels to describe a brainstorm of solutions rather than a single solution
- [ ] Prompt tuning
  - [ ] Less feedback
  - [ ] Do we need to save the user's intent to guide the future generations (array of instructions)
  - [ ] Switch to using system messages
  - [ ] gpt-4o mini
- [ ] Storyboard global art style toggle
- [ ] Rename feedback to reflection questions (reflections, reflective prompts)
  - Reflect/Regenerate/Edit manually
  - Reflect/Direct/Edit
- [ ] Modals might look a little too similar
- [ ] Add a timed highlight to nodes to show that they've changed (replace selected with a recentlyHighlighted boolean)
  - [ ] Make it clear that multiple regenerate is in sequence rather than in parallel
- [ ] Out of sync image bug
- [ ] Storyboard node - resize after updating nodes
- Regenerate and update and regenerate image are confusing
  - Combine regenerate and edit (confusing) - give it feedback and other features higher priority
  - Edit (with feedback, with instructions, manually)
  - [ ] Two separate toolbars one above and below
- [ ] Telemetry
  - What do we want to track specifically
  - Export telemetry

---

- [ ] StoryEnsemble name
- [ ] Add illustrative image to the selected node preview

---

- [x] Persist API keys in session storage
- [x] Add empty nodes - right click to open a context menu and select from one of four nodes
  - [ ] Add ability to regenerate/fill in missing values
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
- [ ] Rename regenerate to update
- [ ] Storyboard editing
  - [x] Out of sync
  - [x] Add a tooltip for editing individual frames
  - [x] Add before and after panels
  - [x] delete frame button
  - [x] Edit frame type button
  - [x] Wrap frames
  - [x] Storyboard loading state + images loading state
  - [ ] Art style select (didn't implement didn't seem to have a huge impact)
  - [ ] Export screenshot image
- [x] Storyboard generation workflow
  - [x] Allow users to generate with just a solution (but crawl up the edges)
  - [x] Let's crawl up the dependencies (and add the edges)
- [x] Switch illustrative image art style
