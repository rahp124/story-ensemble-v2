# Dimension Design

## Overview

This document describes the system design after pivoting to using dimensions to steer generation. We have decided to preserve the localized canvas and dependency UI. We will add multi-output dimension-structured generation to guide exploration.

## Entities

- Dimensions - Dimension name and a enum of acceptable values. Dimensions can be pinned so that future generations used a pinned/refined value. Dimensions can also be unpinned.
- Personas
- Problems
- Solutions
- Storyboard Outlines
- Storyboard Images (might be better to have separate dimensions for storyboard outlines and visuals)

## Actions

- Dimension actions
  - List dimensions
    - Output:
      - List of current shared dimensions
  - Generate dimensions
    - Input:
      - Existing dimensions (some pinned others not pinned)
      - Dependencies
      - Text instructions
    - Output:
      - List of unpinned dimensions
  - Pin dimension
    - Input:
      - Dimension id
      - Pinned value(s)
    - Output:
      - Update the shared dimension state to pin a dimension value
  - Manually add dimension
    - Input
      - New dimension name
    - Output:
      - Add new dimension with generated values
      - Canvas nodes are unchanged
      - Exploration nodes are regenerated
  - Edit dimension values (Not present in Luminate)
    - Input
      - Dimension id
      - Updated values
    - Output:
      - Update shared dimension state to change the values
      - Remove dimension tags for canvas nodes using previous values.
      - Preserve dimension tags for canvas nodes using unchanged values
      - Exploration nodes are regenerated
- Node actions
  - Generate node(s)
    - Input:
      - Existing dimensions (some pinned others not pinned)
      - Node dependencies
      - Text instructions
    - Output:
      - List of generated nodes for each permutation of dimension
  - Regenerate node(s)
    - Input:
      - Node dimensions
      - Node dependencies
      - Text instructions
    - Output:
      - List of regenerated node(s) based on the updated dependencies while preserving the node dimensions
      - Mark dependent nodes as out of sync
  - Merge nodes
    - Input:
      - List of node ids
      - List of dependencies
      - Text instructions
    - Output:
      - Single merged node with dependencies set to the union of node dependencies
      - Node content generated using content of source nodes. Dimensions determined by LLM classification
      - Do not delete the source nodes
  - Edit node (manually)
    - Input:
      - Updated value
    - Output:
      - Update the state of a node
      - Mark dependent nodes as out of sync
  - Mark node as out of sync
    - Input:
      - Node id
    - Output:
      - Mark a node as out of sync to display prompt to regenerate
  - Delete node
    - Input:
      - Node id
    - Output:
      - Delete the node
