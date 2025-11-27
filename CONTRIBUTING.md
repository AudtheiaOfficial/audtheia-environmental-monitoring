# Contributing to Audtheia

Thank you for your interest in contributing to Audtheia! This project aims to advance environmental science through AI-powered monitoring, and we welcome contributions from researchers, developers, conservationists, and data scientists.

## 🌟 Ways to Contribute

### 1. Report Issues
- **Bug Reports**: Found a bug? Please report it!
- **Feature Requests**: Have an idea for improvement? We'd love to hear it!
- **Documentation**: Spotted a typo or unclear explanation? Let us know!

### 2. Improve Documentation
- Fix typos and grammatical errors
- Clarify existing documentation
- Add examples and use cases
- Translate documentation to other languages
- Create video tutorials or guides

### 3. Contribute Code
- Fix bugs
- Implement new features
- Improve performance
- Add new species detection models
- Enhance AI agent prompts
- Create new workflow integrations

### 4. Share Data & Models
- Contribute annotated datasets
- Share trained species detection models
- Provide example recordings (with appropriate permissions)
- Contribute validation datasets

### 5. Scientific Contributions
- Validate taxonomic classifications
- Review environmental analysis outputs
- Suggest improvements to scientific methodology
- Contribute domain expertise

## 🚀 Getting Started

### Prerequisites

Before contributing, please:

1. **Read the Documentation**: Familiarize yourself with [README.md](README.md) and the [documentation folder](docs/)
2. **Set Up Development Environment**: Follow the [Installation Guide](docs/getting-started/installation.md)
3. **Review Open Issues**: Check [GitHub Issues](https://github.com/yourusername/audtheia/issues) to avoid duplicate work
4. **Join Discussions**: Participate in [GitHub Discussions](https://github.com/yourusername/audtheia/discussions)

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/audtheia.git
cd audtheia

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements-dev.txt

# Create a new branch for your contribution
git checkout -b feature/your-feature-name
```

## 📝 Contribution Guidelines

### Code Style

**Python**
- Follow [PEP 8](https://pep8.org/) style guide
- Use meaningful variable and function names
- Add docstrings to all functions and classes
- Maximum line length: 100 characters
- Use type hints where appropriate

```python
def analyze_species_observation(
    image_path: str,
    habitat_type: str = "marine"
) -> Dict[str, Any]:
    """
    Analyze a species observation from an image.
    
    Args:
        image_path: Path to the image file
        habitat_type: Type of habitat (marine, terrestrial, freshwater)
        
    Returns:
        Dictionary containing species identification and environmental data
    """
    # Implementation
    pass
```

**JSON/Workflow Files**
- Use consistent indentation (2 spaces)
- Include comments explaining complex logic
- Remove sensitive credentials before committing
- Validate JSON syntax before committing

### Git Commit Messages

Write clear, descriptive commit messages:

```
feat: Add marine temperature data integration

- Integrate Open-Meteo API for sea surface temperature
- Add temperature data to Environmental Mapping table
- Update RTSP Analyst to include temperature analysis

Closes #123
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic changes)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Testing

Before submitting a pull request:

```bash
# Run unit tests
pytest tests/

# Run integration tests
pytest tests/integration/

# Check code style
flake8 .

# Check type hints
mypy .
```

### Documentation

When adding new features:

1. **Update README.md** if the feature changes core functionality
2. **Create/Update docs/** with detailed documentation
3. **Add docstrings** to all new functions and classes
4. **Provide examples** demonstrating the new feature
5. **Update CHANGELOG.md** with your changes

## 🔬 Scientific Contributions

### Taxonomic Validation

If you're contributing taxonomic expertise:

1. Review species identifications in the Airtable database
2. Provide corrections with scientific references
3. Suggest improvements to identification confidence scoring
4. Validate morphological feature descriptions

### Environmental Analysis Review

If you're contributing environmental science expertise:

1. Review environmental condition assessments
2. Validate habitat classifications
3. Suggest improvements to phenological analysis
4. Provide feedback on conservation implications

### Dataset Contributions

If you're contributing datasets:

1. **Ensure Proper Permissions**: You must have rights to share the data
2. **Provide Metadata**: Include location, date, equipment specifications
3. **Annotate Data**: Provide ground truth labels when possible
4. **Follow FAIR Principles**: Make data Findable, Accessible, Interoperable, Reusable

## 📋 Pull Request Process

### Before Submitting

1. **Update Your Branch**: Rebase on the latest `main` branch
2. **Run Tests**: Ensure all tests pass
3. **Update Documentation**: Document your changes
4. **Review Your Code**: Self-review for quality and clarity

### Pull Request Template

When submitting a pull request, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Scientific contribution
- [ ] Performance improvement

## Related Issues
Closes #(issue number)

## Testing
Describe testing performed:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] Commit messages are clear
- [ ] No sensitive data included
```

### Review Process

1. **Automated Checks**: GitHub Actions will run tests automatically
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

## 🔐 Security & Data Privacy

### Sensitive Data

**NEVER commit:**
- API keys or credentials
- Personal information
- Proprietary data
- Sensitive geographic coordinates
- Unpublished research data

**Always:**
- Use `.env` files for credentials (excluded by `.gitignore`)
- Review files before committing
- Use `git diff` to check staged changes
- Obfuscate sensitive locations when necessary

### Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to: [security-email@institution.edu]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 🏆 Recognition

Contributors are recognized in:

- **README.md**: Contributors section
- **CHANGELOG.md**: For each release
- **GitHub Contributors**: Automatic recognition
- **Academic Citations**: For significant scientific contributions

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

### Our Standards

**Positive Behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable Behavior:**
- Harassment of any kind
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

## 📧 Getting Help

### Questions?

- **GitHub Discussions**: [Discussions](https://github.com/yourusername/audtheia/discussions)
- **GitHub Issues**: [Issues](https://github.com/yourusername/audtheia/issues)
- **Email**: [your-email@institution.edu]

### Resources

- [Installation Guide](docs/getting-started/installation.md)
- [System Architecture](docs/architecture/system-overview.md)
- [API Reference](docs/api-reference/)
- [Scientific Methods](docs/scientific-methods/)

## 🙏 Thank You!

Every contribution, no matter how small, helps advance environmental science and conservation efforts. Thank you for being part of the Audtheia community!

---

**Remember**: Quality over quantity. A well-tested, well-documented small contribution is more valuable than a large, poorly documented change.
