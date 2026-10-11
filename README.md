# G.O.A.T. Shield 1.0
### Privacy-Preserving Cross-Bank Mule & Fraud Intelligence Platform

> **PROTOTYPE NOTICE:** Stage 1 uses synthetic/mock banking data. ML detection and privacy-preserving components are not yet implemented.

---

## 1. Project Overview

**G.O.A.T. Shield** is a fintech and cybersecurity solution engineered to detect suspicious mule accounts and money laundering topologies crossing institutional boundaries without compelling financial institutions to disclose raw customer or transaction data.

Stage 1 establishes a modular, full-stack application foundation:
- An asynchronous FastAPI backend serving structured synthetic mock datasets.
- A high-contrast dark cybersecurity dashboard built in React + Vite with Tailwind CSS.
- Dedicated interactive interfaces for transaction monitoring, bank data isolation verification, and mock security alerts.
- Clearly designated architectural preview stations for Stage 2 graph intelligence and cryptographic privacy layers.

---

## 2. Architecture for Stage 1

```
+-------------------------------------------------------------------------+
|                         React Frontend (Vite)                           |
|  - Dark Cybersecurity UI (Tailwind CSS)                                 |
|  - Active: Overview Dashboard, Transactions Filter, Alerts Response     |
|  - Roadmapped: Network GNN, PSI/HE Privacy, Federated Learning          |
+------------------------------------+------------------------------------+
                                     | Axios HTTP (JSON)
                                     v
+-------------------------------------------------------------------------+
|                         FastAPI Backend Service                         |
|  - Uvicorn ASGI Server (:8000)                                          |
|  - Strict Pydantic Data Models                                          |
|  - Local JSON Mock Datasets (Simulated Bank A, B, C)                    |
|  - Cross-Origin Resource Sharing (CORS) Enabled                         |
+-------------------------------------------------------------------------+
```

---

## 3. Technology Stack

- **Frontend**:
  - React 18
  - Vite 6
  - Tailwind CSS 3
  - Lucide React (Cybersecurity & Fintech icons)
  - Axios (HTTP client)
- **Backend**:
  - Python 3.10+ (Running on Python 3.14)
  - FastAPI
  - Uvicorn (ASGI web server)
  - Pydantic v2
- **Storage / Data**:
  - Local synthetic JSON fixtures (`backend/data/`)
  - No database required for Stage 1

---

## 4. Folder Structure

```
goat-shield/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BankCard.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── TransactionDrawer.jsx
│   │   ├── pages/
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── OverviewPage.jsx
│   │   │   ├── PlaceholderPage.jsx
│   │   │   └── TransactionsPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── data/
│   │   │   └── fallbackData.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── data/
│   │   ├── alerts.json
│   │   ├── banks.json
│   │   └── transactions.json
│   ├── main.py
│   └── requirements.txt
│
├── README.md
└── .gitignore
```

---

## 5. Backend Setup

From the `goat-shield/backend` directory:

```bash
# Optional: create a virtual environment
python -m venv .venv
# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install required packages
pip install -r requirements.txt
```

---

## 6. Frontend Setup

From the `goat-shield/frontend` directory:

```bash
# Install node packages
npm install
```

---

## 7. How to Run

### Step 1: Start the Backend Service
From `goat-shield/backend`:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be live at `http://127.0.0.1:8000`.
Interactive API documentation will be available at `http://127.0.0.1:8000/docs`.

### Step 2: Start the Frontend Dashboard
From `goat-shield/frontend`:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 8. Available API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root identity endpoint returning project name, version, and status |
| `GET` | `/api/health` | Health check endpoint returning status code and operational state |
| `GET` | `/api/banks` | Connection metadata and transaction metrics for Bank A, Bank B, and Bank C |
| `GET` | `/api/transactions` | Synthetic inter-bank transaction ledger with flow details |
| `GET` | `/api/alerts` | Flagged synthetic mule velocity and risk alert events |

---

## 9. Current Implementation Status (Stage 1)

- [x] Full-stack architecture scaffolding
- [x] FastAPI REST endpoints with CORS and Pydantic validation
- [x] Realistic synthetic banking data fixtures (Apex National, Beacon Mutual, Crestline Commercial)
- [x] Dark fintech/cybersecurity responsive interface
- [x] Live system metrics summary cards
- [x] Bank data isolation status monitoring
- [x] Searchable, filterable transaction table with slide-over audit drawer
- [x] Security alert incident feed with mock disclaimers
- [x] Loading, error, and offline fallback states
- [x] Professional Stage 2 placeholder architecture scree

- **Cross-Bank Graph Neural Networks (GraphSAGE / GNN)**:
  - Distributed multi-hop graph topology representation.
  - Identification of cyclic layering chains and fan-in funnel hubs.
- **Cryptographic Privacy Layer**:
  - **Private Set Intersection (PSI)** to discover overlapping suspicious counterparties across banks without revealing non-suspicious accounts.
  - **Paillier Homomorphic Encryption (HE)** for cross-institution encrypted risk weight aggregation.
- **Federated Learning (FedAvg)**:
  - Collaborative model weight training directly within bank enclaves.
  - Differential Privacy (DP) guarantees to prevent extraction of training samples.
- **Dynamic Simulation Engine**:
  - Configurable transaction generator for stress-testing detection algorithms.
