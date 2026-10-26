
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

const dataFile = path.join(__dirname, "tasks.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readTasks() {
  try {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, "[]");
    }
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (error) {
    console.error("Could not read tasks:", error.message);
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(dataFile, JSON.stringify(tasks, null, 2));
}

// Get all tasks
app.get("/api/tasks", (req, res) => {
  res.json(readTasks());
});

// Add a task
app.post("/api/tasks", (req, res) => {
  const title = String(req.body.title || "").trim();

  if (!title || title.length > 200) {
    return res.status(400).json({
      message: "Enter a task (maximum 200 characters)."
    });
  }

  const tasks = readTasks();
  const task = {
    id: Date.now().toString(),
    title,
    completed: false
  };

  tasks.push(task);
  saveTasks(tasks);
  res.status(201).json(task);
});

// Mark task complete/incomplete
app.patch("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const task = tasks.find(t => t.id === req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  task.completed = Boolean(req.body.completed);
  saveTasks(tasks);
  res.json(task);
});

// Delete a task
app.delete("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const updatedTasks = tasks.filter(t => t.id !== req.params.id);

  if (updatedTasks.length === tasks.length) {
    return res.status(404).json({ message: "Task not found." });
  }

  saveTasks(updatedTasks);
  res.json({ message: "Task deleted successfully." });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

