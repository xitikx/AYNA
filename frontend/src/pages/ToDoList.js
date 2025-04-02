// ToDoList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ToDoList.css';

const ToDoList = () => {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTask, setEditTask] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/todos', { withCredentials: true });
      setTodos(response.data.data || []);
    } catch (error) {
      console.error('Error fetching to-dos:', error);
      setMessage('Failed to load to-do list.');
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!task.trim()) {
      setMessage('Task cannot be empty.');
      return;
    }
    try {
      await axios.post('http://localhost:3000/api/todos', { task, dueDate }, { withCredentials: true });
      setMessage('Task added successfully!');
      setTask('');
      setDueDate(new Date().toISOString().split('T')[0]);
      fetchTodos();
    } catch (error) {
      setMessage('Failed to add task.');
    }
  };

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:3000/api/todos/${id}`, { completed: !currentStatus }, { withCredentials: true });
      setMessage('Task updated!');
      fetchTodos();
    } catch (error) {
      setMessage('Failed to update task.');
    }
  };

  const handleEditTodo = (todo) => {
    setEditingId(todo._id);
    setEditTask(todo.task);
    setEditDueDate(new Date(todo.dueDate).toISOString().split('T')[0]);
  };

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    if (!editTask.trim()) {
      setMessage('Task cannot be empty.');
      return;
    }
    try {
      await axios.put(`http://localhost:3000/api/todos/${editingId}`, { task: editTask, dueDate: editDueDate }, { withCredentials: true });
      setMessage('Task updated successfully!');
      setEditingId(null);
      setEditTask('');
      setEditDueDate('');
      fetchTodos();
    } catch (error) {
      setMessage('Failed to update task.');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/todos/${id}`, { withCredentials: true });
      setMessage('Task deleted successfully!');
      fetchTodos();
    } catch (error) {
      setMessage('Failed to delete task.');
    }
  };

  const isOverdue = (dueDate, completed) => {
    const today = new Date();
    const due = new Date(dueDate);
    return !completed && due < today;
  };

  return (
    <div className="todo-container">
      <div className="todo-gradient"></div>
      <header className="todo-header">
        <h1>To-Do List</h1>
      </header>
      <main className="todo-main">
        <section className="todo-form-section">
          <h3>Add New Task</h3>
          <form onSubmit={handleAddTodo} className="todo-form">
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What’s on your mind?"
              className="todo-input task-input"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="todo-input date-input"
            />
            <button type="submit" className="todo-add-btn">+</button>
          </form>
        </section>
        <section className="todo-list-section">
          <h3>Your Tasks</h3>
          {todos.length > 0 ? (
            <div className="todo-items">
              {todos.map((todo) => (
                <div key={todo._id} className={`todo-item ${isOverdue(todo.dueDate, todo.completed) ? 'overdue' : ''}`}>
                  {editingId === todo._id ? (
                    <form onSubmit={handleUpdateTodo} className="todo-edit-form">
                      <input
                        type="text"
                        value={editTask}
                        onChange={(e) => setEditTask(e.target.value)}
                        className="todo-input task-input"
                        placeholder="Update task"
                      />
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="todo-input date-input"
                      />
                      <button type="submit" className="todo-save-btn">Save</button>
                      <button type="button" className="todo-cancel-btn" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="todo-details">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleComplete(todo._id, todo.completed)}
                      />
                      <div className="todo-info">
                        <p className={todo.completed ? 'completed' : ''}>{todo.task}</p>
                        <p>Due: {new Date(todo.dueDate).toISOString().split('T')[0]}</p>
                        {isOverdue(todo.dueDate, todo.completed) && <p className="overdue-text">Overdue</p>}
                      </div>
                      <div className="todo-actions">
                        <button className="todo-edit-btn" onClick={() => handleEditTodo(todo)}>
                          Edit
                        </button>
                        <button className="todo-delete-btn" onClick={() => handleDeleteTodo(todo._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No tasks found. Add a new task to get started!</p>
          )}
        </section>
      </main>
      {message && <p className={`todo-message ${message.includes('Failed') ? 'error' : ''}`}>{message}</p>}
    </div>
  );
};

export default ToDoList;