# BiblioFetch

**BiblioFetch** is a web tool that automates the extraction, enrichment, and validation of academic bibliographic references. Paste the references section from a PDF or any document, and BiblioFetch will identify each work, find its DOI, and check whether a free PDF is available for download.

---

## Features

- **AI Extraction** — Uses Google Gemini to parse raw reference text and structure it into title, journal, and DOI fields, even when the source text has broken lines or stray hyphens from PDF copies
- **DOI & PDF Enrichment** — Queries the [OpenAlex](https://openalex.org) API to find missing DOIs and Open Access PDF links
- **Access Validation** — Tests each PDF link server-side and classifies results into three categories:
  - ✅ Accessible — free PDF found and confirmed
  - 🔒 Paywall — DOI found but no open access version
  - ❓ No DOI — reference could not be located in OpenAlex
- **Multiple AI Models** — Supports Gemini 2.5 Flash, Gemini 2.5 Flash Lite, Gemma 4 26B, and others
- **Bring Your Own Key** — Use the server's shared key (free tier) or paste your own Gemini API key for higher quotas

---

## Architecture

```
GitHub Pages (Frontend)               Hugging Face Spaces (Backend)
┌───────────────────────────┐         ┌──────────────────────────────────────┐
│  meneguinha.github.io/    │  HTTPS  │  fmenegottobr-bibliofetch.hf.space   │
│  BiblioFetch              │         │                                      │
│  ├─ index.html            │         │  FastAPI (app.py)                    │
│  ├─ script.js    ─────────┼────────▶│  /api/extract  (Gemini)              │
│  └─ style.css             │         │  /api/enrich   (OpenAlex)            │
└───────────────────────────┘         │  /api/validate (curl_cffi)           │
                                      │  /api/proxy_pdf                      │
                                      └──────────────────────────────────────┘
```

The frontend is a static site hosted on GitHub Pages. The backend runs as a FastAPI app inside a Docker container on Hugging Face Spaces and holds the Gemini API key securely as an environment secret — it never appears in the frontend code.

---

## Usage

1. Open the live site: **[meneguinha.github.io/BiblioFetch](https://meneguinha.github.io/BiblioFetch)**
2. Copy the references section of a paper or PDF (up to 200 lines)
3. Paste it into the text area
4. Choose your AI model and API key preference
5. Click **Process References** and wait for the three-step pipeline to complete
6. Download or open the accessible PDFs directly from the results panel

---

## Running Locally

### Backend

```bash
# Clone the repository
git clone https://github.com/meneguinha/BiblioFetch.git
cd BiblioFetch

# Install dependencies
pip install -r requirements.txt

# Set your Gemini API key
$env:GEMINI_API_KEY = "your-key-here"   # PowerShell
# or
export GEMINI_API_KEY="your-key-here"   # bash

# Start the server
uvicorn app:app --reload
# API available at http://localhost:8000
# Docs available at http://localhost:8000/docs
```

### Frontend

> [!IMPORTANT]
> The `script.js` file points to the production HF Space by default. Before testing locally, change **line 2** to point to `localhost`:
> ```js
> // Change this:
> const API_BASE_URL = 'https://fmenegottobr-bibliofetch.hf.space/api';
> // To this:
> const API_BASE_URL = 'http://localhost:8000/api';
> ```

Open `index.html` with the **Live Server** extension in VS Code (or any local HTTP server).

---

## Deployment

| Layer    | Platform              | Notes                                              |
|----------|-----------------------|----------------------------------------------------|
| Frontend | GitHub Pages          | Served from the `main` branch root                 |
| Backend  | Hugging Face Spaces   | Docker SDK — see `Dockerfile`                      |
| API Key  | HF Space Secrets      | Set `GEMINI_API_KEY` in Space Settings → Secrets   |

> Before pushing to GitHub, update `API_BASE_URL` in `script.js`:
> ```js
> const API_BASE_URL = 'https://fmenegottobr-bibliofetch.hf.space/api';
> ```

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Python, FastAPI, Uvicorn |
| AI | Google Gemini (via `google-generativeai`) |
| Reference data | OpenAlex API |
| PDF validation | `curl_cffi` (browser impersonation) |
| Containerization | Docker |

---

## Limitations

- Input is limited to **200 lines** to stay within free API quotas
- Open Access PDF availability depends on what OpenAlex has indexed
- Some publishers block automated access even to legitimately free articles
- Free Gemini tier has rate limits; use your own key for heavier usage

---

## License

MIT
