# Contributing to Dynamic Stock Analyzer

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Adding New Features](#adding-new-features)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

Ensure you have installed:
- Node.js >= 18.0.0
- Python 3.x
- GCC or Clang compiler
- GNU Make
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dynamic-stock-analyzer.git
   cd dynamic-stock-analyzer
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/dynamic-stock-analyzer.git
   ```

### Initial Setup

```bash
# Build all components
make build-all

# Setup environment files
make dev-setup

# Configure your .env files
nano .env
nano backend/.env
```

---

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in the feature branch
2. Build and test locally:
   ```bash
   make build-all
   make test
   ```

3. Verify no sample data introduced:
   ```bash
   make verify
   ```

4. Commit your changes (see [Commit Message Format](#commit-message-format))

### Keeping Your Branch Updated

```bash
git fetch upstream
git rebase upstream/develop
```

---

## Coding Standards

### TypeScript

- **Strict mode enabled** - No implicit any
- **ESLint** - Must pass without errors
- **Prettier** - Auto-format on save
- **Naming conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and components
  - `UPPER_CASE` for constants
  - `kebab-case` for file names

### React Components

```typescript
// Functional components with TypeScript
interface MyComponentProps {
  title: string;
  count: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, count }) => {
  // Component logic
  return <div>{title}: {count}</div>;
};
```

### C Code

- **C11 standard**
- **Naming**: `snake_case` for functions and variables
- **Documentation**: Function header comments
- **Memory management**: No leaks, all allocations freed
- **Error handling**: Check all malloc/fopen results

```c
/**
 * Brief description
 * @param input Description
 * @return Description
 */
int my_function(int input) {
    // Implementation
}
```

### CSS/Tailwind

- Use semantic tokens from `index.css`
- No hardcoded colors - use theme variables
- Mobile-first responsive design
- Accessibility (ARIA labels, keyboard navigation)

---

## Testing Guidelines

### Test Requirements

- **Unit tests required** for all business logic
- **No embedded test data** - use mocks
- **80%+ code coverage** target
- **All tests must pass** before PR

### Running Tests

```bash
# All tests
make test

# Backend only
cd backend && npm test

# Frontend only
npm test

# With coverage
cd backend && npm run test:coverage
```

### Writing Tests

**Backend (Jest)**:
```typescript
describe('analysisService', () => {
  it('should calculate stock span', () => {
    const mockPrices = [100, 102, 98, 105];
    // Test implementation with mocks
  });
});
```

**Frontend (React Testing Library)**:
```typescript
describe('StockAnalysis', () => {
  it('renders analysis form', () => {
    render(<StockAnalysis />);
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });
});
```

### C Module Testing

```bash
cd c_modules
make test

# Create test CSV (user-provided data)
echo "100,102,98,105" > test_data.csv
LD_LIBRARY_PATH=./lib ./tests/harness test_data.csv
```

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvement

### Examples

```
feat(analysis): add RSI indicator calculation

Implements Relative Strength Index algorithm with configurable period.
Uses native C implementation for performance.

Closes #123
```

```
fix(portfolio): prevent duplicate holdings

Add validation to check for existing symbol before adding to portfolio.

Fixes #456
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass locally
- [ ] No sample/fake data introduced (run `make verify`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with `develop`

### Submitting PR

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open Pull Request on GitHub:
   - Base branch: `develop` (unless hotfix)
   - Compare branch: your feature branch
   - Fill out PR template completely

3. Address review feedback:
   ```bash
   # Make changes
   git add .
   git commit -m "fix: address review comments"
   git push origin feature/your-feature-name
   ```

### PR Title Format

Use same format as commit messages:
```
feat(scope): brief description
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No sample data introduced
```

### Review Process

- **Minimum 1 approval** required
- **All checks must pass** (CI, tests, linting)
- **Address all comments** before merge
- **Squash and merge** for clean history

---

## Adding New Features

### Adding New Analysis Algorithm

1. **Implement C function**:
   ```c
   // c_modules/src/my_algorithm.c
   double* my_algorithm(const double* prices, size_t count) {
       // Implementation
   }
   ```

2. **Add header**:
   ```c
   // c_modules/include/my_algorithm.h
   double* my_algorithm(const double* prices, size_t count);
   ```

3. **Update Makefile**:
   ```makefile
   SOURCES = ... $(SRC_DIR)/my_algorithm.c
   HEADERS = ... $(INC_DIR)/my_algorithm.h
   ```

4. **Create N-API wrapper**:
   ```cpp
   // backend/native/src/native_binding.cpp
   Napi::Value MyAlgorithm(const Napi::CallbackInfo& info) {
       // Wrapper implementation
   }
   ```

5. **Add TypeScript wrapper**:
   ```typescript
   // backend/native/src/wrapper.ts
   export function myAlgorithm(prices: number[]): number[] {
       // Type-safe wrapper
   }
   ```

6. **Create Express route**:
   ```typescript
   // backend/src/routes/analyze.ts
   router.post('/my-algorithm', validateMyAlgorithm, async (req, res) => {
       // Endpoint implementation
   });
   ```

7. **Add API client method**:
   ```typescript
   // src/lib/api.ts
   export const analyzeMyAlgorithm = async (params) => {
       // API call
   };
   ```

8. **Create React component**:
   ```typescript
   // src/components/Analysis/MyAlgorithmResults.tsx
   export const MyAlgorithmResults: React.FC = () => {
       // Display component
   };
   ```

9. **Add tests** at each layer

10. **Update documentation**:
    - README.md
    - backend/README.md
    - c_modules/README.md

---

## Documentation

### Code Comments

- Explain **why**, not **what**
- Document complex algorithms
- Add JSDoc/TypeDoc for public APIs

### README Updates

Update relevant README files when:
- Adding new features
- Changing API endpoints
- Modifying configuration options
- Updating dependencies

---

## Questions?

- **General questions**: Open a GitHub Discussion
- **Bug reports**: Open a GitHub Issue
- **Security issues**: See SECURITY.md

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to Dynamic Stock Analyzer! 🚀
