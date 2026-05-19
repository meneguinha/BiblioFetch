from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import google.generativeai as genai
import json
import re
import requests
import urllib.parse
import difflib
import time
from curl_cffi import requests as requests_cffi
from typing import List, Optional
from openai import OpenAI

app = FastAPI(title="BiblioFetch API")

# CORS configuration - only the GitHub Pages frontend is allowed to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://meneguinha.github.io",  # Production: GitHub Pages
        "http://localhost:5500",          # Dev: Live Server (VS Code)
        "http://127.0.0.1:5500",         # Dev: Live Server alternate
        "http://localhost:8000",          # Dev: local FastAPI test
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    text: str
    model: Optional[str] = None
    api_key: Optional[str] = None
    provider: Optional[str] = "google"

class ReferenceItem(BaseModel):
    title: Optional[str] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    pdf_url: Optional[str] = None

class EnrichRequest(BaseModel):
    references: List[ReferenceItem]

class ValidateRequest(BaseModel):
    references: List[ReferenceItem]

@app.post("/api/extract")
def extract_references(req: ExtractRequest):
    """
    Step 1: Uses Gemini to extract references from raw text.
    """
    # Security: reject inputs that exceed the 200-line limit
    line_count = len(req.text.splitlines())
    if line_count > 200:
        raise HTTPException(
            status_code=400,
            detail=f"Input too long: {line_count} lines. Maximum allowed is 200 lines."
        )

    try:
        # Pre-processing: Clean broken line breaks from PDFs
        # 1. Rejoin words hyphenated at end of line
        clean_text = re.sub(r'-\s*\n\s*', '', req.text)
        # 2. Replace single newlines with a space (preserves double-newline paragraphs)
        clean_text = re.sub(r'(?<!\n)\n(?!\n)', ' ', clean_text)
        
        prompt = f"""
        Extract bibliographic data from the provided text and return a valid JSON array.
        Note: The source text was copied from a PDF and may contain minor line breaks or stray hyphens. Ignore these formatting issues and reconstruct names and titles correctly where needed.
    
        Expected structure per item:
        {{
            "title": "Article/book name",
            "journal": "Journal/Publisher or null",
            "doi": "DOI link/code or null"
        }}

        Text for extraction:
        {clean_text}
        """

        if req.provider == "nvidia":
            nvidia_key = req.api_key or os.environ.get("NVIDIA_API_KEY")
            if not nvidia_key:
                raise HTTPException(
                    status_code=400,
                    detail="NVIDIA API key not found. Set the NVIDIA_API_KEY environment variable on the server or provide your own key in the panel."
                )
            
            client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=nvidia_key
            )
            
            chosen_model = req.model or "meta/llama3-70b-instruct"
            
            completion = client.chat.completions.create(
                model=chosen_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2048
            )
            raw_text = completion.choices[0].message.content

        else:
            gemini_key = req.api_key or os.environ.get("GEMINI_API_KEY")
            if not gemini_key:
                raise HTTPException(
                    status_code=400,
                    detail="Gemini API key not found. Set the GEMINI_API_KEY environment variable on the server or provide your own key in the panel."
                )

            genai.configure(api_key=gemini_key)

            # Mapping of user-friendly model names to Google API identifiers
            model_mapping = {
                "Gemini 2.5 Flash": "models/gemini-2.5-flash",
                "Gemini 2.5 Flash Lite": "models/gemini-2.5-flash-lite",
                "Gemini 3 Flash": "models/gemini-3-flash-preview",
                "Gemini 3.1 Flash Lite": "models/gemini-3.1-flash-lite-preview",
                "Gemma 4 26B": "models/gemma-4-26b-a4b-it",
                "Gemma 4 31B": "models/gemma-4-31b-it"
            }

            chosen_model = "models/gemma-4-26b-a4b-it"
            if req.model:
                if req.model in model_mapping:
                    chosen_model = model_mapping[req.model]
                elif req.model.startswith("models/"):
                    chosen_model = req.model

            ai_model = genai.GenerativeModel(
                model_name=chosen_model,
                generation_config={"temperature": 0.1}
            )

            response = ai_model.generate_content(prompt)
            raw_text = response.text

        # Smart extraction of JSON block
        match = re.search(r'```json\s*(.*?)\s*```', raw_text, re.DOTALL | re.IGNORECASE)
        if match:
            json_text = match.group(1)
        else:
            start = raw_text.find('[')
            end = raw_text.rfind(']')
            if start != -1 and end != -1:
                json_text = raw_text[start:end+1]
            else:
                json_text = raw_text

        structured_list = json.loads(json_text)
        return {"references": structured_list}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Critical JSON syntax error: {e}")
    except Exception as e:
        # Safety fallback if the requested model is not found or has no quota/access
        if "is not found" in str(e).lower() or "not a supported model" in str(e).lower() or "method not found" in str(e).lower():
            raise HTTPException(status_code=500, detail=f"Model '{chosen_model}' not found or not supported with your API Key. Choose another model (e.g. 'Gemini 2.5 Flash') and try again.")
        raise HTTPException(status_code=500, detail=f"Unexpected AI error: {e}")


