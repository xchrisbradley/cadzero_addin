# CADZERO - AI-Powered CAD Assistant for Fusion 360

> **🧪 ALPHA RELEASE - This Week Only**  
> We're testing CADZERO in production this week! Help us QA and get early access to AI-powered CAD design.

Transform your Fusion 360 experience with AI. CADZERO brings intelligent CAD assistance directly into your modeling workflow - just describe what you want to create and watch it come to life. No coding required, no technical setup, just install and start designing.

## 🧪 Alpha Testing

**This week we're running an alpha test!** We need your help to QA CADZERO before the official launch.

**What to expect:**
- ✨ Full access to AI-powered CAD features
- 🐛 Potential bugs and rough edges (please report them!)
- 🎫 Free access with test Stripe card
- 💬 Direct support from the development team

**Your feedback matters!** Report bugs, suggest features, and help us make CADZERO amazing.

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

## 📋 What You Need

- ✅ **Autodesk Fusion 360** (latest version recommended)
- ✅ **Internet connection** for AI processing  
- ✅ **CADZERO account** - [Sign up at staging.cadzero.xyz](https://staging.cadzero.xyz/sign-up) *(alpha testing)*
- ✅ **Windows, macOS, or Linux**

That's it! The add-in connects to our cloud service automatically. **No coding, no servers, no technical setup** - just install and start designing with AI.

### 🎫 Alpha Testing Access

For this week's alpha test:
- **Sign up at:** [staging.cadzero.xyz](https://staging.cadzero.xyz/sign-up)
- **Test payment card:** `4242 4242 4242 4242`
  - Any future expiry date (e.g., 12/34)
  - Any 3-digit CVC (e.g., 123)
  - Any ZIP code
- **No real charges** - This is a test environment for QA purposes

## 🚀 Quick Start

### 1️⃣ Download CADZERO

**Option A: Direct Download**
- Download the CADZERO folder from our releases page
- Extract to a location you'll remember (e.g., `Documents/Fusion360AddIns/`)

**Option B: Via Git**
```bash
git clone https://github.com/xchrisbradley/cadzero_addin.git
```

### 2️⃣ Install in Fusion 360

1. Open **Fusion 360**
2. Click the **UTILITIES** tab in the toolbar
3. Click **ADD-INS**
4. In the Add-Ins window, click the **Add-Ins** tab
5. Click the **green + button** next to "My Add-Ins"
6. Browse to and select the **CADZERO** folder
7. Click **OK**
8. Find **CADZERO** in the list and click **Run**

### 3️⃣ Sign In

1. The CADZERO palette will appear on the right side
2. Click the **Sign In** button
3. Your browser will open to the sign-in page
4. **For Alpha Testing:**
   - Sign up at [staging.cadzero.xyz](https://staging.cadzero.xyz)
   - Use test card `4242 4242 4242 4242` for subscription
   - Complete your profile
5. Return to Fusion 360 - you're all set!

### 4️⃣ Start Creating

Type your first command in the chat:
```
Create a 10cm diameter circle sketch
```

Watch CADZERO bring your idea to life! 🎉

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


## 📝 Best Practices

1. **Be Specific** - Include dimensions, quantities, and details in your commands
2. **One Step at a Time** - Break complex designs into smaller, manageable commands
3. **Check Results** - Review the tool execution feedback before proceeding
4. **Use Checkpoints** - Save your work state before major operations
5. **Provide Feedback** - Use 👍👎 buttons to help improve CADZERO
6. **Start Fresh** - Create a new component for best results
7. **Clear Communication** - Describe what you want, not how to do it

## 🐛 Troubleshooting

### Can't see the CADZERO palette
- Go to **UTILITIES** > **ADD-INS** and click **Run** next to CADZERO
- Check if the palette is hidden off-screen (drag it back into view)
- Try restarting Fusion 360

### Authentication issues
- Make sure you have an active internet connection
- Verify your credentials at [staging.cadzero.xyz](https://staging.cadzero.xyz) *(alpha testing)*
- Click **Sign Out** then **Sign In** again to refresh your session
- **Alpha testers:** Make sure you signed up at the staging environment

### Commands not working
- Ensure you have an **active document** open in Fusion 360
- Start with a **new component** for best results
- Make sure your command is specific (include dimensions and details)
- Check the tool execution results for error messages

### Add-in won't load
- Make sure you selected the **CADZERO folder** (not a parent folder)
- Check that all files are present (don't rename files)
- Restart Fusion 360 and try again
- Still stuck? Contact support at chris@nationdevs.com

## 💡 Need Help?

**🧪 Alpha Testing Support:**
- **📧 Email:** chris@nationdevs.com
- **🐛 Report Bugs:** [GitHub Issues](https://github.com/xchrisbradley/nationdevs/issues)
- **💬 Questions:** We respond quickly during alpha testing!

**🌐 Resources:**
- **Staging Platform:** [staging.cadzero.xyz](https://staging.cadzero.xyz)
- **GitHub Repo:** [github.com/xchrisbradley/nationdevs](https://github.com/xchrisbradley/nationdevs)

## 🎓 Learn More

- [Video Tutorials](https://www.cadzero.xyz) - Watch CADZERO in action
- [Example Commands](https://www.cadzero.xyz) - Get inspiration for your projects
- [Best Practices Guide](https://www.cadzero.xyz) - Master CADZERO
- [Community Forum](https://www.cadzero.xyz) - Connect with other users

## ⭐ Enjoy CADZERO?

- Leave us a ⭐ on [GitHub](https://github.com/xchrisbradley/nationdevs)
- Share your creations with #CADZERO
- Tell your colleagues about AI-powered CAD

---

## 👨‍💻 For Developers

<details>
<summary>Click to expand developer documentation</summary>

### Project Structure
```
CADZERO/
├── CADZERO.py              # Main entry point
├── CADZERO.manifest        # Add-in manifest
├── auth.py                 # Authentication
├── config.py               # Configuration
├── commands/               # Command handlers
└── lib/                    # Utilities
```

### Local Development
To run with local backend:
1. Edit `config.py`:
   ```python
   current_endpoint = LOCAL_ENDPOINT
   ```
2. Start local Encore backend:
   ```bash
   cd utilities && encore run
   ```

### Contributing
Contributions welcome! Fork, create a feature branch, test thoroughly, and submit a PR.

</details>

---

Made with ❤️ by **Nation Developers**  
*Empowering designers with AI*

