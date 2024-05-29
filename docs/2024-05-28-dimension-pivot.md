## Stronger design direction

I wanted to collect some thoughts on pivoting the design direction from unstructured generation to a more structured approach. The current implementation generates new personas/problems/solutions (nodes) using unstructured single-output generation. I feel like there are a couple of problems with this approach:

## Unstructured generation problems

- Users have difficulty steering node generation. Users can pass an instruction in addition to a node's dependencies, but research such as Luminate shows that this can cause LLMs to converge prematurely.
- Users have difficulty steering node editing/merging. An unstructured approach may struggle to extract the details users like about each node in order to generate a merge or edit that is an improvement. Additionally edits/regenerations might be unrelated to the original.

For the above points, I'm looking for a more structured and consistent design that describes the behaviors for how nodes are generated, edited, and merged.

- In order to avoid duplicate solutions while creating or editing, we need to either generate/regenerate all solutions together or pass a list of all existing solutions in addition to the problems. The approach of passing the entire state to the LLM feels overly dependent on the LLM to make the right generations.

## Design problems

- Currently users get to determine how many nodes are generated. However, I feel like this shouldn't be something determined by the user, instead it should be determined by the dimensions of the design space.
- It feels like there is a lack of internal design consistency between generating personas/problems/solutions and generating storyboards. In terms of design thinking, the personas/problems/solutions map to empathize, define and ideate steps. Storyboard generation maps to prototyping and testing. The current implementation struggles with finding a consistent design for both of these stages. Personas/problems/solutions are created using unstructured single-output generation. Storyboards which require further iteration and refinement use unstructured multi-output generation of titles and frames.

## Proposed Solution

Motivated by Luminate, a solution to the above problems relies on using structured multi-output generation using dimensions to guide generation and improve user steerability.

## Implementation 1 - Soft Pivot

- Unstructured single-output generation is replaced by structured multi-output using dimensions.
- Generations are still localized to dependencies, i.e., solutions are generated based on a subset of problems.
- All nodes are tagged with the dimensions that they were generated with. These tags are used to guide node merging and editing.
- Editing a parent could regenerate dependencies using the new parent problem, but maintain the existing dimensions to ensure regenerations are different, but still similar.
- There are three options for dimension management. Dimensions can be shared across all nodes, a set of dimensions for each node type, a set of dimensions for each generation.
  - Using a set of dimensions for each generation would be the lowest implementation effort, and would help each generation create a diverse set of outputs. It could be confusing to display these dimensions to users since they lack consistency.
  - Shared dimensions. Each generation could utilize existing dimensions or add new dimensions.

## Implementation 2 - Hard Pivot

- Instead of localized node and dependency driven exploration of the design space. Utilize a "global" context, problem, and solution space. Imagine Luminate, but instead of having a single design space generated based on a prompt. There are design spaces generated for each step in design thinking. Each design space is dependent on one another.
- A set of dimensions are generated for each step in design thinking: empathize, define, ideate, and prototype steps which are mapped to the "context/persona space", "problem space", "solution space", and "storyboard space".
- Nodes can then be generated in each space to support nonlinear exploration.
- To support iteration, users can pin dimensions or pin nodes they like. Then they can regenerate a space based on the pins in the other design spaces.
- Users can select a subset of nodes for generating a storyboard. Storyboard generation is also guided by dimensions specific to storyboards.
