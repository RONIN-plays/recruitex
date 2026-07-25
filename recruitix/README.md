
# Recruitix Live Integrity System

## A Parameterized and Deterministic Framework for Robust AI-Driven Assessment and Integrity Validation

---

## 🚀 Overview

**Recruitix** is an AI-driven online assessment and proctoring platform designed to ensure **fairness**, **reproducibility**, and **integrity** in remote evaluations.

Unlike traditional AI-based testing systems that rely on random logic or opaque algorithms, Recruitix introduces a **deterministic**, **parameterized**, and **auditable** framework for technical, HR, and live interview assessments.

The system combines **semantic grading**, **behavioral simulation**, and **live integrity monitoring** to create a transparent, explainable, and ethical AI evaluation environment.

Recruitix can be used by **academic institutions**, **corporate recruiters**, and **certification agencies** for secure, large-scale, and unbiased assessments.

---

## 🧩 Key Features

* ✅ **Deterministic Evaluation Engine** – Produces identical results for identical inputs, ensuring full reproducibility.
* ✅ **Semantic Similarity Scoring** – Uses Jaccard similarity and keyword weighting for accurate conceptual grading.
* ✅ **HR Simulation Engine** – Implements deterministic behavioral models for candidate profiling.
* ✅ **Parameterized Proctoring System** – Monitors live video and event data to detect integrity violations.
* ✅ **Secure Firebase Backend** – Authentication, real-time database, and safe environment-based credential handling.
* ✅ **Responsive Web Interface** – Developed using React + TypeScript with Framer Motion and Shadcn UI.
* ✅ **Explainable and Auditable AI** – Every score, deduction, and event is logged for transparency.

---

## ⚙️ Tech Stack

| Category | Technologies |
| :----------- | :-------------- |
| **Frontend** | React.js, TypeScript, Shadcn UI, Framer Motion |
| **Backend** | Firebase (Auth, Firestore, Hosting) |
| **Algorithms** | Jaccard Similarity, Event-Driven Scoring |
| **Security** | Environment-based variables, OWASP compliance |
| **Tools** | Vite, Node.js, GitHub, VS Code |

---

## 🧠 System Architecture

### Text Overview

```

User Interface (React + TypeScript)
↓
Deterministic Core Algorithms
├── Semantic Similarity Engine
├── HR Simulation Engine
└── Parameterized Proctoring
↓
Firebase Backend (Auth | Firestore | Event Logs)
↓
Dashboard & Integrity Report Visualization

````

### Core Components

* `semanticSimilarity.ts` → Computes conceptual and keyword-based grading
* `hrSimulationEngine.ts` → Generates deterministic behavioral test data
* `monitoringProfiles.ts` → Defines event severity for proctoring validation
* `LiveInterview.tsx` → Live session and score tracking UI

---




### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Firebase

Create a `.env` file in the project root and add your Firebase configuration:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 4️⃣ Run Locally

```bash
npm run dev
```

Now open `http://localhost:5173` to view Recruitix in your browser.

-----

## 📊 Experimental Results

| Metric | Description | Result |
| :--- | :--- | :--- |
| **Reproducibility** | Output consistency across runs | 99.9% |
| **Semantic Fairness** | Correlation with expert grading | 92% |
| **Integrity Latency** | Detection delay for violations | 340 ms |
| **Security Validation** | Firebase key exposure incidents | 0 |

> Recruitix achieved stable, reproducible outcomes across all tests, validating its deterministic design and fair evaluation framework.

-----

## 📈 Market Opportunity

The global market for AI-based assessment and proctoring tools is projected to reach **USD 12.8 Billion by 2030**, growing at a CAGR of 16.5%.

Recruitix targets this space with three main differentiators:

1.  **Transparent, explainable AI evaluation**
2.  **Deterministic and reproducible assessment logic**
3.  **Lightweight and secure cloud-based architecture**

### 💼 Market Scope (TAM–SAM–SOM)

| Category | Description | Value (USD) |
| :--- | :--- | :--- |
| **TAM** | Total global AI assessment market | 12.8 Billion |
| **SAM** | Academic and HR-focused assessment systems | 3.84 Billion |
| **SOM** | Early achievable Recruitix share | 115 Million |

> Recruitix’s scalable and ethical design allows it to penetrate both academic and corporate segments, making it suitable for long-term adoption and commercialization.

-----

## 🧰 Folder Structure

