# Project Aura: Hardware Bottleneck Analyzer
## HNDIT Final Project Documentation
**By Shamal Sathsara**

---

## 1. What is Project Aura?

Project Aura is an intelligent web application designed to analyze PC gaming hardware. When a user inputs their CPU, GPU, and preferred gaming settings (like resolution and graphics quality), the system does the following:

1. Grabs the hardware specifications from a cloud database.
2. Feeds this data into a trained Artificial Intelligence model.
3. Predicts the expected gaming performance in FPS (Frames Per Second).
4. Checks if there's a hardware bottleneck (for instance, if the CPU is too weak to keep up with a high-end GPU).

This isn't just a basic data entry app. It's a full-stack AI project combining Machine Learning, a Node.js API, cloud database storage, and a dynamic React interface to make real-time predictions.

---

## 2. How the System Fits Together (Architecture)

The project is built in four distinct layers, each handling a specific job:

1. **Frontend (React + Vite):** This is the user interface. It's where users log in, select their hardware, and see their results.
2. **Backend (Node.js + Express):** The middleman. It handles user authentication, fetches lists of CPUs/GPUs from the database, and passes the user's selected hardware to the AI for prediction.
3. **Database (MongoDB Atlas):** Our cloud storage. It holds all the CPU and GPU technical specifications, as well as registered user accounts.
4. **AI Engine (Python + Flask):** The "brain." It hosts our trained machine learning model and calculates the FPS predictions.

### Request Flow: What happens when a user clicks "Analyze"?

1. **Login Check:** The app checks if the user is logged in (via a JWT token). If not, they are shown the login screen.
2. **Data Collection:** Once logged in, the user selects their hardware. The React frontend gathers this data.
3. **Sending Request:** React sends a request to the Node.js backend (`/api/predict`).
4. **Forwarding to AI:** Node.js securely forwards this data to the Python AI server.
5. **Prediction:** Python converts the data into numbers the AI understands, runs it through the Random Forest model, and calculates the FPS.
6. **Returning Results:** The predicted FPS is sent back through Node.js to the React frontend.
7. **Bottleneck Check:** React runs a quick logic check to see if the CPU and GPU are balanced, applies any necessary penalties, and displays the final FPS and bottleneck warning to the user.

---

## 3. The Core: How the AI Works

The most critical part of this project is the AI prediction engine, built using Python.

### Training the Model (`train.py`)
This script creates the AI. It uses a **Random Forest Regressor**.

*   **Loading Data:** It starts by loading a dataset containing thousands of real-world hardware setups and their corresponding FPS results.
*   **Preparing Data:** AI only understands numbers. We use a technique called "One-Hot Encoding" to turn text categories (like a specific CPU name) into numerical values (1s and 0s).
*   **Training:** We use a "Random Forest" containing 100 decision trees. The system splits the data—using 80% to train these trees to recognize patterns, and holding back 20% to test them later.
*   **Saving the Brain:** Once trained, the model is saved as a file (`project_aura.joblib`). This means we don't have to retrain the AI every time the server restarts; we just load the saved "brain."

### Evaluating Accuracy (`evaluate.py`)
We test the model against the 20% of data it hasn't seen to see how accurate it is. We look at metrics like Mean Absolute Error (MAE) to see how far off, on average, the predictions are.

### Serving the AI (`app.py`)
This script uses Flask to create a web server for the AI. It loads the saved `.joblib` model and waits for requests. When Node.js sends hardware data to the `/predict` endpoint, this script runs the prediction and returns the result.

---

## 4. The Bridge: Node.js Backend

The `server.js` file runs our Express server and handles several key tasks:

*   **Database Connection:** Connects securely to MongoDB Atlas.
*   **Serving Hardware Lists:** Pulls the lists of available CPUs and GPUs from the database to populate the dropdown menus on the frontend.
*   **API Gateway:** Takes the prediction requests from the frontend and securely routes them to the Python AI server.
*   **User Authentication:** Manages the sign-up and sign-in process.

