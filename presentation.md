# Project Aura: Smart Hardware Bottleneck Analyzer
**Final Project Presentation**
**Presenter:** Shamal Sathsara

---

## 1. Introduction
Welcome to the presentation of **Project Aura**. 
Project Aura is an intelligent, full-stack web application designed to analyze PC gaming hardware. It allows users to input their CPU, GPU, RAM, and preferred gaming settings to receive highly accurate performance predictions and hardware bottleneck analysis.

---

## 2. The Problem Statement
When building or upgrading a PC, gamers and professionals often face a critical challenge: **Hardware Bottlenecking**. 
If a high-end Graphics Card (GPU) is paired with an underpowered Processor (CPU), the CPU limits the GPU's potential. This results in wasted money and poor performance. Existing tools are often static, outdated, or lack personalized intelligence.

---

## 3. The Solution: Project Aura
Project Aura solves this by combining a custom-trained **Machine Learning Engine** with a strict **Hardware Heuristics Engine**. 
Instead of relying on static spreadsheets, Project Aura dynamically calculates performance (FPS) and identifies exact bottleneck severities, offering smart upgrade recommendations and local market pricing.

---

## 4. System Architecture
The platform is built on a modern, four-layer architecture ensuring scalability and security:

1. **Frontend (React + Vite):** A highly responsive, dynamic user interface with glassmorphism design.
2. **Backend (Node.js + Express):** The secure API gateway that manages data flow and user authentication.
3. **Database (MongoDB Atlas):** A NoSQL cloud database storing thousands of hardware components and user profiles.
4. **AI Engine (Python + Flask):** The machine learning microservice hosting the predictive model.

---

## 5. The AI Prediction Engine (Machine Learning)
The core of Project Aura's intelligence is a custom-trained Machine Learning model.

* **Algorithm:** Random Forest Regressor (100 Decision Trees).
* **Training Data:** Trained on a vast dataset of real-world hardware combinations and their corresponding Frames Per Second (FPS) results.
* **Data Preprocessing:** Utilizes "One-Hot Encoding" to convert categorical hardware data into numerical vectors.
* **Execution:** The trained model is serialized using `joblib` (`project_aura.joblib`). When the Node.js server sends a request to the Python Flask API (`/api/predict`), the model evaluates the input and returns a Raw Predicted FPS.

---

## 6. The Hardware Bottleneck Engine
While the AI predicts raw performance, the React frontend runs a strict **Hardware Rules Engine** to identify the bottleneck severity.

1. **Hardware Tiering:** CPUs are tiered (1-10) based on their PassMark scores. GPUs are tiered (1-10) based on their CUDA core counts.
2. **Severity Calculation:** The engine calculates the absolute difference between the CPU tier and GPU tier. A difference of 0 indicates a perfectly balanced build. A larger gap indicates a severe bottleneck (up to 80% severity).
3. **Reality Check Penalty:** If a severe bottleneck is detected, the engine applies a mathematical penalty to the AI's predicted FPS. This ensures the final output reflects the real-world performance limitations of bottlenecked systems.

---

## 7. Advanced Features
Project Aura goes beyond simple analysis by offering professional-grade tools:

### A. Side-by-Side Rig Comparison
* Allows users to place two custom PC builds head-to-head.
* Performs parallel asynchronous API calls to analyze both rigs simultaneously.
* Generates a detailed comparative verdict, identifying the winning rig, the FPS difference percentage, and efficiency advantages based on bottleneck severities.

### B. Live Pricing Estimation & PDF Quotation
* **External API Integration:** Connects to the **Google Gemini 2.5 Flash AI API**.
* **Dynamic Pricing:** Queries Gemini dynamically to estimate the current retail price of the selected CPU, GPU, and RAM in Sri Lankan Rupees (LKR).
* **PDF Engine:** Utilizes `jsPDF` and `jsPDF-AutoTable` to compile the components and pricing into a professional, print-ready A4 PDF invoice.

### C. Smart Component Recommendations
* If a bottleneck exceeds a 70% threshold, the system triggers a recommendation algorithm.
* It analyzes the weaker component and automatically queries the database for a perfectly matched upgrade, providing the user with an estimated performance improvement percentage.

---

## 8. Security & Authentication
Security is a foundational element of Project Aura:

* **Password Cryptography:** User passwords are encrypted using `bcryptjs` before database storage.
* **Session Management:** Utilizes JSON Web Tokens (JWT) for secure, stateless user sessions.
* **Account Recovery:** Features a secure, time-sensitive 3-step password reset workflow utilizing auto-expiring 6-digit verification codes.

---

## 9. Technologies & APIs Used
A summary of the modern technology stack utilized in this project:

* **Frontend:** React, Vite, Vanilla CSS, jsPDF
* **Backend:** Node.js, Express.js, MongoDB (Mongoose)
* **AI & Data Science:** Python, Flask, Scikit-Learn (Random Forest), Pandas, Joblib
* **External APIs:** Google Gemini 2.5 Flash API (for local pricing estimation)
* **Security:** bcryptjs, jsonwebtoken (JWT)

---

## 10. Conclusion
Project Aura successfully bridges the gap between complex hardware compatibility and user-friendly software design. By leveraging Machine Learning for predictive analytics and strict heuristics for bottleneck detection, it provides an invaluable tool for PC builders, gamers, and hardware enthusiasts.

**Thank you for your time.**
