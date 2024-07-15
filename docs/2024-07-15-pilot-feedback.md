# Pilot Feedback

## Development updates

- [ ] Storyboard generation workflow
  - [ ] Allow users to generate with just a solution (but crawl up the edges)
  - [ ] Let's crawl up the dependencies (and add the edges)
  - Add helper functions for crawling dependencies

---

- [ ] Out of sync
  - Add back regenerate button for out of sync nodes (w/o modal)
- Prompt tuning
  - [ ] Less feedback
  - [ ] Do we need to save the user's intent to guide the future generations (array of instructions)
  - [ ] Switch to using system messages
- Storyboard editing
  - Caption & description confusion that both influence the image generation
  - Show the image while users change the description
  - [ ] Add a tooltip for editing individual frames
  - [ ] Art style
  - Add before and after panels
  - [ ] delete button
  - [ ] Export screenshot image
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
- [ ] Rename regenerate to update eh
