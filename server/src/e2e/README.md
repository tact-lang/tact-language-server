# E2E Test Filtering System

This document describes the enhanced e2e test filtering system that allows you to run specific test suites, files, or
individual tests.

## Quick Start

```bash
# Run all tests
yarn test:e2e

# Run specific test suite
yarn test:e2e --suite completion

# Run specific test file
yarn test:e2e --file structs.test

# Run specific test file in specific suite
yarn test:e2e --suite completion --file structs.test

# Run tests matching a pattern
yarn test:e2e --test "struct fields"

# Update snapshots for specific suite
yarn test:e2e --suite completion --update-snapshots

# Run with verbose logging
yarn test:e2e --verbose
```

## Available Options

| Option               | Short | Description                  | Example                  |
| -------------------- | ----- | ---------------------------- | ------------------------ |
| `--suite`            | `-s`  | Run specific test suite      | `--suite completion`     |
| `--file`             | `-f`  | Run tests from specific file | `--file structs.test`    |
| `--test`             | `-t`  | Run tests matching pattern   | `--test "struct fields"` |
| `--update-snapshots` | `-u`  | Update test snapshots        | `--update-snapshots`     |
| `--verbose`          | `-v`  | Enable verbose logging       | `--verbose`              |
| `--help`             | `-h`  | Show help                    | `--help`                 |

## Common Use Cases

### Development Workflow

When working on a specific feature:

```bash
# Work on completion for structs
yarn test:e2e:completion:structs

# Work on type inference basics
yarn test:e2e:types:basic

# Test all completion features
yarn test:e2e:completion

# Update snapshots after changes
yarn test:e2e:completion --update-snapshots
```

### Debugging Failed Tests

```bash
# Run with verbose logging to see detailed output
yarn test:e2e --suite completion --verbose

# Run specific failing test
yarn test:e2e --test "Global constant completion"

# Run specific file that's failing
yarn test:e2e --suite completion --file constants.test
```

### Finding Available Files

If you're unsure what test files are available:

```bash
# This will show all available files in completion suite
yarn test:e2e --suite completion --file nonexistent
```

## Predefined Scripts

For convenience, several predefined scripts are available:

### By Suite

- `yarn test:e2e:completion`
- `yarn test:e2e:types`
- `yarn test:e2e:references`
- `yarn test:e2e:rename`
- `yarn test:e2e:folding`
- `yarn test:e2e:intentions`

### Utility

- `yarn test:e2e:verbose` - Run all tests with verbose output
- `yarn test:e2e:help` - Show help
- `yarn test:e2e:update` - Update all snapshots

## Adding New Tests

When adding new tests:

1. Create a `.test` file in the appropriate `testcases/` directory
2. Use the existing format with `========` separators
3. Test your new file with: `yarn test:e2e --suite <suite> --file <your-file>.test`
4. Update snapshots if needed: `yarn test:e2e --suite <suite> --file <your-file>.test --update-snapshots`
