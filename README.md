# Python Online Compiler

A web-based Python code compiler and execution environment with advanced features.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Requirements](#requirements)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Installation

### From GitHub

1. Clone the repository:
```bash
git clone https://github.com/Cindychen12345/onlineCode.git
cd onlineCode
```

2. Create and activate a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # Linux/MacOS
venv\Scripts\activate     # Windows
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

1. Start the development server:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Editor Interface:
- Left panel: Write your Python code
- Right panel: View execution results
- Toolbar: Contains run, save, and share buttons

4. Common Operations:
- Run code: Click "Run" button or press Ctrl+Enter
- Save code: Click "Save" button (requires login)
- Share code: Click "Share" to generate a shareable link

### Advanced Usage

1. Keyboard Shortcuts:
- Ctrl+Space: Code completion
- Ctrl+S: Save current code
- F1: Open help menu

2. Customizing Settings:
- Click the gear icon to:
  - Change editor theme
  - Adjust font size
  - Configure indentation settings

3. Working with Files:
- Import: Drag and drop .py files into the editor
- Export: Use "Export" button to download your code

## Features

- **Code Execution**:
  - Real-time Python 3.8+ execution
  - Support for standard library and popular packages
  - Timeout protection for long-running scripts

- **Editor Features**:
  - Syntax highlighting
  - Auto-indentation
  - Code folding
  - Multiple color themes

- **Collaboration**:
  - Share code snippets via unique URLs
  - Comment on shared code
  - Version history for saved code

## Requirements

- Python 3.8 or higher
- Required packages (automatically installed):
  - Flask
  - Pygments
  - Requests

## Development

### Contributing Guidelines

1. Setting Up Development Environment:
```bash
git clone https://github.com/Cindychen12345/onlineCode.git
cd onlineCode
pip install -r requirements-dev.txt
```

2. Running Tests:
```bash
python -m pytest tests/
```

3. Code Style:
- Follow PEP 8 guidelines
- Include type hints for new functions
- Write docstrings for all public methods

4. Pull Request Process:
- Create a new branch for each feature
- Include tests for new functionality
- Update documentation when adding features

## Troubleshooting

### Common Issues

1. **Server Not Starting**:
- Check if port 3000 is available
- Verify Python version meets requirements
- Examine error logs in terminal

2. **Code Execution Problems**:
- Check for infinite loops
- Verify all imports are available
- Look for syntax errors in console

3. **Performance Issues**:
- Clear browser cache
- Reduce code complexity
- Check server resource usage

## License

MIT License - See [LICENSE](LICENSE) file for details.

For additional help, please open an issue on our [GitHub repository](https://github.com/Cindychen12345/onlineCode/issues).