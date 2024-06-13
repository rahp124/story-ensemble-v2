# Abstract Contribution

This document aims to brainstorm some of the key contributions of this systems research paper in order to guide the UI/UX decisions.

At a high-level our system aims to use generative AI to support users through the design-thinking process.

The following are some possible contributions for the system and their implications:

## Encourage exploration of the design space

**Motivation:**

- **Luminate:** Generative AI systems tend to prematurely fixate on a small set of ideas
- **Luminate:** Structured, multi-output generation can support the full exploration of a design space
- Aim to reduce the impact of designer bias in brainstorming

**Implications:**

- **Luminate:** Provide UI/UX for exploring multiple outputs
- Con: These contributions feel too similar to Luminate's contributions

## Support iterative, non-linear, multi-step design thinking workflows

**Motivation:**

- Generalized chat interfaces may struggle with iterative, non-linear, and multi-step workflows (not sure if true)
  - For iterative outputs, existing interfaces regenerate the entire output, even if previous steps have already been determined
  - For non-linear thinking it may be necessary to update all existing outputs to account for changes in prior steps
  - Chat interfaces make it difficult to constrain work within a single step before moving on the the next step
- **Key contribution**: Provide a structured interface which supports multi-step, iterative, non-linear workflows, specifically design thinking.
- Improve explainability using dependencies that describe the relationship between ideas and their role in generation

**Implications:**

- Use a graph canvas to track ideas from distinct steps and use dependencies to illustrate how ideas are related
  - Generative AI can add context to each of these edges to remind users how ideas are connected
  - **Decision:** Do we need to have explicit dependencies? In the working canvas, one simplifying assumption is that all nodes are related. We could give users the option to update all nodes when a node changes.
- Support flexible non-linear workflows
  - Allow users to start working at any step
    - **Decision:** If users start working on a later step, should we make assumptions and generate the previous steps?
  - Allow users to make adjustments at any step. Iterations on previous steps can be streamlined by using generative AI to propagate changes to dependent steps.
- Support iterative, non-linear, multi-stage design thinking workflow
  - Iterative - dependency driven features allows thinking to guide the thinking process and ensures that we aren't jumping straight to the end conclusion

**Cons:**

- ChatGPT is already pretty good at responding to natural language prompts. Need to clearly motivate why additional complexity with a canvas and dependencies is better.

## Visualize the outcome of iterations

**Motivation:**

- Current systems focus on text. Instead of having to review brainstormed text ideas, instead users can review visual narratives when evaluating ideas.
- Generative AI can make it easy for users to see how small changes impact the final visual storyboard/narrative

**Implications:**

- Allow users to visualize (via storyboards) how changes at early steps can affect the final problem and solutions (this seems like an useful education feature)
  - Need to make it easy for users handle multiple previews and undo changes if necessary
- Support personalization of storyboards to match client requirements

## Provide user controls that matches the structure of the domain (steerability)

**Motivation:**

- Using natural language instructions can be imprecise. Instead improve steerability by providing controls that match the structure of the domain of thinking.

**Implications:**

- Use structured, multi-output dimensions to guide generation
- Use the relationships between different steps in the design thinking process to create dependencies that can be used to steer the generation of subsequent steps.

## Generative AI for idea assessment & evaluation

**Motivation:**

- Designers may be unable to overcome their own personal biases when evaluating their ideas.
- Generative AI can be used to evaluate individual ideas as well as a number of connected ideas to find possible issues, assumptions, or extensions.

**Implications:**

- Have a way for users to select a subset of their ideas to be evaluated. Provide interface which allows addressing problems and iterations.
