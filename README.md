# DevForge AutoDebugger

![DevForge AutoDebugger UI](https://user-images.githubusercontent.com/your-username/your-repo/assets/screenshot.png) <!-- Replace with an actual screenshot -->

DevForge AutoDebugger is a modern, web-based IDE that leverages local AI models through Ollama and secure code execution via Docker to automatically debug your code. Write code, run it, and if you encounter errors, let the AI analyze the problem and propose a fix.

## ✨ Features

- **Multi-Language Support**: Write and debug code in Python, JavaScript, and C++.
- **AI-Powered Debugging**: Utilizes local language models via **Ollama** to analyze stack traces and provide code fixes.
- **Secure Execution**: Code is executed in an isolated **Docker** container to prevent harm to your local machine.
- **Rich IDE Experience**: A responsive, animated interface with a code editor, terminal, and a diff viewer to compare original code with AI-suggested fixes.
- **Resizable Layout**: A flexible and comfortable interface with resizable panels.
- **Local First**: Your code and AI models run entirely on your machine, ensuring privacy and offline capability.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend**: Python (FastAPI), Uvicorn
- **AI Integration**: Ollama
- **Containerization**: Docker

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](httpss://nodejs.org/) (v18 or higher)
- [Python](httpss://www.python.org/downloads/) (v3.9 or higher)
- [Docker Desktop](httpss://www.docker.com/products/docker-desktop/)
- [Ollama](httpss://ollama.ai/)

## 🚀 Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AutoDebugIDE.git
cd AutoDebugIDE
```

### 2. Set Up the AI Model with Ollama

You need a code-proficient model for the AI debugging feature. We recommend a model from the Qwen2 family, but others may work.

1.  **Pull the model via Ollama:**
    ```bash
    ollama pull qwen2:7b-instruct-q4_K_M
    ```
    *This is a good starting model. You can use larger or different models by changing the model name in the frontend.*

2.  **Ensure Ollama is running** in the background. You should see the Ollama icon in your system tray.

### 3. Configure the Backend

The backend manages the Dockerized code execution and communication with the Ollama API.

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# Install the required Python packages
pip install -r requirements.txt
```

### 4. Configure the Frontend

The frontend provides the user interface for the IDE.

```bash
# Navigate to the frontend directory from the root
cd frontend

# Install the required npm packages
npm install
```

## ▶️ Running the Application

You need to run both the backend and frontend servers simultaneously.

### 1. Start the Backend Server

In your terminal, from the `backend` directory:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will now be running on `http://localhost:8000`.

### 2. Start the Frontend Server

In a **new terminal**, from the `frontend` directory:

```bash
npm run dev
```

The frontend development server will start, and you can access the application at the URL provided (usually `http://localhost:5173`).

## ⚙️ How It Works

1.  **Frontend (UI)**: You write your code in the browser-based editor and click "Run" or "Auto Debug".
2.  **Backend (API)**: The frontend sends the code and command to the Python backend.
3.  **Docker Sandbox**: The backend spins up a temporary, isolated Docker container to execute the code safely. The output, errors, and logs are captured and sent back to the frontend.
4.  **Ollama Integration**: If "Auto Debug" is triggered, the backend sends the code and the error logs to your local Ollama instance. The AI model analyzes the context and returns a diagnosis and a potential code fix.
5.  **Diff View**: The frontend displays the AI's suggested fix in a side-by-side diff view, allowing you to review, accept, or reject the changes.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or improvements, feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/YourAmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/YourAmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
