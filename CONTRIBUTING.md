# Contributing to Alpha Signal

Thank you for your interest in contributing to Alpha Signal! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker and Docker Compose
- Python 3.11 (for analytics development)
- Git

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/alpha-signal.git
   cd alpha-signal
   ```

2. **Install Dependencies**
   ```bash
   ./setup.sh
   # or manually
   npm install
   ```

3. **Start Development Environment**
   ```bash
   # Option 1: With Docker
   docker-compose up

   # Option 2: Local development
   docker-compose up postgres redis -d
   npm run dev
   ```

## 📁 Project Structure

```
alpha-signal/
├── apps/web/          # Frontend React application
├── apps/api/          # Backend GraphQL API
├── apps/analytics/    # Python analytics workers
└── packages/shared/   # Shared TypeScript types
```

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update tests as needed

### 3. Test Your Changes

```bash
# Run linting
npm run lint

# Build all packages
npm run build

# Test with Docker
docker-compose up --build
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add stock price prediction model"
git commit -m "fix: resolve WebSocket connection issue"
git commit -m "docs: update API documentation"
git commit -m "refactor: improve database query performance"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Enable strict mode
- Use meaningful variable names
- Prefer `const` over `let`
- Use async/await over promises
- Add JSDoc comments for public APIs

```typescript
// Good
const stockPrice = await fetchStockPrice(symbol);

// Avoid
let price;
fetchStockPrice(symbol).then((p) => {
  price = p;
});
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props
- Extract reusable logic into custom hooks

```tsx
// Good
interface StockCardProps {
  symbol: string;
  price: number;
}

export const StockCard: React.FC<StockCardProps> = ({ symbol, price }) => {
  return <div>{symbol}: ₹{price}</div>;
};
```

### Python

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions
- Use meaningful variable names

```python
# Good
def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """
    Calculate Relative Strength Index (RSI) for given prices.

    Args:
        prices: List of historical prices
        period: RSI calculation period (default: 14)

    Returns:
        RSI value between 0 and 100
    """
    # Implementation
```

## 🧪 Testing Guidelines

### Frontend Tests

- Write tests for components
- Test user interactions
- Mock API calls

### Backend Tests

- Test API endpoints
- Test GraphQL resolvers
- Test business logic

### Python Tests

- Test Celery tasks
- Test data processing functions
- Test ML model predictions

## 📊 Adding New Features

### Adding a New API Endpoint

1. Update GraphQL schema in `apps/api/src/index.ts`
2. Add resolver implementation
3. Update shared types in `packages/shared/src/index.ts`
4. Test with GraphQL Playground
5. Update documentation

### Adding a New Frontend Page

1. Create component in `apps/web/src/pages/`
2. Add route in router configuration
3. Update navigation
4. Add tests
5. Update documentation

### Adding a New Celery Task

1. Define task in `apps/analytics/src/tasks.py`
2. Add task configuration
3. Test task execution
4. Update documentation

## 🔍 Code Review Process

All contributions go through code review:

1. **Automated Checks**: Linting, type checking, tests
2. **Manual Review**: Code quality, architecture, documentation
3. **Testing**: Functionality, edge cases, performance
4. **Approval**: At least one maintainer approval required

## 🐛 Reporting Bugs

### Before Submitting

- Check if the bug already exists
- Verify it's reproducible
- Gather relevant information

### Bug Report Template

```markdown
**Description**
Brief description of the bug

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g., macOS 13.0]
- Node.js version: [e.g., 20.0.0]
- Browser: [e.g., Chrome 120]

**Additional Context**
Any other relevant information
```

## 💡 Suggesting Features

We welcome feature suggestions! Please:

1. Check if it's already suggested
2. Describe the feature clearly
3. Explain the use case
4. Consider implementation complexity
5. Be open to discussion

## 📚 Documentation

When adding features, update:

- [ ] Code comments
- [ ] README.md
- [ ] API documentation
- [ ] Type definitions
- [ ] Example usage

## 🔐 Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security@alphasignal.com (replace with actual email)
3. Provide detailed information
4. Wait for acknowledgment

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Your contributions make Alpha Signal better! We appreciate your time and effort.

## 📞 Contact

- GitHub Issues: For bug reports and feature requests
- Discussions: For questions and general discussion
- Email: dev@alphasignal.com (replace with actual email)

---

**Happy Contributing! 🚀**
