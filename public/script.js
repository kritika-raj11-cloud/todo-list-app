
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const filter = document.getElementById("filter");
const message = document.getElementById("message");
const addButton = document.getElementById("addButton");

let tasks = [];

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

function showMessage(text) {
  message.textContent = text;
}

async function loadTasks() {
  taskList.replaceChildren();

  const loading = document.createElement("p");
  loading.className = "empty";
  loading.textContent = "Loading tasks...";
  taskList.appendChild(loading);

  try {
    tasks = await apiRequest("/api/tasks");
    renderTasks();
  } catch (error) {
    taskList.replaceChildren();
    const errorText = document.createElement("p");
    errorText.className = "empty";
    errorText.textContent = error.message;
    taskList.appendChild(errorText);
  }
}

function renderTasks() {
  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("pendingCount").textContent =
    tasks.filter(task => !task.completed).length;
  document.getElementById("completedCount").textContent =
    tasks.filter(task => task.completed).length;

  taskList.replaceChildren();

  const visibleTasks = tasks.filter(task => {
    if (filter.value === "pending") return !task.completed;
    if (filter.value === "completed") return task.completed;
    return true;
  });

  if (visibleTasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = tasks.length === 0
      ? "No tasks yet. Add your first task above!"
      : "No tasks in this filter.";
    taskList.appendChild(empty);
    return;
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "task-item";
    if (task.completed) item.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
      "aria-label",
      `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`
    );

    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;
      try {
        await apiRequest(`/api/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: checkbox.checked })
        });
        showMessage("Task status updated.");
        await loadTasks();
      } catch (error) {
        showMessage(error.message);
        await loadTasks();
      }
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      deleteButton.disabled = true;
      try {
        await apiRequest(`/api/tasks/${task.id}`, {
          method: "DELETE"
        });
        showMessage("Task deleted successfully.");
        await loadTasks();
      } catch (error) {
        showMessage(error.message);
        await loadTasks();
      }
    });

    item.append(checkbox, title, deleteButton);
    taskList.appendChild(item);
  });
}

taskForm.addEventListener("submit", async event => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    showMessage("Please enter a task.");
    return;
  }

  addButton.disabled = true;

  try {
    await apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title })
    });

    taskInput.value = "";
    filter.value = "all";
    showMessage("Task added successfully!");
    await loadTasks();
    taskInput.focus();
  } catch (error) {
    showMessage(error.message);
  } finally {
    addButton.disabled = false;
  }
});

filter.addEventListener("change", renderTasks);

loadTasks();
