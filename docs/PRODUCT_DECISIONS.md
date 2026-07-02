# Product Decisions

## Philosophy

This app is NOT a calorie tracker.

It is an AI Fitness Coach.

Every feature should reduce friction instead of adding it.

The user should spend less time logging and more time living.

Whenever there is a choice between:

- asking the user for more information
- letting AI intelligently infer it

prefer AI whenever confidence is reasonable.

## Decision #1

AI estimates nutrition.

Reason:

Users should never have to manually calculate calories, protein, carbs, or fat.

Food logging should feel like journaling.

## Decision #2

Restaurant meals are judged by meal composition, not restaurant name.

Reason:

Healthy restaurants like Qdoba, Chipotle, Cava, and Sweetgreen should not be penalized automatically.

The coach should evaluate:

- protein
- sauces
- portion size
- vegetables
- cooking method

rather than assume restaurant = unhealthy.

## Decision #3

Consistency matters more than perfection.

Reason:

One meal never determines success.

Weekly trends matter more than individual days.

## Decision #4

The coach should be supportive but honest.

Reason:

The AI should never shame the user.

It should encourage good habits while being truthful.

## Decision #5

Every analysis should become more personalized over time.

Reason:

The coach should learn:

- favorite meals
- favorite restaurants
- grocery stores
- workout habits
- weight trends
- sleep habits
- alcohol patterns

The app should improve the longer someone uses it.

## Decision #6

Deterministic analyses.

Reason:

Submitting the exact same log should produce the same result whenever possible.

Random variation reduces trust.

## Decision #7

Code performs calculations.

AI performs reasoning.

Reason:

Statistics such as:

- streaks
- averages
- weight trends
- rolling averages
- projections

should be deterministic.

AI should focus on:

- coaching
- nutrition estimation
- identifying patterns
- recommendations
- motivation

## Decision #8

The app should remember the user.

Reason:

The goal is for the coach to eventually know:

- common foods
- common restaurant orders
- favorite groceries
- goal weight
- preferred coaching style

without asking repeatedly.

## Decision #9

The interface should feel calm.

Reason:

Avoid clutter.

Every screen should answer:

"What do I need to know today?"

instead of showing every possible metric.

## Decision #10

Trust is the product.

Reason:

Users should trust the coach's recommendations.

Whenever uncertainty exists, clearly communicate confidence instead of pretending to know.

# Future Decisions

Use this section to record future architecture and product decisions with timestamps.

## YYYY-MM-DD

Decision:

Reason:

Notes:
