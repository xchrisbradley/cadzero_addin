# Demo Assets

Place your demo GIF here as `cadzero-demo.gif`

## Creating a Demo GIF

### Recommended Tools:
- **macOS**: Kap, GIPHY Capture, or QuickTime + conversion
- **Windows**: ScreenToGif, LICEcap
- **Linux**: Peek, SimpleScreenRecorder + ffmpeg

### Tips:
- Keep it under 10MB for GitHub
- Show a complete workflow (10-30 seconds)
- Highlight key features
- Use good lighting and clear text
- Consider adding captions or annotations

### Example Workflow:
1. Show signing in
2. Type a natural language command
3. Show the "Thinking" status
4. Display tool execution results
5. Show the final 3D model
6. Demonstrate action buttons

### Converting Video to GIF:

```bash
# Using ffmpeg
ffmpeg -i input.mov -vf "fps=10,scale=800:-1:flags=lanczos" -c:v gif output.gif

# Optimize size
gifsicle -O3 --colors 256 output.gif -o cadzero-demo.gif
```
