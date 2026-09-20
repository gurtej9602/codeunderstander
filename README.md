# CodeUnderstander 🚀

> **A Complete Multi-Language Code Reviewer powered strictly by Google Gemini's 100% Free Tier API (`gemini-1.5-flash`).**

CodeUnderstander analyzes source code files (`.java`, `.py`, `.js`, `.cpp`, `.html`, `.css`) with language-specific domain prompts to detect object-oriented design violations, memory leaks, null-pointer risks, security vulnerabilities, and code smells. It provides a visual quality score (0–10), an executive summary, and actionable line-by-line recommendations.

---

## ✨ Features

- 🎯 **Language-Specific AI Reviewers**:
  - **Java (`.java`)**: OOP best practices, NullPointerException risks, resource leaks (try-with-resources), and exception swallowing.
  - **Python (`.py`)**: PEP 8 violations, non-Pythonic anti-patterns, mutable default arguments, and security flaws.
  - **JavaScript (`.js`)**: Loose equality (`==`), unhandled Promises, floating async calls, and memory leaks.
  - **C++ (`.cpp`)**: Memory leaks (missing `delete` / raw pointers), buffer overflows, undefined behavior, and RAII.
  - **HTML (`.html`)**: Semantic HTML5 tags, accessibility standards (WCAG 2.1, ARIA, alt tags), and SEO metadata.
  - **CSS (`.css`)**: Selector specificity, layout performance (Grid/Flexbox), and responsive patterns.
- 💎 **Hallmark UI / UX**: Modern dark-slate aesthetic, interactive drag-and-drop dropzone, live line-numbered code viewer, circular quality score gauge, and filterable findings.
- 🛡️ **Strict Free-Tier Architecture**:
  - Hardcoded to Google's official free-tier model: `gemini-1.5-flash`.
  - Client-side & server-side rate-limiting (5-second cooldown per user).
  - 200KB payload truncation safeguard.
  - Graceful HTTP 429 quota handling with friendly user notifications.
  - API keys are **never** exposed to the frontend (backend `.env` only).
- ⚡ **1-Click Preloaded Samples**: Test Java, Python, JavaScript, C++, or HTML instantly with a single click.

---

## 🔑 Getting Your 100% FREE Gemini API Key

CodeUnderstander is designed to operate completely free of charge. You **do not** need a credit card.

1. Navigate to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Sign in with any standard Google account.
3. Click **"Create API key"** (or select **"Create API key in new project"**).
4. Copy your newly generated API key.

> ⚠️ **CRITICAL WARNING**:  
> **Do NOT enable billing** on that Google Cloud project unless you intend to move off the free tier. Gemini 1.5 Flash provides a generous free tier of up to 15 requests per minute (RPM) and 1 million tokens per minute (TPM) at zero cost!

---

## 🏗️ Project Structure

```text
Minor Projct clg/
├── client/                     # React + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/         # Hallmark UI components (DropZone, QualityBadge, etc.)
│   │   ├── utils/              # 1-click test samples (Java, Python, JS, C++, HTML)
│   │   ├── App.jsx             # Main interactive application workflow
│   │   └── main.jsx            # React root
│   ├── package.json
│   └── vite.config.js          # API proxy to backend (port 5000)
├── server/                     # Node.js + Express backend
│   ├── config/
│   │   └── promptTemplates.js  # Language prompts & schema enforcement
│   ├── middleware/
│   │   └── rateLimiter.js      # 5s per-user throttle & RPM protection
│   ├── routes/
│   │   └── reviewRoutes.js     # /api/review & /api/supported-languages
│   ├── services/
│   │   └── geminiService.js    # Gemini 1.5 Flash SDK integration
│   ├── .env.example            # Template for environment variables
│   ├── server.js               # Express entrypoint
│   └── package.json
├── samples/                    # Realistic test files (.java, .py, .js)
├── package.json                # Root automation scripts
└── README.md                   # Project manual
```

---

## 🚀 Quick Start (Step-by-Step)

### 1. Configure the Backend API Key
Navigate to `server/`:
```bash
# On Windows, copy .env.example to .env
copy server\.env.example server\.env
```
Open `server/.env` and paste your free Gemini API key:
```env
PORT=5000
GEMINI_API_KEY=AIzaSyYourActualKeyHere
```

---

### 2. Install Dependencies

You can install dependencies in both folders from the project root:

```bash
# From the project root folder:
npm run install:all
```
*(Or run `npm install` inside both `server/` and `client/` manually).*

---

### 3. Run Everything with a Single Command

From the root project directory, simply run:

```bash
npm start
```
*(Runs both Express Backend on `http://localhost:5000` and React Frontend on `http://localhost:3000` concurrently with colored logs).*

#### On Windows (1-Click Launcher):
You can also simply double-click **`run.bat`** (or type `.\run.bat` in your terminal). It will launch both servers and open your browser to **[http://localhost:3000](http://localhost:3000)** automatically!

---

## 🧪 Testing with Sample Files

CodeUnderstander comes with ready-to-test files located in `/samples` and preloaded directly into the UI:

- **`samples/Sample.java`**: Contains NullPointer hazards, unclosed `FileInputStream` resource leak, and raw generic Exception handling.
- **`samples/sample.py`**: Contains mutable default arguments `[]`, unclosed file handles, insecure `eval()`, and bare `except:` blocks.
- **`samples/sample.js`**: Contains loose equality `== 0`, accidental global variable leaks, and unhandled async Promise rejections.

To test:
1. Click **"Java"** under the upload box to load `Sample.java`.
2. Click **"Run AI Code Review"**.
3. Watch the radar scanner audit the code and display the structured results!

---

## 🛡️ Free-Tier Guardrails

| Guardrail | Implementation | Purpose |
| :--- | :--- | :--- |
| **Model** | Hardcoded `gemini-1.5-flash` | Prevents accidental charges from paid models (`pro`/`ultra`). |
| **User Throttling** | 5-second cooldown | Stops rapid double-clicking and spam. |
| **Global Ceiling** | In-memory sliding RPM counter | Keeps traffic within Gemini's 15 RPM free allowance. |
| **Payload Size** | 200 KB max (enforced) | Ensures token usage remains minimal per request. |
| **HTTP 429 Intercept** | Dedicated error handler | Shows clear countdown message if quota is temporarily met. |

---

## 🎓 College Submission Rationale & Prompt Routing

All prompts are decoupled inside `server/config/promptTemplates.js`. When a request is received:
1. The backend parses the file extension (e.g. `.java`).
2. The router retrieves the specialized persona (e.g., *Senior Java Architect*) and audit criteria (OOP, NPEs, resource leaks).
3. The prompt mandates strict JSON response format (`summary`, `qualityScore`, `issues` array).
4. Code fences and formatting are stripped and parsed deterministically for clean frontend consumption.
