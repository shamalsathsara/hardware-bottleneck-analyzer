# Project Aura — Hardware Bottleneck Analyzer
### HNDIT Final Project — Full Explanation Guide
*By Shamal Sathsara*

---

##  What Is This Project?

**Project Aura** is an AI-powered web application that analyzes PC gaming hardware performance. A user selects their **CPU**, **GPU**, game **resolution**, and **graphics quality**, then the system:

1. Looks up the hardware specs from a cloud database
2. Sends the data to a trained AI model
3. Predicts the **FPS (Frames Per Second)** the system will produce
4. Identifies any **hardware bottleneck** (e.g., CPU is too weak for the GPU)

> [!IMPORTANT]
> This is a **full-stack AI project** — it combines Machine Learning (Python), a REST API backend (Node.js), a cloud database (MongoDB Atlas), and a modern web frontend (React). This is not a simple CRUD app — it uses real AI inference to make predictions.

---

##  System Architecture

The project has **4 separate layers**, each with a distinct responsibility:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
│               React Frontend  (Port 5173 / Vite)                   │
│          User selects CPU, GPU, settings → clicks Analyze           │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTP Request (axios)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Node.js Backend Server                          │
│                       Express.js  (Port 4000)                       │
│  • Serves CPU/GPU list from MongoDB                                 │
│  • Acts as a bridge — forwards hardware data to Python AI           │
└────────────┬──────────────────────────────────┬────────────────────┘
             │  MongoDB Query                   │  HTTP POST to Python
             ▼                                  ▼
┌────────────────────────┐       ┌──────────────────────────────────┐
│   MongoDB Atlas        │       │   Python Flask AI Server         │
│   (Cloud Database)     │       │         (Port 5000)              │
│                        │       │                                  │
│  • CPU collection      │       │  • Loads project_aura.joblib     │
│  • GPU collection      │       │  • Runs Random Forest prediction │
│                        │       │  • Returns predicted FPS         │
└────────────────────────┘       └──────────────────────────────────┘
```

### The 4 Layers Explained Simply

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | React + Vite | The website the user sees and interacts with |
| **Backend** | Node.js + Express | The middle server that connects everything together |
| **Database** | MongoDB Atlas | Cloud storage for CPU and GPU specifications |
| **AI Engine** | Python + Flask | The trained AI brain that predicts FPS |

---

## The AI Part — How It Works (Step by Step)

This is the most important and impressive part of the project. There are **3 Python scripts** that work together.

### Step 1 — Explore the Data (`explore.py`)

```python
import pandas as pd

data = pd.read_csv('FpsTest/fps_dataset.csv')   # Load the CSV file
print(data.columns.tolist())                     # See all column names
print(data.head())                               # Preview first 5 rows
```

**What this does:** Before training any AI, the developer first needs to **understand the data**. This script loads the FPS dataset (a CSV spreadsheet) and prints what columns and rows it contains. Think of this like reading the instructions before starting a task.

---

### Step 2 — Train the AI (`train.py`) — The Most Important File

This is where the **AI brain is created**. Let's go line by line:

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib
```
**Imports:** These are Python libraries. `sklearn` (scikit-learn) is the AI/ML library. `pandas` handles data tables. `joblib` saves the trained model to disk.

---

```python
data = pd.read_csv('FpsTest/fps_dataset.csv')
```
**Load Dataset:** The CSV file contains thousands of real-world hardware + FPS combinations. Each row represents one gaming scenario (e.g., RTX 3080 + i7-12700K + 1080p High = 142 FPS).

---

```python
X = data.drop(columns=['Min FPS','Avg FPS','Max FPS','Bottleneck Score','Total System TDP (W)'])
y = data['Avg FPS']
```
**Select Features (Inputs and Output):**
- `X` = **Input features** — everything the AI uses to make a decision (CPU model, GPU model, RAM, resolution, settings, etc.)
- `y` = **Target/Output** — what we want the AI to predict: the `Avg FPS`

> Think of `X` as the exam questions and `y` as the correct answers. The AI is trained to learn the relationship between them.

---

```python
X = pd.get_dummies(X)
```
**Encoding Text to Numbers:** AI models only understand numbers, not text. This line converts text columns (like `CPU = "Intel Core i9-13900K"`) into **binary (0/1) columns**. For example:
```
CPU_Intel Core i9-13900K  →  1  (if selected)  or  0  (if not)
CPU_AMD Ryzen 9 7950X     →  0  (if not selected)
```
This is called **One-Hot Encoding**.

