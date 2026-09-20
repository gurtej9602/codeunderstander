/**
 * extension.js
 * 
 * Main activation script for CodeUnderstander VS Code Extension.
 */

const vscode = require('vscode');
const path = require('path');
const { explainCode } = require('./geminiService');
const { getWebviewContent } = require('./webviewView');

let currentPanel = null;
let lastAnalyzedContext = null;

/**
 * Retrieves the Gemini API Key from secure storage or settings
 */
async function getApiKey(context) {
  // 1. Try secure secret storage
  let apiKey = await context.secrets.get('geminiApiKey');
  if (apiKey && apiKey.trim()) return apiKey.trim();

  // 2. Try configuration settings
  const config = vscode.workspace.getConfiguration('codeunderstander');
  const configKey = config.get('geminiApiKey');
  if (configKey && configKey.trim()) return configKey.trim();

  // 3. Try environment variable
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }

  // 4. Prompt user to enter key
  const input = await vscode.window.showInputBox({
    prompt: 'Enter your Google Gemini API Key (get one free at https://aistudio.google.com)',
    password: true,
    placeHolder: 'Paste API Key here...',
    ignoreFocusOut: true
  });

  if (input && input.trim()) {
    await context.secrets.store('geminiApiKey', input.trim());
    vscode.window.showInformationMessage('Gemini API Key saved securely!');
    return input.trim();
  }

  return null;
}

/**
 * Explains given code and displays the Webview panel
 */
async function runExplanation(context, code, extension, fileName, startLine = 1, isSelection = false, totalDocLines = 0) {
  const apiKey = await getApiKey(context);
  if (!apiKey) {
    vscode.window.showWarningMessage('CodeUnderstander: Gemini API Key is required to explain code.');
    return;
  }

  const config = vscode.workspace.getConfiguration('codeunderstander');
  const preferredModel = config.get('geminiModel') || 'gemini-flash-lite-latest';
  const themeMode = config.get('theme') || 'auto';

  lastAnalyzedContext = { code, extension, fileName, startLine, isSelection, totalDocLines };

  const scopeLabel = isSelection ? `selection (L${startLine}+)` : `entire file (${totalDocLines || code.split('\n').length} lines)`;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `CodeUnderstander: Explaining ${fileName} [${scopeLabel}]...`,
      cancellable: false
    },
    async (progress) => {
      try {
        progress.report({ message: 'Routing to language tutor and querying Gemini...' });

        const result = await explainCode(apiKey, code, extension, startLine, preferredModel);

        // Open or reveal Webview panel beside the active editor
        if (currentPanel) {
          currentPanel.reveal(vscode.ViewColumn.Beside);
        } else {
          currentPanel = vscode.window.createWebviewPanel(
            'codeunderstanderResults',
            `Explain: ${fileName}`,
            vscode.ViewColumn.Beside,
            {
              enableScripts: true,
              retainContextWhenHidden: true
            }
          );

          currentPanel.onDidDispose(() => {
            currentPanel = null;
          }, null, context.subscriptions);

          // Handle incoming messages from the Webview
          currentPanel.webview.onDidReceiveMessage(
            async (message) => {
              switch (message.command) {
                case 'jumpToLine': {
                  const editor = vscode.window.activeTextEditor;
                  if (editor && typeof message.line === 'number') {
                    const lineIdx = Math.max(0, message.line - 1);
                    const range = new vscode.Range(lineIdx, 0, lineIdx, 0);
                    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                    editor.selection = new vscode.Selection(range.start, range.end);
                  }
                  break;
                }
                case 'copyMarkdown': {
                  const md = formatMarkdown(result, fileName);
                  await vscode.env.clipboard.writeText(md);
                  vscode.window.showInformationMessage('Code explanation copied to clipboard as Markdown!');
                  break;
                }
                case 'explainEntireFile': {
                  const editor = vscode.window.activeTextEditor;
                  if (editor) {
                    const fullCode = editor.document.getText();
                    const ext = path.extname(editor.document.fileName) || '.txt';
                    const fName = path.basename(editor.document.fileName);
                    runExplanation(context, fullCode, ext, fName, 1, false, editor.document.lineCount);
                  }
                  break;
                }
                case 'explainAgain': {
                  if (lastAnalyzedContext) {
                    runExplanation(
                      context,
                      lastAnalyzedContext.code,
                      lastAnalyzedContext.extension,
                      lastAnalyzedContext.fileName,
                      lastAnalyzedContext.startLine,
                      lastAnalyzedContext.isSelection,
                      lastAnalyzedContext.totalDocLines
                    );
                  }
                  break;
                }
              }
            },
            null,
            context.subscriptions
          );
        }

        currentPanel.title = `Explain: ${fileName}`;
        currentPanel.webview.html = getWebviewContent(result, fileName, themeMode, {
          isSelection,
          startLine,
          totalDocLines: totalDocLines || code.split('\n').length
        });
      } catch (err) {
        vscode.window.showErrorMessage(`CodeUnderstander Error: ${err.message}`);
      }
    }
  );
}