---

## 5. Security & Authentication

We've implemented an industry-standard security system to manage user access:

*   **Password Protection:** Passwords are never saved as plain text. We use `bcryptjs` to "hash" passwords before saving them to the database. Even if the database were compromised, the passwords would be unreadable.
*   **Secure Sessions:** When a user logs in, they receive a JWT (JSON Web Token). This token is stored in their browser and proves their identity for subsequent requests, acting as a secure, temporary key card.
*   **Password Recovery:** We implemented a secure, time-limited 3-step password reset workflow. Users can request a mathematically random 6-digit verification code that automatically expires after 15 minutes, allowing them to safely reset forgotten credentials.

---

## 6. The User Interface: React Frontend

The React app (`App.jsx` and `AuthPage.jsx`) provides a smooth, modern experience.

*   **Auth Gate:** The app checks for a valid JWT token. If it doesn't find one, it shows the `AuthPage` (Sign In/Sign Up).
*   **Dynamic State:** We use React `useState` to keep track of what the user is typing, which hardware they select, and the final predictions. When these states change, the screen updates instantly.
*   **Bottleneck Logic:** While the AI predicts raw FPS, the frontend contains specific logic to identify bottlenecks. For example, if it detects a 4-core CPU paired with an extremely powerful GPU, it flags a "CPU Bottleneck" and reduces the final FPS slightly to reflect real-world performance limitations.

---

## 7. New Features Added (Version 2.0)

Five new user-facing features were added to Project Aura. These features are **purely additive** — they do not change any existing bottleneck calculations, AI logic, API routes, or database structures.

---

### Feature 01 — Smart Component Recommendation Panel

**Where it appears:** Inside the results section, after the analysis is complete.

**Condition:** Only shows when the bottleneck severity is **70% or higher**.

**How it works:**
1. A panel titled "Upgrade Recommendation" appears below the existing results card.
2. The user is asked: *"Which component would you like to upgrade?"*
3. Three buttons are shown: **CPU**, **GPU**, and **RAM**.
4. When the user clicks a button, the `generateSmartRecommendation()` function runs. This function reads the current CPU/GPU selections and bottleneck data, then generates:
   - A **recommended replacement component** (found from the existing database lists)
   - An **estimated improvement percentage**
   - A **compatibility reminder**
   - An **upgrade priority** rating (High / Optional)
5. A **bottleneck tip message** is shown explaining why this bottleneck exists (e.g., "This build is bottlenecked because the CPU cannot keep up with the GPU.").

**Key function:** `generateSmartRecommendation(component)` in `App.jsx`

---

### Feature 02 — Technical / Non-Technical Explanation

**Where it appears:** Below the Smart Recommendation Panel in the results section.

**How it works:**
1. A panel titled "Performance Explanation" shows two toggle buttons: **Technical Reason** and **Non-Technical Reason**.
2. When the user clicks a button, the `getExplanation()` function returns the appropriate explanation text.
   - **Technical:** Uses hardware terms (utilization, bottleneck scenario, render commands, etc.)
   - **Non-Technical:** Uses simple, everyday language (e.g., "Your graphics card is working much harder than the rest of your computer...")
3. The explanation text dynamically changes based on both the selected style **and** the type of bottleneck detected (CPU, GPU, or Balanced).

**Key function:** `getExplanation(bottleneckData, style)` in `App.jsx`

---
# Project Aura: Hardware Bottleneck Analyzer
## HNDIT Final Project Documentation
**By Shamal Sathsara**

---

## 1. What is Project Aura?

Project Aura is an intelligent web application designed to analyze PC gaming hardware. When a user inputs their CPU, GPU, and preferred gaming settings (like resolution and graphics quality), the system does the following:

1. Grabs the hardware specifications from a cloud database.
2. Feeds this data into a trained Artificial Intelligence model.
3. Predicts the expected gaming performance in FPS (Frames Per Second).
4. Checks if there's a hardware bottleneck (for instance, if the CPU is too weak to keep up with a high-end GPU).