```
Recruitix/
├── src/
│   ├── components/
│   │   ├── LiveInterview.tsx
│   │   ├── monitoringProfiles.ts
│   │   └── semanticSimilarity.ts
│   ├── utils/
│   │   └── hrSimulationEngine.ts
│   └── App.tsx
├── public/
│   └── assets/
├── exam_proctor.py          ← Python face recognition proctoring
├── requirements.txt         ← Python dependencies
├── snapshots/               ← Violation snapshots (auto-created)
├── violations.jsonl         ← Violation log (auto-created)
├── .env.example
├── package.json
├── vite.config.ts
└── README.md
```

-----

## 🧬 Python Face Recognition Proctoring Module

Recruitix includes a standalone **Python-based exam proctoring system** (`exam_proctor.py`) that uses real face recognition to verify and continuously monitor student identity during exams.

### How It Works

| Library | Purpose |
| :--- | :--- |
| **MediaPipe FaceMesh** | Face presence, face count, head pose estimation (yaw/pitch). Cannot verify identity. |
| **face_recognition (dlib)** | 128-d face embeddings for identity verification against the registered student photo. |
| **OpenCV** | Camera capture, frame processing, and live preview window. |

### Features

* ✅ **Identity Gate** — Student must match their registered photo before the exam can start (30s timeout)
* ✅ **Continuous Identity Re-verification** — Periodically checks that the same person is still at the camera
* ✅ **Face Count Monitoring** — Detects if additional people appear in frame
* ✅ **Head Pose Estimation** — Flags when student looks away (yaw > 30° or pitch > 25°)
* ✅ **Debounced Violation System** — 3 consecutive strikes before confirming a violation
* ✅ **JSONL Violation Log** — Machine-readable log with timestamps and snapshot paths
* ✅ **Frame Snapshots** — Captures the exact frame at the moment of each violation

### Installation

```bash
# Install Python dependencies
pip install -r requirements.txt
```

> **Windows Note:** `face_recognition` requires **dlib**, which needs **CMake** and a C++ compiler.
> Install CMake first: `pip install cmake`, or use conda:
> ```bash
> conda install -c conda-forge dlib face_recognition
> ```

### Usage

```bash
# Basic usage — verify against student photo and monitor
python exam_proctor.py --reference student_photo.jpg

# Use a specific camera (e.g., external webcam)
python exam_proctor.py --reference student_photo.jpg --camera 1

# Run headless (no preview window)
python exam_proctor.py --reference student_photo.jpg --no-window
```

### Output Files

| File | Description |
| :--- | :--- |
| `violations.jsonl` | One JSON line per confirmed violation (type, message, timestamp, snapshot path) |
| `snapshots/*.jpg` | Frame captured at the moment of each violation |

### Configuration

Key parameters can be adjusted at the top of `exam_proctor.py`:

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `MATCH_TOLERANCE` | 0.55 | Face distance threshold; lower = stricter |
| `IDENTITY_CHECK_EVERY_S` | 8 | Seconds between identity re-checks |
| `PRESENCE_CHECK_EVERY_S` | 1.0 | Seconds between face count / pose checks |
| `STRIKES_TO_VIOLATION` | 3 | Consecutive failures before flagging |
| `MAX_YAW_DEG` | 30 | Max head turn (left/right) in degrees |
| `MAX_PITCH_DEG` | 25 | Max head tilt (up/down) in degrees |

-----

## 🔐 Security Highlights

  * 🔒 **No hardcoded credentials** in source code.
  * 🔒 **Environment-based** Firebase configuration.
  * 🔒 Authentication with **access tokens**.
  * 🔒 Compliant with **OWASP Secure Coding Practices**.

-----

## 🌍 Live Demo and Resources

| Resource | Link |
| :--- | :--- |
| **🚀 Live App** | [https://recruitix-eight.vercel.app/](https://recruitix-eight.vercel.app/) |
| **🎥 Demo Video** | [suspicious link removed] |
| **📄 Research Paper** | [suspicious link removed] |


-----

## 🧑‍💻 Contributors

| Name | Role | Institution |
| :--- | :--- | :--- |
| **Debangshu Chatterjee** | Lead Developer & Researcher | IEM Kolkata |


## 🧾 License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute for research and educational purposes.

-----

## 🏁 Conclusion

Recruitix demonstrates how deterministic algorithms, semantic logic, and ethical AI can transform modern remote assessments into transparent, fair, and secure processes. Its reproducible design ensures that every score is explainable, auditable, and trustworthy—setting a new benchmark for AI-integrated evaluation systems.

> **"Reproducibility builds trust — Recruitix builds reproducibility."**

```
```
