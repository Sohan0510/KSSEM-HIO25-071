# 🌾 AgriTrust – Trusted Agricultural Data Platform

### Decentralized Proof of Integrity for Smart Agriculture

AgriTrust ensures **farm data authenticity** by using cryptographic proofs and distributed witness verification.  
It builds **Merkle trees** from farm IoT readings, gets **independent witness signatures**, and stores **verifiable anchors** — making agricultural data tamper-evident, transparent, and reliable.

---

## 🧭 Overview

| Component | Description |
|------------|--------------|
| **Backend** | Node.js + Express + MongoDB server managing readings, anchors, authentication, and verification. |
| **Witness Servers** | Lightweight ED25519 signers that attest Merkle roots (providing decentralized trust). |
| **Frontend** | React-based dashboard to visualize verified readings and anchor status. |
| **Integrity Service** | Generates canonical JSON hashes, computes Merkle roots, and verifies witness signatures. |

---

## 🧩 Project Structure

ONG/
└── KSSEM-HIO25-071-test2/
├── backend/
│ ├── server.js # Main Express backend
│ ├── Dockerfile
│ ├── .env # Environment config (replace for safety)
│ ├── src/
│ │ ├── crypto-utils.js # Canonical JSON + SHA-256 hashing
│ │ ├── merkle.js # Merkle tree logic
│ │ ├── middleware/auth.js
│ │ ├── services/integrity.js # Core anchoring logic
│ │ ├── models/ # Mongoose models (Reading, Anchor, User, etc.)
│ │ └── routes/ # Express routes (auth, device, admin, dashboard)
│ └── data/
│ └── ksdev002-21days.json # Sample dataset
│
├── frontend-fixed/
│ ├── index.html # Frontend entry
│ └── src/ # React app for visualization
│
└── witness/
├── witness-server.js # ED25519 signer microservice
└── package.json

yaml
Copy code

---

## 🧠 How It Works

### 1️⃣ Data Collection
IoT devices or farmers submit readings to the backend via secure API endpoints.  
Each reading is normalized and stored in MongoDB.

### 2️⃣ Hashing & Merkle Root
Every reading is **canonicalized** (consistent JSON order) → **SHA-256** hash created.  
All hashes for a given day are combined into a **Merkle root** ensuring data integrity.

### 3️⃣ Witness Verification
Backend sends the Merkle root to multiple **witness servers**, each returning:
- A **digital signature**
- Its **public key**

When a **quorum** of witnesses sign the same Merkle root, that day’s data becomes **anchored** and trusted.

### 4️⃣ Proof & Audit
Anchors and signatures are stored permanently.  
Farmers, buyers, or auditors can verify the authenticity of any reading using the stored proofs.

---

## ⚙️ Environment Setup

Create a new `.env` file inside `/backend`:

```bash
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/agriportal

# JWT
JWT_SECRET=replace_with_strong_secret
JWT_REFRESH_SECRET=replace_with_another_secret

# Witness URLs (comma-separated)
WITNESS_URLS=http://localhost:6001/sign,http://localhost:6002/sign

# Anchoring Rules
ANCHOR_QUORUM=2
RAW_RETENTION_DAYS=90
VERIFY_WINDOW_DAYS=20

🚀 Running the Project
Step 1: Start the Backend
bash:
    cd backend
    npm install
    npm run dev   # or: npm start
    Default port → 5000
    Backend connects to MongoDB and initializes the anchoring service.


Step 2: Launch Witness Servers:
    Each witness provides an independent signature for Merkle roots.
    bash:
        cd witness
        npm install

        # Generate a 32-byte ED25519 seed
        export ED25519_SEED_HEX=$(openssl rand -hex 32)

        # Start the witness
        node witness-server.js

✅ Default witness port → 6001 (you can run multiple witnesses on 6001, 6002, ...)

Witness endpoint:

http:
    POST /sign
    {
        "dayKey": "2025-11-08",
        "merkleRoot": "<hex-value>"
    }

Returns:
json:
    {
        "signature": "<base64>",
        "publicKey": "<hex>",
        "dayKey": "2025-11-08",
        "merkleRoot": "<hex>"
    }

Step 3: Start the Frontend
bash:
    cd frontend-fixed
    npm install
    npm run dev

Visit http://localhost:5173 (or whichever port Vite prints).
You’ll see the dashboard showing readings, verification, and anchor states.

🧮 Demo Using Sample Data
Populate database with provided dataset:

bash:
    mongoimport --uri="mongodb://localhost:27017/agriportal" \
    --collection=readings \
    --file=backend/data/ksdev002-21days.json \
    --jsonArray

Trigger anchoring (via Admin route or scheduled cron) and check:
    1. Anchor records are created with witness signatures.
    2. Verification API returns verified: true for daily proofs.

🧱 Important Code Files for Evaluation:

File	                                    Description

backend/server.js	                        Initializes API, routes, and anchoring cycle
backend/src/crypto-utils.js	                Canonical JSON + SHA256 hashing
backend/src/merkle.js	                    Deterministic Merkle tree construction
backend/src/services/integrity.js	        Witness coordination & verification
witness/witness-server.js	                ED25519 signature generator
frontend-fixed/src/	                        React dashboard for users & admins

🔐 Security Design Highlights:
    1. Deterministic Canonicalization: Ensures the same data always yields the same hash.
    2. Sorted Pair Hashing in Merkle Tree: Neutralizes input order dependency.
    3. Quorum-based Witness Anchoring: No single authority controls trust.
    4. Distributed Verification: Each witness runs independently, increasing system resilience.
    5. Tamper Evident: Any single-byte modification changes the Merkle root and invalidates signatures.


🧾 Troubleshooting
Issue	                        Solution
MongoDB connection fails	    Check MONGO_URI or Mongo service running
Witness not responding	        Verify port (6001/6002) and ED25519_SEED_HEX length
Anchoring stuck	                Reduce ANCHOR_QUORUM temporarily or check witness connectivity
Invalid signature error	        Ensure all witnesses use different valid seeds

🧑‍💻 Evaluation Guide for Judges:
1. Start MongoDB and backend.
2. Launch two witness servers.
3. Verify /health endpoint on backend is OK.
4. Import sample dataset.
5. Trigger anchor generation (via admin route).
6. Confirm witness signatures are recorded in Anchor collection.
7. Open the React dashboard and view “Trusted” marks for anchored days.
8. Inspect Merkle & crypto logic in:
        a.  crypto-utils.js
        b.  merkle.js
        c.  integrity.js


🏆 Key Takeaways
    1. Establishes trust without blockchain (ultra-light cryptographic alternative).
    2. Can integrate with PM-Kisan, Fasal Bima Yojana, KCC loan verifiers, or eNAM buyers for transparent provenance.
    3. Provides verifiable, low-cost, scalable integrity layer for agriculture data systems.

👥 Credits
    1. Developed as part of KSSEM HIO25 Project
    2. Team: AgriTrust Development Group
    3. Focus: Decentralized agricultural data integrity

📜 License
    This repository is open-sourced under the MIT License.