This isn't just a basic data entry app. It's a full-stack AI project combining Machine Learning, a Node.js API, cloud database storage, and a dynamic React interface to make real-time predictions.

---

## 2. How the System Fits Together (Architecture)

The project is built in four distinct layers, each handling a specific job:

1. **Frontend (React + Vite):** This is the user interface. It's where users log in, select their hardware, and see their results.
2. **Backend (Node.js + Express):** The middleman. It handles user authentication, fetches lists of CPUs/GPUs from the database, and passes the user's selected hardware to the AI for prediction.
3. **Database (MongoDB Atlas):** Our cloud storage. It holds all the CPU and GPU technical specifications, as well as registered user accounts.
4. **AI Engine (Python + Flask):** The "brain." It hosts our trained machine learning model and calculates the FPS predictions.

### Request Flow: What happens when a user clicks "Analyze"?

1. **Login Check:** The app checks if the user is logged in (via a JWT token). If not, they are shown the login screen.
2. **Data Collection:** Once logged in, the user selects their hardware. The React frontend gathers this data.
3. **Sending Request:** React sends a request to the Node.js backend (`/api/predict`).
4. **Forwarding to AI:** Node.js securely forwards this data to the Python AI server.
5. **Prediction:** Python converts the data into numbers the AI understands, runs it through the Random Forest model, and calculates the FPS.
6. **Returning Results:** The predicted FPS is sent back through Node.js to the React frontend.
7. **Bottleneck Check:** React runs a quick logic check to see if the CPU and GPU are balanced, applies any necessary penalties, and displays the final FPS and bottleneck warning to the user.

---

## 3. The Core: How the AI Works

The most critical part of this project is the AI prediction engine, built using Python.

### Training the Model (`train.py`)
This script creates the AI. It uses a **Random Forest Regressor**.

*   **Loading Data:** It starts by loading a dataset containing thousands of real-world hardware setups and their corresponding FPS results.
*   **Preparing Data:** AI only understands numbers. We use a technique called "One-Hot Encoding" to turn text categories (like a specific CPU name) into numerical values (1s and 0s).
*   **Training:** We use a "Random Forest" containing 100 decision trees. The system splits the data—using 80% to train these trees to recognize patterns, and holding back 20% to test them later.
*   **Saving the Brain:** Once trained, the model is saved as a file (`project_aura.joblib`). This means we don't have to retrain the AI every time the server restarts; we just load the saved "brain."

### Evaluating Accuracy (`evaluate.py`)
We test the model against the 20% of data it hasn't seen to see how accurate it is. We look at metrics like Mean Absolute Error (MAE) to see how far off, on average, the predictions are.

### Serving the AI (`app.py`)
This script uses Flask to create a web server for the AI. It loads the saved `.joblib` model and waits for requests. When Node.js sends hardware data to the `/predict` endpoint, this script runs the prediction and returns the result.

---

## 4. The Bridge: Node.js Backend

The `server.js` file runs our Express server and handles several key tasks:

*   **Database Connection:** Connects securely to MongoDB Atlas.
*   **Serving Hardware Lists:** Pulls the lists of available CPUs and GPUs from the database to populate the dropdown menus on the frontend.
*   **API Gateway:** Takes the prediction requests from the frontend and securely routes them to the Python AI server.
*   **User Authentication:** Manages the sign-up and sign-in process.

---

## 5. Security & Authentication

We've implemented an industry-standard security system to manage user access:

*   **Password Protection:** Passwords are never saved as plain text. We use `bcryptjs` to "hash" passwords before saving them to the database. Even if the database were compromised, the passwords would be unreadable.
*   **Secure Sessions:** When a user logs in, they receive a JWT (JSON Web Token). This token is stored in their browser and proves their identity for subsequent requests, acting as a secure, temporary key card.
*   **Password Recovery:** We implemented a secure, time-limited 3-step password reset workflow. Users can request a mathematically random 6-digit verification code that automatically expires after 15 minutes, allowing them to safely reset forgotten credentials.