@app.post("/api/enrich")
def enrich_references(req: EnrichRequest):
    """
    Step 2: Scans the reference list for DOIs and PDF links via OpenAlex.
    """
    result_list = []

    for item in req.references:
        ref = item.model_dump()
        title = ref.get('title')
        current_doi = ref.get('doi')

        # If a DOI already exists we keep it, but still query OpenAlex to find a free PDF
        if title:
            query = urllib.parse.quote(title)
            url = f"https://api.openalex.org/works?filter=title.search:{query}&per_page=1"
            headers = {"User-Agent": "BiblioFetchWeb/1.0 (mailto:your_email@example.com)"}

            try:
                time.sleep(0.4)  # OpenAlex rate-limit politeness
                response = requests.get(url, headers=headers, timeout=10)

                if response.status_code == 200:
                    results = response.json().get('results', [])
                    if results:
                        work = results[0]
                        returned_title = work.get('title', '').lower().strip()
                        t1 = title.lower().strip()
                        similarity = difflib.SequenceMatcher(None, t1, returned_title).ratio()

                        if similarity >= 0.85:
                            # 1. Attach DOI if missing
                            if not current_doi or str(current_doi).lower() in ["null", "none", ""]:
                                ref['doi'] = work.get('doi')
                            
                            # Update current_doi if we found one
                            current_doi = ref.get('doi')

                            # 2. Find Open Access link (PDF)
                            oa = work.get('open_access', {})
                            if oa:
                                oa_url = oa.get('oa_url')
                                if oa_url:
                                    ref['pdf_url'] = oa_url
            except Exception:
                pass  # On individual network failure, continue to next item
            
            # Fallback to Semantic Scholar if OpenAlex didn't find the missing DOI or PDF
            needs_doi = not current_doi or str(current_doi).lower() in ["null", "none", ""]
            needs_pdf = not ref.get('pdf_url')
            
            if needs_doi or needs_pdf:
                ss_url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit=1&fields=title,externalIds,openAccessPdf"
                try:
                    time.sleep(0.5)  # Semantic Scholar rate-limit politeness
                    ss_response = requests.get(ss_url, headers=headers, timeout=10)
                    if ss_response.status_code == 200:
                        ss_data = ss_response.json()
                        ss_results = ss_data.get('data', [])
                        if ss_results:
                            paper = ss_results[0]
                            returned_title = paper.get('title', '').lower().strip()
                            t1 = title.lower().strip()
                            similarity = difflib.SequenceMatcher(None, t1, returned_title).ratio()
                            
                            if similarity >= 0.85:
                                # 1. Attach DOI if missing
                                if needs_doi:
                                    external_ids = paper.get('externalIds', {})
                                    if external_ids and 'DOI' in external_ids:
                                        ref['doi'] = f"https://doi.org/{external_ids['DOI']}"
                                
                                # 2. Find Open Access link (PDF)
                                if needs_pdf:
                                    oa_pdf = paper.get('openAccessPdf')
                                    if oa_pdf and isinstance(oa_pdf, dict):
                                        oa_url = oa_pdf.get('url')
                                        if oa_url:
                                            ref['pdf_url'] = oa_url
                except Exception:
                    pass

        result_list.append(ref)

    return {"references": result_list}

@app.post("/api/validate")
def validate_references(req: ValidateRequest):
    """
    Step 3: Tests direct download links (Plan A) and produces the 3 final lists.
    """
    accessible_files = []
    blocked_files = []
    no_doi_files = []

    for item in req.references:
        ref = item.model_dump()
        title = ref.get('title', 'untitled_document')
        doi = ref.get('doi')
        pdf_url = ref.get('pdf_url')
        journal = ref.get('journal', 'Not provided')

        # URL formatting to prevent the browser from treating them as relative local paths
        if doi and isinstance(doi, str) and doi.lower() not in ["null", "none", ""]:
            doi = doi.strip()
            if doi.startswith("10.") and "/" in doi:
                doi = f"https://doi.org/{doi}"
            elif not doi.startswith("http://") and not doi.startswith("https://"):
                doi = f"https://{doi}"
        else:
            doi = None

        if pdf_url and isinstance(pdf_url, str) and pdf_url.lower() not in ["null", "none", ""]:
            pdf_url = pdf_url.strip()
            if not pdf_url.startswith("http://") and not pdf_url.startswith("https://"):
                pdf_url = f"https://{pdf_url}"
        else:
            pdf_url = None

        # Triage 1: No DOI
        if not doi or str(doi).lower() in ["null", "none", ""]:
            no_doi_files.append({"title": title, "journal": journal})
            continue

        # Triage 2: Has DOI but no Open Access PDF link
        if not pdf_url:
            blocked_files.append({
                "title": title,
                "doi": doi,
                "reason": "🔒 Paywall (Closed article / Requires paid journal subscription)"
            })
            continue

        # Triage 3: Access test (Plan A) via curl_cffi
        pdf_accessible = False
        try:
            # We do not actually download on the server — we only validate that the URL returns 200.
            # The user downloads the file from the frontend by clicking the link.
            time.sleep(0.5)
            # stream=True to avoid loading the full PDF into server RAM
            response = requests_cffi.get(pdf_url, impersonate="chrome120", timeout=15, allow_redirects=True, stream=True)
            if response.status_code == 200:
                pdf_accessible = True
        except Exception:
            pass

        if pdf_accessible:
            accessible_files.append({
                "title": title,
                "doi": doi,
                "pdf_url": pdf_url
            })
        else:
            blocked_files.append({
                "title": title,
                "doi": doi,
                "reason": "🚫 Download Blocked (Server rejected the IP or link timed out)"
            })

    return {
        "success": accessible_files,
        "paywall_blocked": blocked_files,
        "no_doi": no_doi_files
    }

@app.get("/api/proxy_pdf")
def proxy_pdf(url: str):
    """
    CORS bypass bridge. The server downloads the PDF into memory and passes it
    to the frontend without saving anything to disk.
    """
    try:
        # Use requests_cffi to maintain browser impersonation
        response = requests_cffi.get(url, impersonate="chrome120", timeout=30, allow_redirects=True)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch PDF from origin.")

        # Return raw bytes with the correct header so JavaScript can read them
        return Response(content=response.content, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")
