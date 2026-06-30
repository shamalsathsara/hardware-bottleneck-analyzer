# Smart PC Hardware Bottleneck Analyzer

> [!IMPORTANT]
> ###  SETUP REQUIREMENT FOR MULTIPLE PCS (GITHUBS PULLS)
> The `.env` file containing secret configuration keys (like database passwords and AI keys) is **ignored by Git** for security reasons. When pulling this repository to a new PC or a friend's laptop, you **MUST manually create** a file named `.env` inside the `backend-node/` directory.
> 
> Create the file `backend-node/.env` and paste the following template, filling in the keys:
> ```env
> # AURA environment variables
> PORT=4000
> MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/?appName=aura
> JWT_SECRET=your_jwt_secret_key_here
> EMAIL_USER=your_email@gmail.com
> EMAIL_PASS=your_email_app_password_here
> GEMINI_API_KEY=your_gemini_api_key_here
> ```

---

## 🚀 New Feature (v2.1) — Live Sri Lankan Pricing & A4 PDF Quotation
Project Aura now features a dynamic pricing estimator and PDF quotation engine.
* **Gemini AI Integration**: Connects to Google Gemini 2.5 Flash dynamically to estimate local Sri Lankan Rupees (LKR) retail pricing for the selected CPU, GPU, and RAM.
* **A4 PDF Export**: Compiles components and prices into a standard, clean, print-ready A4 PDF invoice without heavy colors using `jsPDF` and `jsPDF-AutoTable`.
* **Dynamic Layout Spacing**: Automatically calculates document space constraints using dynamic table positioning to avoid any overlapping text in the PDF.

---

ai-python = python app.py
backend-node = node server.js
frontend-react =npm run dev


# DAY 01...

What We Accomplished Today
1. Project Foundation & Version Control (Phase 1)

Created your master microservice architecture folders (frontend-react, backend-node, ai-python).

Successfully initialized Git and linked your local Ubuntu machine to your remote GitHub repository.

2. Data Acquisition (Phase 1)

Hunted down the perfect industry-level datasets from Kaggle.

Secured CPU/GPU component lists for your future database.

Secured the golden fps_data.csv to train your AI.

3. The Birth of "Project Aura" (Phase 3)

Set up a secure Python virtual environment (venv).

Built and trained a Machine Learning model (Random Forest Regressor) using scikit-learn.

Result: Aura achieved a highly accurate 3.64 FPS average error margin.

Saved Aura's brain to your hard drive as project_aura.joblib.

Wrapped Aura in a Flask web server and brought her online to listen for internet requests on port 5000.

4. Backend Preparation (Phase 4)

Initialized your Node.js environment in the backend-node folder.

Installed your heavy-lifting server packages: express, mongoose, cors, axios, and dotenv.


# Mongodb

mongodb+srv://tai303860_db_user:<db_password>@cluster0.zbaoi7m.mongodb.net/?appName=Cluster0

# DAY 02...

5. Connected to MongoDB Atlas.

create seed file.
run first testing.
update server folder.
completed backend development.