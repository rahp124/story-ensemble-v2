# Pilot Feedback

## Development updates

- [ ] Storyboard editing
  - [x] Out of sync
  - [ ] Add a tooltip for editing individual frames
  - [ ] Add before and after panels
  - [ ] delete frame button
  - [x] Edit frame type button
  - [ ] Wrap frames
  - [ ] Art style
  - [ ] Export screenshot image
- [ ] Storyboard generation workflow
  - [ ] Allow users to generate with just a solution (but crawl up the edges)
  - [ ] Let's crawl up the dependencies (and add the edges)
  - Add helper functions for crawling dependencies
- [ ] Switch illustrative image art style
- [ ] Add illustrative image to the selected node preview
- [ ] Change labels to describe a brainstorm of solutions rather than a single solution

---

- Regenerate and update and regenerate image are confusing
  - Combine regenerate and edit (confusing) - give it feedback and other features higher priority
  - Edit (with feedback, with instructions, manually)
  - [ ] Two separate toolbars one above and below
- [ ] Regenerate multiple (might not be useful) - keep editing on the card
- [ ] Storyboard loading state + images loading state
- [ ] Telemetry
  - What do we want to track specifically
  - Export telemetry

---

- [ ] StoryEnsemble name
- [ ] Prompt tuning
  - [ ] Less feedback
  - [ ] Do we need to save the user's intent to guide the future generations (array of instructions)
  - [ ] Switch to using system messages
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
- [ ] Rename regenerate to update eh