---

## 6. The User Interface: React Frontend

The React app (`App.jsx` and `AuthPage.jsx`) provides a smooth, modern experience.

*   **Auth Gate:** The app checks for a valid JWT token. If it doesn't find one, it shows the `AuthPage` (Sign In/Sign Up).
*   **Dynamic State:** We use React `useState` to keep track of what the user is typing, which hardware they select, and the final predictions. When these states change, the screen updates instantly.
*   **Bottleneck Logic:** While the AI predicts raw FPS, the frontend contains specific logic to identify bottlenecks. For example, if it detects a 4-core CPU paired with an extremely powerful GPU, it flags a "CPU Bottleneck" and reduces the final FPS slightly to reflect real-world performance limitations.

---

## 7. New Features Added (Version 2.0)

Five new user-facing features were added to Project Aura. These features are **purely additive** — they do not change any existing bottleneck calculations, AI logic, API routes, or database structures.

---

### Feature 01 — Smart Component Recommendation Panel

**Where it appears:** Inside the results section, after the analysis is complete.

**Condition:** Only shows when the bottleneck severity is **70% or higher**.

**How it works:**
1. A panel titled "Upgrade Recommendation" appears below the existing results card.
2. The user is asked: *"Which component would you like to upgrade?"*
3. Three buttons are shown: **CPU**, **GPU**, and **RAM**.
4. When the user clicks a button, the `generateSmartRecommendation()` function runs. This function reads the current CPU/GPU selections and bottleneck data, then generates:
   - A **recommended replacement component** (found from the existing database lists)
   - An **estimated improvement percentage**
   - A **compatibility reminder**
   - An **upgrade priority** rating (High / Optional)
5. A **bottleneck tip message** is shown explaining why this bottleneck exists (e.g., "This build is bottlenecked because the CPU cannot keep up with the GPU.").

**Key function:** `generateSmartRecommendation(component)` in `App.jsx`

---

### Feature 02 — Technical / Non-Technical Explanation

**Where it appears:** Below the Smart Recommendation Panel in the results section.

**How it works:**
1. A panel titled "Performance Explanation" shows two toggle buttons: **Technical Reason** and **Non-Technical Reason**.
2. When the user clicks a button, the `getExplanation()` function returns the appropriate explanation text.
   - **Technical:** Uses hardware terms (utilization, bottleneck scenario, render commands, etc.)
   - **Non-Technical:** Uses simple, everyday language (e.g., "Your graphics card is working much harder than the rest of your computer...")
3. The explanation text dynamically changes based on both the selected style **and** the type of bottleneck detected (CPU, GPU, or Balanced).

**Key function:** `getExplanation(bottleneckData, style)` in `App.jsx`

---

### Feature 03 — Professional Side Panel Layout

**What it does:** Wraps the existing application in a modern three-column dashboard layout.

**Layout:**
- **Left Sidebar:** Contains quick-action buttons — *Need Help?*. This button is a shortcut that triggers Features 04 and 05 without the user having to scroll to the results section. The stores and Q&A appear directly beneath it when clicked.
- **Center Column:** The existing application (hero section, analyzer card, about section) — **completely unchanged**.
- **Right Sidebar:** Displays context-aware panels — Analysis Summary, Bottleneck Tips, and Upgrade Suggestions.

**Responsiveness:**
- **Large desktop (>1280px):** Full 3-column layout.
- **Medium desktop (1025–1280px):** Narrower sidebars.
- **Tablet (769–1024px):** Sidebars are hidden; center content is full width.
- **Mobile (≤768px):** Sidebars are hidden; existing mobile layout is fully preserved.

---

### Feature 04 — Need Help? Button with Sri Lankan PC Stores

**Where it appears:** In the left sidebar.

