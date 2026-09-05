# Task Folder Structure


One folder represents one user task.

```text
agents/tasks/<task-id>/
  plan.md
  state.md
  user_inputs/
  user_task_shape.md
  pitch.md
  user_task_planning.md
  reality_check.md
  test_strategy.md
  plan_vision_review.md
  architecture_preview/
  workitems/
  implementation/
  testing/
  reviews/
  post_review/
  scratch/
  stories/
```

In implicit-story mode, work items and results live directly under the task.

In explicit-story mode, each story is an execution slice under the task-level
gates:

```text
stories/ST-NN-short-name/
  plan.md
  state.md
  user_inputs/
  localized_architecture/
  workitems/
  implementation/
  reviews/
  post_review/
  scratch/
```

Do not recursively run shaping, reality-checker, test-strategist, or
plan-vision-reviewer inside each story. The task-level artifacts cover all
stories. The parent task state records story declarations and rollup
transitions. Story state records story planning, work items, implementation,
review checkpoints, blocking, and handoff to the next dependent story.

Work-item numbers are never reused. Existing specifications and events are
never rewritten.
