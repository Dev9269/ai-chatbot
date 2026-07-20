# Contributing to AI Chatbot

Thanks for your interest in contributing! Here's how you can help.

## Getting Started

1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ai-chatbot.git
   ```
3. Set up the project as described in [README.md](README.md).
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature
   ```

## Coding Standards

- **Python**: Follow PEP 8. Run `flake8` before committing:
  ```bash
  flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
  ```
- **JavaScript**: Use consistent indentation (2 spaces), semicolons, and single quotes.
- **CSS**: Follow existing patterns in `style.css`.

## Pull Request Process

1. Keep changes focused and atomic — one feature or fix per PR.
2. Test your changes locally before submitting.
3. Update `README.md` if your change affects setup, features, or file structure.
4. Ensure the CI workflow passes (lint check).
5. Open the PR against the `master` branch with a clear title and description.

## Reporting Issues

Open a [GitHub Issue](https://github.com/Dev9269/ai-chatbot/issues) with:
- A clear, descriptive title
- Steps to reproduce (if a bug)
- Expected vs actual behavior
- Screenshots (if applicable)