---

```python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```
**Split the Data:**
- **80% of the data** → used to **train** the AI (it learns from these examples)
- **20% of the data** → kept aside to **test** accuracy on data it has never seen

> `random_state=42` just means "shuffle the data the same way every time we run this" so results are reproducible.

---

```python
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
```
**Train the Random Forest AI:**

This is the core. A **Random Forest** is an ensemble of **100 decision trees** that work together.

**How one Decision Tree works:**
```
Is Resolution = 4K?
    YES → Is GPU CUDA cores > 10,000?
                YES → Predict 85 FPS
                NO  → Predict 45 FPS
    NO  → Is RAM >= 16 GB?
                YES → Predict 120 FPS
                NO  → Predict 95 FPS
```

**Why Random Forest (100 trees)?**
- Each tree is built on a **random subset** of the training data
- Each tree makes its own FPS prediction
- The **final answer = average of all 100 trees' predictions**
- This is much more accurate and reliable than a single tree
- More trees = better accuracy (but slower training)

`.fit(X_train, y_train)` = **"Learn from the 80% training data"**

---

```python
predictions = model.predict(X_test)
error = mean_absolute_error(y_test, predictions)
```
**Test the AI:** Run the model on the 20% test data it has never seen. Calculate the **Mean Absolute Error (MAE)** — on average, how many FPS off is the prediction from the real value?

---

```python
joblib.dump(model, 'project_aura.joblib')
joblib.dump(list(X.columns), 'ai_columns.joblib')
```
**Save the Brain:** The trained model is saved to a file called `project_aura.joblib` (6.3 MB). Think of this like saving a game — the AI doesn't need to re-learn from scratch every time. `ai_columns.joblib` saves the exact list of input features the model expects.

---

### Step 3 — Evaluate Accuracy (`evaluate.py`)

This script provides a **comprehensive accuracy report** by testing the model from multiple angles:

| Metric | What it Means |
|--------|--------------|
| **MAE** (Mean Absolute Error) | On average, how many FPS off is the prediction? Lower = better |
| **RMSE** | Similar to MAE but punishes large errors more. Lower = better |
| **R² Score** | How well the model explains the data. 1.0 = perfect. 0.99+ = exceptional |
| **MAPE** | Error expressed as a % of the actual value. Lower = better |
| **Cross-Validation** | Tests on 5 different data splits to check if accuracy is consistent |

**FPS Tolerance Check:**
```
Within ±5 FPS  → "Good" predictions
Within ±10 FPS → "Acceptable" predictions
Within ±15 FPS → "Fair" predictions
```

