import React, { useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "done", "pending"
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" or "oldest"
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
  // -----------------------------
  // Fetch tasks
  // -----------------------------
useEffect(() => {
  const fetchTasks = async () => {
    try {
     
      const res = await fetch(`${API_BASE}/tasks`);
      console.log("Fetch raw response:", res); // <-- check status
      const data = await res.json();
      console.log("Fetched data:", data);      // <-- should be array
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };
  fetchTasks();
}, []);

  // -----------------------------
  // Add task
  // -----------------------------
  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
  const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask }),
      });
      const createdTask = await res.json();
      setTasks((prev) => [...prev, createdTask]); // Use functional update
      setNewTask("");
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  // -----------------------------
  // Toggle done/undo
  // -----------------------------
  const toggleTask = async (id, currentDone) => {
    try {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !currentDone }),
      });
      const updatedTask = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updatedTask : t))
      );
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  // -----------------------------
  // Delete task
  // -----------------------------
  const deleteTask = async (id) => {
    try {
  await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // 1) Filter by status
  let filteredTasks = tasks.filter((task) => {
    if (filter === "done") return task.done;
    if (filter === "pending") return !task.done;
    return true; // "all"
  });

  // 2) Filter by search term
  filteredTasks = filteredTasks.filter((task) =>
    (task.title || "").toLowerCase().includes(search.toLowerCase())
  );

  // 3) Sort by created_at
  filteredTasks = [...filteredTasks].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    if (sortOrder === "newest") return dateB - dateA; // newest first
    return dateA - dateB; // oldest first
  });

  // -----------------------------
  // Render UI
  // -----------------------------
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>My Tasks</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="New Task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          style={{ marginRight: "0.5rem", padding: "0.25rem 0.5rem" }}
        />
        <button onClick={addTask}>Add</button>
      </div>
<div style={{ marginBottom: "1rem" }}>
  <input
    type="text"
    placeholder="Search tasks..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{ marginRight: "0.5rem", padding: "0.25rem 0.5rem" }}
  />

  <button onClick={() => setFilter("all")} style={{ marginRight: "0.5rem" }}>All</button>
  <button onClick={() => setFilter("done")} style={{ marginRight: "0.5rem" }}>Done</button>
  <button onClick={() => setFilter("pending")}>Pending</button>
</div>
<div style={{ marginBottom: "1rem" }}>
  <button onClick={() => setSortOrder("newest")} style={{ marginRight: "0.5rem" }}>
    Newest First
  </button>
  <button onClick={() => setSortOrder("oldest")}>
    Oldest First
  </button>
</div>

      {tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (

        
<ul>
  {filteredTasks.length === 0 ? (
    <li>No tasks found</li>
  ) : (
    filteredTasks.map((task) =>
      task ? (
        <li key={task.id} style={{ marginBottom: "0.5rem" }}>
          <span
            style={{
              textDecoration: task.done ? "line-through" : "none",
            }}
          >
            {task.title || "Untitled Task"}
          </span>
          <button
            onClick={() => toggleTask(task.id, !!task.done)}
            style={{ marginLeft: "0.5rem" }}
          >
            {task.done ? "Undo" : "Done"}
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            style={{ marginLeft: "0.5rem" }}
          >
            Delete
          </button>
        </li>
      ) : null
    )
  )}
</ul>
      )}
    </div>
  );
};
export default App;
