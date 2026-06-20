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


