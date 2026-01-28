# Contributing to PetHub 2.0

Thank you for your interest in contributing to PetHub 2.0!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add: your feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Configure your Firebase credentials in `.env.local`
4. Run `node setup-cors.js` to configure CORS
5. Start the dev server: `npm run dev`

## Code Style

- Use consistent indentation (2 spaces)
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and small
- Use meaningful variable and function names

## Commit Messages

Use clear, descriptive commit messages:
- `Add: feature description` - for new features
- `Fix: bug description` - for bug fixes
- `Update: what was updated` - for updates
- `Refactor: what was refactored` - for refactoring

## Testing

Before submitting a PR:
- Test your changes locally
- Ensure no console errors
- Test on different browsers if UI changes
- Verify Firebase operations work correctly

## Security

- Never commit sensitive data (API keys, passwords, etc.)
- Never commit `.env.local` or Firebase service account keys
- Review your changes for security vulnerabilities
- Follow security best practices

## Questions?

Open an issue for questions or discussions about features.