**How it works:**
1. The user clicks the **"Need Help?"** button in the left sidebar.
2. The left sidebar expands downwards to reveal cards for five trusted Sri Lankan PC hardware stores:
   - **Nanotek** — [nanotek.lk](https://www.nanotek.lk)
   - **Redline Technologies** — [redline.lk](https://www.redline.lk)
   - **Barclays Computer** — [barclayscomputer.lk](https://www.barclayscomputer.lk)
   - **Gamestreet** — [gamestreet.lk](https://www.gamestreet.lk)
   - **Tecroot** — [tecroot.lk](https://www.tecroot.lk)
3. Each card shows the store name, a short description, and a "Visit Website" link.
4. Clicking the button again toggles the panel off (hide/show).

**Data source:** Static `SRI_LK_STORES` array at the top of `App.jsx`.

---

### Feature 05 — Auto-Generated Q&A

**Where it appears:** In the left sidebar, below the store cards (visible when "Need Help?" is active).

**How it works:**
1. Three helpful Q&A items are generated automatically using the `generateQA()` function.
2. The content of the questions and answers **changes dynamically** based on the current bottleneck result:
   - **CPU Bottleneck:** Q&A focuses on why the CPU is limiting performance and what to upgrade first.
   - **GPU Bottleneck:** Q&A focuses on the GPU being the main limiting factor.
   - **Balanced Build:** Q&A explains why the build is performing well and optional upgrade paths.
   - **No analysis yet:** Q&A shows general helpful information about bottlenecks and how to use the tool.
3. Each Q&A item is an **accordion** — the user clicks the question to expand the answer. Clicking again collapses it. Only one item can be open at a time.

**Key function:** `generateQA(bottleneckData)` in `App.jsx`

---

### Summary Table

| Feature | Trigger | Location | Shows When |
|---|---|---|---|
| Smart Recommendation Panel | Click CPU/GPU/RAM button | Center (inside results) | Severity ≥ 70% |
| Technical/Non-Technical Toggle | Click toggle buttons | Center (inside results) | Any result is shown |
| Three-Column Layout | Always visible | Whole page layout | Always |
| Need Help? Stores | Click "Need Help?" | Left sidebar | After clicking button |
| Auto Q&A | Click "Need Help?" | Left sidebar | After clicking button |
| Live Sri Lankan Pricing & PDF | View Live Pricing button | Center (New view page) | After analysis results are loaded |

---

### Feature 06 — Live Sri Lankan Pricing & A4 PDF Quotation System

**Where it appears:** 
* A new button **"View Live Pricing Quotation"** is visible on the performance results card after running an analysis.
* Clicking this button navigates the user to a clean, dedicated sub-page inside the app.

**How it works:**
1. **Dynamic Hardware Extraction**: The React frontend passes the user's selected CPU model, GPU model, and system memory (RAM) capacity to the Node.js backend.
2. **AI Price Query**: The backend hits the `/api/pricing/estimate` endpoint, invoking the Google Gemini AI model (`gemini-2.5-flash`). The AI acts as a pricing expert and processes the prompt to return estimated average market prices in Sri Lankan Rupees (LKR) formatted as a raw JSON string.
3. **No-Crash Price Rendering**: The frontend parses this JSON, utilizing fallback protection (e.g. `prices.cpuPriceLkr || 0`) to prevent any application crashes in case of network lags or incomplete AI responses.
4. **Interactive Disclaimer**: The UI displays a prominent warning informing the user that these are AI-estimated average market prices that may vary between actual physical stores.
5. **Printer-Friendly A4 PDF Generator**: When the user clicks **"Download A4 PDF"**, the client-side libraries `jsPDF` and `jsPDF-AutoTable` draw a clean, black-and-white grid table matching standard A4 dimensions. 
6. **Smart Spacing Logic**: Instead of hardcoding text coordinates (which causes overlapping text when rows change height), the script fetches `doc.lastAutoTable.finalY` (the exact coordinate where the table finished rendering) and uses it as a relative anchor to draw the total price and disclaimer fields neatly below the table.

