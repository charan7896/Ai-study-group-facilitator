# AI Study Group Facilitator

An AI-powered application that helps students find optimal study groups, project teams, and peer tutoring connections by analyzing their academic needs, schedules, and courses.

## Project Structure

-   `README.md`: **You are here.** This file contains all instructions for setup and execution.
-   `.vscode/`: VS Code launch configurations for the backend.
-   `backend/`: The Node.js, Express, and MongoDB backend server.
-   `frontend/`: The React and TypeScript frontend application.

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1.  **Node.js**: [Download and install Node.js](https://nodejs.org/) (which includes npm).
2.  **MongoDB**: You need a running MongoDB instance. You can either [install it locally](https://www.mongodb.com/try/download/community) or use a free cloud service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
3.  **Git**: [Install Git](https://git-scm.com/downloads) to clone the repository.
4.  **Visual Studio Code**: The recommended code editor for this project.

---

## How to Run This Application

Follow these steps in order. You will need two separate terminal windows: one for the backend and one for the frontend.

### **Step 1: Get the Code**

First, clone the project repository to your local machine. Open a terminal and run:

```bash
git clone <repository-url>
cd <repository-folder-name>
```

### **Step 2: Configure the Backend**

The backend needs to connect to your MongoDB database.

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Create an environment file**: Create a new file named `.env`.

3.  **Add your MongoDB URI**: Open the `.env` file and add your MongoDB connection string. It should look like this:
    ```
    MONGODB_URI=your_mongodb_connection_string_here
    ```

4.  **Install backend dependencies**: In the `backend` directory terminal, run:
    ```bash
    npm install
    ```

### **Step 3: Configure the Frontend**

The frontend needs your Google Gemini API key to make suggestions.

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2.  **Create an environment file**: Create a new file named `.env` in the `frontend` directory.

3.  **Add your Gemini API key**: Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey) and add it to the `.env` file. It must be named `API_KEY`:
    ```
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```

### **Step 4: Run the Backend Server**

1.  Open the entire project folder in **VS Code**.
2.  Go to the **Run and Debug** panel on the left-side activity bar (or press `Ctrl+Shift+D`).
3.  You'll see a dropdown menu at the top. Select **"Launch Backend Server"** and press the green play button (`F5`).
4.  The server is running successfully when you see `API server running on http://localhost:5001` and `Connected to MongoDB` in the **Debug Console**.

**Leave this server running.**

### **Step 5: Run the Frontend Application**

1.  **Open a new terminal**.
2.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

3.  **Install frontend dependencies** (if you haven't already):
    ```bash
    npm install
    ```

4.  **Start the frontend development server**: In the same `frontend` terminal, run:
    ```bash
    npm run dev
    ```

5.  **View the application**: The terminal will display a local URL, usually `http://localhost:5173`. Open this URL in your web browser.

You can now register a new user and start using the AI Study Group Facilitator!