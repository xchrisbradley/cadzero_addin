# CADZERO - AI-Powered Fusion 360 Add-In

CADZERO is an intelligent add-in for Autodesk Fusion 360 that brings AI-powered CAD assistance directly into your modeling workflow. Create complex designs, automate repetitive tasks, and get instant help with natural language commands.

## 🎬 Demo

![CADZERO Demo1](./demo/cadzero-demo-1.gif)
![CADZERO Demo2](./demo/cadzero-demo-2.gif)
![CADZERO Demo3](./demo/cadzero-demo-3.gif)
![CADZERO Demo4](./demo/cadzero-demo-4.gif)

*Create complex CAD models using natural language - watch CADZERO in action!*

## ✨ Features

- **Natural Language CAD Modeling** - Describe what you want to create and let AI generate the geometry
- **Tool Execution Tracking** - Visual feedback for every operation with success indicators
- **Real-time Status Updates** - See thinking progress and execution time
- **Authentication Integration** - Secure sign-in with your account
- **Modern Chat Interface** - Clean, professional UI with action buttons for checkpoints and feedback
- **Command History** - Keep track of all your AI interactions and results

## 🎯 What You Can Do

- Create sketches with natural language ("create a 10cm x 5cm box sketch")
- Generate 3D features (extrusions, revolves, lofts, etc.)
- Add constraints and dimensions automatically
- Modify existing geometry
- Get suggestions and best practices
- Learn Fusion 360 API through examples

## 📋 Requirements

### Fusion 360
- Autodesk Fusion 360 (latest version recommended)
- Windows, macOS, or Linux

### Backend Services
- **Encore Backend** running locally or deployed
  - Authentication service
  - LLM Router service
  - Accounts service

### Authentication
- Valid account credentials from the platform
- Internet connection for API calls

## 🚀 Installation

### Step 1: Download the Add-In

Clone or download this repository:

```bash
git clone https://github.com/yourusername/nationdevs.git
cd nationdevs/addins/CADZERO
```

### Step 2: Install in Fusion 360

1. **Open Fusion 360**
2. Go to **UTILITIES** tab in the toolbar
3. Click **ADD-INS** button
4. In the Add-Ins dialog, click the **Add-Ins** tab
5. Click the **+** (plus) button next to "My Add-Ins"
6. Navigate to the `nationdevs/addins/CADZERO` folder
7. Select the folder and click **Open**
8. The add-in should now appear in the list
9. Click **Run** to start CADZERO

### Step 3: Configure Backend Connection

Edit `config.py` to set your backend endpoints:

```python
# config.py
ENDPOINTS = {
    'local': 'http://localhost:4000',
    'staging': 'https://your-staging-url.com'
}

# Default endpoint
DEFAULT_ENDPOINT = 'local'  # or 'staging'
```

### Step 4: Sign In

1. When the palette opens, click **Sign In**
2. A browser window will open (or copy the provided link)
3. Complete authentication in your browser
4. Return to Fusion 360 - you're ready to go!

## 🎨 Usage

### Starting CADZERO

1. Go to **UTILITIES** > **ADD-INS**
2. Find **CADZERO** in the list
3. Click **Run**
4. The CADZERO palette will appear on the side

### Basic Commands

Type natural language commands in the input field:

```
Create a 10cm x 5cm x 3cm box sketch
```

```
Extrude the last sketch by 2cm
```

```
Create a circular pattern of 8 instances around the Z-axis
```

```
Add a 0.5cm fillet to all edges
```

### Interface Elements

- **USER Section** - Shows your command
- **Status Bar** - Displays "Thinking" → "Complete" with elapsed time
- **Tool Results** - List of executed operations with checkmarks
- **AI Response** - Detailed explanation and next steps
- **Action Buttons**:
  - 🏁 **Checkpoint** - Save current state
  - **View diff** - See what changed
  - **Restore checkpoint** - Undo to saved state
  - 👍👎 - Provide feedback

## 🛠️ Development Setup

### Project Structure

```
CADZERO/
├── CADZERO.py              # Main add-in entry point
├── CADZERO.manifest        # Add-in manifest
├── auth.py                 # Authentication handler
├── config.py               # Configuration settings
├── commands/
│   ├── commandDialog/      # Command dialog (legacy)
│   ├── paletteSend/        # Send command handler
│   └── paletteShow/        # Main palette UI
│       └── resources/
│           └── html/
│               ├── index.html      # Main UI
│               └── static/
│                   └── palette.js  # Frontend logic
└── lib/
    └── fusionAddInUtils/   # Utility functions
```

### Running Backend Services

Make sure the Encore backend is running:

```bash
cd utilities
encore run
```

This starts:
- Auth service (port 4000)
- LLM Router
- Accounts service
- All required APIs

### Debugging

1. **Fusion 360 Text Commands**:
   - Enable in Fusion: **UTILITIES** > **ADD-INS** > **Scripts and Add-Ins** > **Text Commands**
   
2. **Browser DevTools**:
   - Right-click in the palette (if supported)
   - Or check Fusion's console output

3. **Python Logs**:
   - Check Fusion 360's Text Commands panel for Python errors
   - Use `app.log()` for debugging

## 🔧 Configuration

### Switching Endpoints

Toggle between local and staging in the palette settings, or edit `config.py`:

```python
# For local development
DEFAULT_ENDPOINT = 'local'

# For production/staging
DEFAULT_ENDPOINT = 'staging'
```

### Authentication Token

The auth token is stored in:
```
.auth_token.json
```

**Note**: This file is in `.gitignore` - never commit it!

## 🐛 Troubleshooting

### "Fusion API not available"
- Make sure you're running CADZERO from within Fusion 360
- Restart Fusion 360 and reload the add-in

### "Authentication failed"
- Check that backend services are running
- Verify your credentials
- Clear `.auth_token.json` and sign in again

### "Tool execution failed"
- Ensure you have an active document open
- Check that the command is valid for your current context
- Review the execution log in the debug section

### Palette not showing
- Go to UTILITIES > ADD-INS and click "Run" on CADZERO
- Check if the palette is hidden off-screen
- Restart Fusion 360

## 📝 Best Practices

1. **Be Specific** - Provide dimensions and details in your commands
2. **One Step at a Time** - Break complex designs into smaller commands
3. **Check Results** - Review tool execution results before proceeding
4. **Use Checkpoints** - Save states before major operations
5. **Provide Feedback** - Use 👍👎 to help improve the AI

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in Fusion 360
5. Submit a pull request

## 📄 License

[Your License Here]

## 🔗 Links

- [Documentation](https://your-docs-url.com)
- [Issues](https://github.com/yourusername/nationdevs/issues)
- [Fusion 360 API Reference](https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-A92A4B10-3781-4925-94C6-47DA85A4F65A)

## 💡 Support

For help and support:
- Open an issue on GitHub
- Check the documentation
- Contact: chris@nationdevs.com

## 🙏 Acknowledgments

- Built with Autodesk Fusion 360 API
- Backend powered by Encore
- UI inspired by modern AI chat interfaces
- LLM integration for intelligent CAD assistance

---

Made with ❤️ by NationDevs