**Feature Importance:** The model also reveals **which hardware specs matter most** for FPS (e.g., GPU CUDA cores might be #1, then RAM, then resolution).

**Final Grade System:**
```
R² ≥ 0.99  →  S Grade — Exceptional
R² ≥ 0.97  →  A+ Grade — Excellent
R² ≥ 0.95  →  A  Grade — Very Good
R² ≥ 0.90  →  B  Grade — Good
```

---

### Step 4 — The AI API (`app.py`)

Once the model is trained and saved, this script **serves it as a web API** using Flask:

```python
from flask import Flask, request, jsonify
import joblib, pandas as pd

app = Flask(__name__)

model        = joblib.load('project_aura.joblib')   # Load the trained brain
model_columns = joblib.load('ai_columns.joblib')    # Load expected input columns
```
**Load the saved model** when the server starts — no retraining needed.

---

```python
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json                              # Receive hardware data (JSON)
    df   = pd.DataFrame([data])                     # Convert to table format
    df   = pd.get_dummies(df)                       # Encode text → numbers
    df   = df.reindex(columns=model_columns, fill_value=0)  # Match expected columns
    prediction = model.predict(df)                  # Ask AI for prediction
    return jsonify({'predicted_fps': round(prediction[0], 2)})  # Return answer
```

**The `/predict` endpoint:**
1. Receives hardware config as JSON from Node.js backend
2. Converts it into the same format the model was trained on
3. Runs the Random Forest prediction
4. Returns the predicted FPS as JSON

> [!NOTE]
> `df.reindex(columns=model_columns, fill_value=0)` is crucial — it ensures that even if a column is missing (e.g., a new GPU the model hasn't seen), it's filled with `0` instead of causing an error.

---

## 🖧 The Backend — Node.js (`server.js`)

The Node.js server has **3 jobs**:

### Job 1: Serve CPU & GPU Lists to Frontend
```javascript
app.get('/api/cpus', async (req, res) => {
    const cpus = await CPU.find().sort({ CPU: 1 }); // Get all CPUs from MongoDB, sorted A-Z
    res.json(cpus);
});
```
When the React page loads, it fetches the list of all available CPUs and GPUs from MongoDB and populates the dropdown/autocomplete search boxes.

### Job 2: Bridge Frontend → AI
```javascript
app.post('/api/predict', async (req, res) => {
    const auraResponse = await axios.post('http://127.0.0.1:5000/predict', req.body);
    res.json(auraResponse.data);
});
```
The frontend sends hardware data to Node.js → Node.js forwards it to the Python AI server → gets the FPS prediction back → sends it to the frontend. Node.js acts as a **secure middleman/bridge**.

### Job 3: Connect to MongoDB Atlas
```javascript
mongoose.connect(process.env.MONGO_URI)  // Connect using a secret URL from .env file
```
Connects to the cloud database securely. The actual connection string is stored in a `.env` file (not shared publicly for security).

---

##  Database Setup (`seed.js`)

Before the app can show CPUs and GPUs, the database needs to be populated. `seed.js` is a **one-time setup script**:

```javascript
const cpuData1 = await csv().fromFile('./CPU/cpu_data1.csv');  // Read CPU spreadsheet 1
const cpuData2 = await csv().fromFile('./CPU/cpu_data2.csv');  // Read CPU spreadsheet 2
const allCpuData = [...cpuData1, ...cpuData2];                 // Merge both lists

await CPU.insertMany(allCpuData);  // Upload ALL CPUs to MongoDB Atlas cloud
```

This reads 4 CSV files (2 for CPUs, 2 for GPUs), merges them, and uploads them to the cloud. It's run only once.

---

## 🌐 The Frontend — React (`App.jsx`)

The React app is what the user sees and interacts with. Key parts:

### State Management (Memory)
```javascript
const [cpuList, setCpuList]       = useState([]);    // All CPUs from database
const [selectedCpu, setSelectedCpu] = useState('');  // What user typed/selected
const [prediction, setPrediction] = useState(null);  // AI's FPS answer
const [isThinking, setIsThinking] = useState(false); // Show loading spinner
```
`useState` is React's way of storing data that can change — when it changes, the UI automatically updates.

### Loading Data on Page Start
```javascript
useEffect(() => {
    // This runs once when the page first loads
    axios.get('http://localhost:4000/api/cpus')  // Ask Node.js for CPU list
    axios.get('http://localhost:4000/api/gpus')  // Ask Node.js for GPU list
}, []);
```

### When User Clicks "Consult Project Aura"
```javascript
const handleConsultAura = async () => {
    // 1. Find the full specs of selected CPU & GPU
    const fullCpu = cpuList.find(c => c.cpuName === selectedCpu);
    const fullGpu = gpuList.find(g => g.Device  === selectedGpu);

    // 2. Build a payload (package of hardware data)
    const payload = {
        'CPU': fullCpu.cpuName, 'CPU Cores': cores, 'RAM (GB)': parseInt(ram),
        'GPU': fullGpu.Device,  'Resolution': resolution, ...
    };

    // 3. Send to Node.js backend → which forwards to AI
    const { data } = await axios.post('http://localhost:4000/api/predict', payload);

    // 4. Apply bottleneck analysis on top of AI result
    const analysis = analyzeBottleneck(fullCpu, fullGpu);
    let finalFps = data.predicted_fps - (finalFps * bottleneck_penalty);

    // 5. Display result to user
    setPrediction(finalFps.toFixed(1));
};
```

### Bottleneck Analysis Logic
```javascript
const analyzeBottleneck = (cpu, gpu) => {
    if (cores <= 4 && gpuPower > 80000) {
        // CPU is weak, GPU is strong → CPU Bottleneck (85% severity, red)
    } else if (cores >= 8 && gpuPower < 30000) {
        // CPU is strong, GPU is weak → GPU Bottleneck (70% severity, yellow)
    } else {
        // Balanced build → Low severity (5-20%, green)
    }
};
```
This compares the CPU's core count against the GPU's CUDA compute score to determine which component is the limiting factor.

---

##  Complete Request Flow — End to End

Here is what happens from the moment the user clicks **"Consult Project Aura"**:

```
1. USER clicks button in React (browser)
        ↓
2. React collects: CPU name, GPU name, RAM, Resolution, Settings
        ↓
3. React sends POST request to → http://localhost:4000/api/predict
        ↓
4. Node.js receives the request
        ↓
5. Node.js forwards it to → http://127.0.0.1:5000/predict (Python)
        ↓
6. Flask (Python) receives the hardware JSON
        ↓
7. Python converts text → numbers (get_dummies + reindex)
        ↓
8. Random Forest AI runs prediction across 100 trees
        ↓
9. Returns: { predicted_fps: 87.43 }
        ↓
10. Node.js receives this and sends it back to React
        ↓
11. React applies bottleneck penalty to final FPS
        ↓
12. React displays: "87.4 FPS" + Bottleneck bar + Message
```

---

##  What the AI Actually Learned

The Random Forest model learned from a dataset of real-world CPU + GPU + settings → FPS combinations. It discovered patterns like:

- Higher GPU CUDA cores = higher FPS
- 4K resolution = significantly lower FPS than 1080p
- Ultra settings = lower FPS than Low settings
- A weak CPU paired with a powerful GPU creates a bottleneck

These patterns are encoded inside the 100 decision trees saved in `project_aura.joblib`.

---

##  File Summary

| File | Location | Purpose |
|------|----------|---------|
| `explore.py` | `ai-python/` | One-time script to inspect the dataset |
| `train.py` | `ai-python/` | Train the Random Forest AI and save it |
| `evaluate.py` | `ai-python/` | Comprehensive accuracy report for the trained model |
| `app.py` | `ai-python/` | Flask web server that serves the AI as an API |
| `project_aura.joblib` | `ai-python/` | The saved trained AI model (6.3 MB brain) |
| `ai_columns.joblib` | `ai-python/` | Saved list of expected input features |
| `server.js` | `backend-node/` | Node.js Express API server (bridge layer) |
| `seed.js` | `backend-node/` | One-time script to populate MongoDB with CPU/GPU data |
| `App.jsx` | `frontend-react/src/` | Main React frontend — UI, state, API calls, display |

---

##  Technologies Used & Why

| Technology | Why Used |
|-----------|---------|
| **Python + scikit-learn** | Industry-standard ML library. RandomForestRegressor is ideal for tabular data prediction |
| **joblib** | Efficient way to save/load large ML models |
| **Flask** | Lightweight Python web framework — perfect for serving a single AI endpoint |
| **Node.js + Express** | Fast, non-blocking server. Acts as a secure API gateway between React and Python |
| **MongoDB Atlas** | Cloud-hosted NoSQL database — flexible schema perfect for CPU/GPU specs with different fields |
| **Mongoose** | ODM library that makes MongoDB queries easier in Node.js |
| **React + Vite** | Modern frontend framework. Fast development, component-based UI, reactive state |
| **axios** | Makes HTTP requests simple in both React (frontend) and Node.js (backend) |
| **cors** | Allows the React app (port 5173) to talk to the Node.js server (port 4000) |
| **dotenv** | Keeps sensitive info (MongoDB password) in a `.env` file, not in code |

---

##  Key Points for Your Supervisor

> [!NOTE]
> **Key points to highlight in your presentation:**

1. **Real AI, not fake logic** — The FPS prediction comes from a trained Random Forest model, not from `if/else` rules.

2. **3-tier architecture** — Frontend ↔ Backend ↔ AI Server is an industry-standard microservices pattern.

3. **Cloud database** — MongoDB Atlas stores hardware specs, not local files, making it scalable.

4. **Model saved, not retrained** — The AI is trained once (`train.py`), saved, and then loaded instantly for every prediction (`app.py`). This is exactly how production AI systems work.

5. **One-hot encoding** — Demonstrates understanding of a fundamental ML preprocessing technique for categorical data.

6. **80/20 train-test split + cross-validation** — Shows proper ML methodology. The model is evaluated on data it has never seen.

7. **Feature importance** — The model can explain *which hardware specs matter most*, making it interpretable.

---

*Document generated for HNDIT Final Project Presentation — Project Aura*
