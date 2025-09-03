# SafeSpace (SS)

**Protect retail investors — detect fraudulent advisers, fake SEBI letters & scam apps instantly**

---

## Demo MVP

SafeSpace is a rapid-demo platform designed to showcase detection of potential investment frauds. It combines:

- **Rules-first red-flag detection**
- **OCR-based document analysis**
- **SEBI registration verification (mock)**
- **Explainable risk scoring**
- **AI assistance**: draft questions, analyze tips, highlight risks
- **Custom ML layer**: fraud detection heuristics for tips and documents

> ⚠️ Demo-ready. For production, integrate SEBI APIs and enhanced OCR/visual checks.

---

## Marketplace

### SEBI-Verified Adviser Marketplace

**Connect with SEBI-registered advisers, access verified research, and make investment decisions with confidence.**

> Demo MVP — integrate official SEBI APIs for production.

#### Browse Advisers

View detailed profiles of SEBI-registered advisers, including expertise, research reports, and client reviews.

**[Browse Now →](#)**

#### Onboard as Adviser

Join the marketplace as a verified SEBI adviser:

- Submit SEBI registration number  
- Upload credentials (PDF / proof)  
- Start offering advisory services securely

**[Start Onboarding →](#)**

#### Secure & Compliant

- Verified against SEBI mock registry (replace with real API for production)  
- Audit logs for client interactions  
- Agreements stored securely  

**[Check Compliance →](#)**

#### Why Use This Marketplace?

| Feature               | Benefit |
|-----------------------|---------|
| **Trust**             | All advisers verified against SEBI records (demo). No fake advisors. |
| **Transparency**      | Clear client reviews, research reports, and advisory history for informed decisions. |
| **Compliance**        | Agreements & audit logs stored securely; integrate real SEBI API in production. |
| **AI Assistance**     | Draft questions, analyze tips, and highlight potential risks in adviser communications. |
| **Custom ML / Risk Scoring** | Rules-first + ML heuristics for fraud detection, tip analysis, and document verification with explainable risk scores. |

---

## Core Tools

Each tool has its own page — click to open and run. Cards highlight the key capabilities you can demo to judges.

### 1. Check Documents

**OCR + rules scan to detect fake SEBI letters, approvals, and suspicious text.**

- Extract text from PDF & detect suspicious terms  
- Flag: `"approved by SEBI"`, `"guaranteed allotment"`, etc.  
- Returns extracted text, suspicious flag, recommendations  

**[Open Docs](#)** – One-click Demo

---

### 2. Deepfake / Media Analysis

**Upload videos or provide URLs to check for synthetic/deepfake media (demo/mock).**

- Upload local video file or provide public URL  
- Heuristic deepfake detection (file size, frame analysis)  
- Returns suspicious flag, notes, and analysis summary  

**[Open Deepfake Tool](#)** – One-click Demo

---

### 3. Verify Trading Apps

**Whitelist checks, UI/branding similarity detection, and app verification warnings (prototype).**

- Whitelist of trusted brokers (demo)  
- Warn and recommend not to install unknown apps  
- Easy to extend with metadata & app signature checks  

**[Open App Verifier](#)** – One-click Demo

---

### 4. Analyze Stock Tips

**Paste Telegram/WhatsApp tips, run red-flag scan and optional ML classification.**

- Detect `"guaranteed"`, `"inside info"`, group invites  
- Produce risk score, red-flag matches & guidance  
- Future: integrate market anomaly checks  

**[Open Tips](#)** – One-click Demo

---

## How It Works (Technical)

1. **Input:** advisor bio, tip text, or PDF upload  
2. **Rules engine:** regex scans for SEBI-aligned red flags (guarantees, insider tips, OTP requests)  
3. **SEBI check:** flexible RegNo extraction + lookup (mock DB). Replace with official SEBI feed for production  
4. **Document analysis:** pdfjs OCR → extract text → apply rules. For scanned PDFs, use Tesseract/Cloud OCR  
5. **ML layer (optional):** zero-shot classification (HF/GenAI) for nuanced text; non-blocking to rules-first result  
6. **AI Assistant:** draft messages, highlight risks, suggest questions for advisers  
7. **Output:** riskScore, verdict (LOW/MEDIUM/HIGH), red-flag list, recommendations, and evidence panel  

---

## Security & Production Checklist

- Integrate official SEBI registry & cache results for fast lookup  
- Harden file uploads (scan for malware, limit file sizes)  
- Use robust OCR for scanned letters (Tesseract / Google Vision)  
- Visual checks: logo template matching, metadata verification for PDF authenticity  
- Logging & audit trail for every verification (immutable logs for regulator review)  
- Explainability: persist matched rules & ML scores for appeals or takedowns  

---

## Demo Tips for Judges

Suggested 3-step demo:

1. **Run a Tip Analyzer preset**  
2. **Upload a fake SEBI-like PDF**  
3. **Verify an unlisted app**  

> Explain the risk score and show the evidence panel.

[Run Tips Demo](#) | [Upload Doc](#) | [Verify App](#)

---

## SEBI SafeSpace (Demo)

- Not legal advice  
- Integrate official SEBI registries for production

---

### Quick Links

- [Privacy](#)  
- [Terms](#)  
- [Contact](#)