function formatMarkdown(result, fileName) {
  const { language, difficulty, summary, analogy, concepts, stepByStep, lineByLine, whatYouCanLearn } = result;
  let md = `# Code Explanation: ${fileName}\n`;
  md += `**Language**: ${language} | **Difficulty**: ${difficulty}\n\n`;
  md += `## What This Code Does\n${summary}\n\n`;
  if (analogy) md += `## Analogy\n"${analogy}"\n\n`;
  if (stepByStep?.length) {
    md += `## Step-by-Step Walkthrough\n`;
    stepByStep.forEach(s => {
      md += `### Step ${s.step}: ${s.title} (${s.lines || ''})\n${s.explanation}\n\n`;
    });
  }
  if (lineByLine?.length) {
    md += `## Line-by-Line Breakdown\n`;
    lineByLine.forEach(l => {
      md += `- **L${l.lineNumber}**: \`${l.code}\` — ${l.explanation}\n`;
    });
    md += `\n`;
  }
  if (concepts?.length) {
    md += `## Key Concepts\n`;
    concepts.forEach(c => {
      md += `- **${c.name}**: ${c.explanation}\n`;
    });
    md += `\n`;
  }
  if (whatYouCanLearn?.length) {
    md += `## What You Can Learn\n`;
    whatYouCanLearn.forEach(p => {
      md += `- ${p}\n`;
    });
  }
  return md;
}

/**
 * Activate the extension
 */
function activate(context) {
  // Command: Explain Active File
  const explainFileCmd = vscode.commands.registerCommand('codeunderstander.explainFile', async (uri) => {
    let document;
    if (uri && uri.fsPath) {
      document = await vscode.workspace.openTextDocument(uri);
    } else {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active code file found to explain.');
        return;
      }
      document = editor.document;
    }

    const code = document.getText();
    if (!code || !code.trim()) {
      vscode.window.showWarningMessage('The file is empty.');
      return;
    }

    const ext = path.extname(document.fileName) || '.txt';
    const fileName = path.basename(document.fileName);

    await runExplanation(context, code, ext, fileName, 1, false, document.lineCount);
  });

  // Command: Explain Selected Code
  const explainSelectionCmd = vscode.commands.registerCommand('codeunderstander.explainSelection', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active code editor found.');
      return;
    }

    const selection = editor.selection;
    let code = editor.document.getText(selection);
    let startLine = selection.start.line + 1;

    const docTotalLines = editor.document.lineCount;
    // If no meaningful selection or cursor merely clicked on 1 line without highlight, explain entire file
    const isMeaningfulSelection = selection && !selection.isEmpty && code && code.trim().length > 0;

    if (!isMeaningfulSelection) {
      code = editor.document.getText();
      startLine = 1;
    }

    if (!code || !code.trim()) {
      vscode.window.showWarningMessage('No code found to explain.');
      return;
    }

    const ext = path.extname(editor.document.fileName) || '.txt';
    const fileName = path.basename(editor.document.fileName);

    await runExplanation(context, code, ext, fileName, startLine, isMeaningfulSelection, docTotalLines);
  });

  // Command: Set API Key
  const setApiKeyCmd = vscode.commands.registerCommand('codeunderstander.setApiKey', async () => {
    const key = await vscode.window.showInputBox({
      prompt: 'Enter your Gemini API Key',
      password: true,
      placeHolder: 'Paste API Key from Google AI Studio...',
      ignoreFocusOut: true
    });

    if (key && key.trim()) {
      await context.secrets.store('geminiApiKey', key.trim());
      vscode.window.showInformationMessage('CodeUnderstander: Gemini API Key updated successfully!');
    }
  });

  // Status Bar Item — Defaults to explaining active file!
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(sparkle) Explain File';
  statusBarItem.tooltip = 'CodeUnderstander: Explain Active File with Gemini (or use Ctrl+Alt+F)';
  statusBarItem.command = 'codeunderstander.explainFile';
  statusBarItem.show();

  context.subscriptions.push(
    explainFileCmd,
    explainSelectionCmd,
    setApiKeyCmd,
    statusBarItem
  );
}

function deactivate() {
  if (currentPanel) {
    currentPanel.dispose();
  }
}

module.exports = {
  activate,
  deactivate
};
