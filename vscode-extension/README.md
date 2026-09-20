# CodeUnderstander — VS Code Extension 🚀

> **Understand any code in plain English directly in VS Code.**  
> Get step-by-step walkthroughs, real-world analogies, and interactive line-by-line breakdowns powered by Google Gemini.

---

## ✨ Features

- **📄 Explain Entire File**: One click to break down any file from line 1 to the end (`Ctrl+Alt+F` / `Cmd+Alt+F`).
- **🔍 Explain Selected Code**: Highlight any function or tricky section and press `Ctrl+Alt+E` (or right-click → **CodeUnderstander: Explain Selected Code**).
- **⚡ Interactive Webview Panel**: Opens beside your active code editor:
  - **Executive Plain-English Summary**: What the program does from start to finish.
  - **Real-World Analogy**: Relatable conceptual metaphor to make complex logic click.
  - **Step-by-Step Chronological Walkthrough**: Understand execution order and sections.
  - **Line-by-Line Breakdown Table**: Click any row in the breakdown to jump immediately to that exact line in the editor!
  - **Key Concepts & Technical Terms**: Clear explanations of core patterns and identifiers.
- **🌐 16 Languages Supported**: Java, Python, JavaScript, TypeScript, React JSX, React TSX, C++, C, Go, Rust, HTML, CSS, PHP, Ruby, Kotlin, and Swift.
- **📋 Export to Markdown**: 1-click clipboard export formatted as clean markdown notes.
- **🛡️ Built-in Model Failover**: Automatic fallback across Gemini Flash models (`gemini-flash-lite-latest` → `gemini-flash-latest` → `gemini-3.6-flash` → `gemini-3.8-flash`).

---

## 🚀 Quick Start

1. **Install from Marketplace** (or install the `.vsix` file directly):
   ```bash
   code --install-extension codeunderstander-1.0.0.vsix
   ```
2. **Set your Gemini API Key**:
   - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
   - Type **`CodeUnderstander: Set Gemini API Key`**.
   - Paste your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3. **Analyze Code**:
   - Open any code file.
   - Click **`✨ Explain File`** in the status bar (or press `Ctrl+Alt+F`).

---

## ⌨️ Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Alt + F` (Mac: `Cmd + Alt + F`) | **Explain Active File** |
| `Ctrl + Alt + E` (Mac: `Cmd + Alt + E`) | **Explain Selected Code** |

---

## 📄 License
MIT © 2026 CodeUnderstander
