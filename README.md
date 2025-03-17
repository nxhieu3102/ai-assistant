# Chrome Translation Assistant

A Chrome extension that provides instant translation and text processing capabilities with a clean, modern interface.

## Features

- 🌐 Instant text translation
- 📝 Text summarization
- 🔄 Context-aware processing
- 💾 Save translations for later
- 🌍 Support for multiple languages:
  - English
  - Vietnamese
  - Spanish
  - French
  - German
  - Chinese
  - Japanese
  - Korean
  - Russian
  - Arabic

## Project Structure
.
├── extension/ # Chrome extension source code
│ ├── src/
│ │ ├── popup/ # Extension popup UI components
│ │ │ ├── Popup.tsx # Main popup component
│ │ │ └── styles.css # Popup styles
│ │ └── contentScript/ # Content script for webpage integration
│ │ ├── index.ts # Main content script
│ │ └── styles.css # Content script styles
│ ├── public/ # Static assets
│ │ └── img/ # Extension icons and images
│ ├── manifest.json # Extension manifest
│ └── package.json # Extension dependencies
├── server/ # Backend server
│ ├── src/ # Server source code
│ │ └── index.ts # Main server file
│ ├── Dockerfile # Server containerization
│ └── package.json # Server dependencies
├── web/ # Web interface
│ ├── src/
│ │ └── app/ # Next.js app directory
│ └── package.json # Web dependencies
└── .github/ # GitHub configuration
└── workflows/ # CI/CD workflows
└── ci-cd.yml # CI/CD pipeline configuration

## Technology Stack

### Frontend (Extension)
- TypeScript
- React
- Ant Design
- Framer Motion
- Styled Components

### Backend (Server)
- Node.js
- TypeScript
- Docker

## Getting Started

### Prerequisites
- Node.js 20.x
- npm
- Docker (for server deployment)
- Chrome browser

## Usage

1. Select text on any webpage
2. Click the translation icon that appears
3. Choose your desired operation:
   - Translate
   - Summarize
   - Smooth (improve text)
4. View the results in the popup
5. Optionally save translations for later reference

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors
- Built with [Ant Design](https://ant.design/)
- Powered by Chrome Extensions API
