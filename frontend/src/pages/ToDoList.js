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
      const todoData = response.data.data || [];
      setTodos(todoData);
    } catch (error) {
      console.error('Error fetching to-dos:', error.response ? error.response.data : error.message);
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
      const response = await axios.post(
        'http://localhost:3000/api/todos',
        { task, dueDate },
        { withCredentials: true }
      );
      console.log('Add to-do response:', response.data);
      setMessage('To-do added successfully!');
      setTask('');
      setDueDate(new Date().toISOString().split('T')[0]);
      fetchTodos();
    } catch (error) {
      console.error('Error adding to-do:', error.response ? error.response.data : error.message);
      setMessage('Failed to add to-do: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/todos/${id}`,
        { completed: !currentStatus },
        { withCredentials: true }
      );
      console.log('Toggle complete response:', response.data);
      setMessage('To-do updated!');
      fetchTodos();
    } catch (error) {
      console.error('Error toggling to-do:', error.response ? error.response.data : error.message);
      setMessage('Failed to update to-do: ' + (error.response ? error.response.data.message : error.message));
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
      const response = await axios.put(
        `http://localhost:3000/api/todos/${editingId}`,
        { task: editTask, dueDate: editDueDate },
        { withCredentials: true }
      );
      console.log('Update to-do response:', response.data);
      setMessage('To-do updated successfully!');
      setEditingId(null);
      setEditTask('');
      setEditDueDate('');
      fetchTodos();
    } catch (error) {
      console.error('Error updating to-do:', error.response ? error.response.data : error.message);
      setMessage('Failed to update to-do: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/todos/${id}`, { withCredentials: true });
      console.log('Delete to-do response:', response.data);
      setMessage('To-do deleted successfully!');
      fetchTodos();
    } catch (error) {
      console.error('Error deleting to-do:', error.response ? error.response.data : error.message);
      setMessage('Failed to delete to-do: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  const isOverdue = (dueDate, completed) => {
    const today = new Date();
    const due = new Date(dueDate);
    return !completed && due < today;
  };

  return (
    <div className="todo-list">
      <header className="todo-header">
        <h1>To-Do List</h1>
      </header>
      <main className="todo-main">
        <section className="todo-form-section">
          <h3>Add New Task</h3>
          <form onSubmit={handleAddTodo} className="todo-form">
            <div className="form-group">
              <label htmlFor="task">Task:</label>
              <input
                type="text"
                id="task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g., Finish homework"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Due Date:</label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <button type="submit" className="add-btn">Add Task</button>
          </form>
        </section>
        <section className="todo-list-section">
          <h3>Your Tasks</h3>
          {todos.length > 0 ? (
            <div className="todo-items">
              {todos.map((todo) => (
                <div key={todo._id} className={`todo-item ${isOverdue(todo.dueDate, todo.completed) ? 'overdue' : ''}`}>
                  {editingId === todo._id ? (
                    <form onSubmit={handleUpdateTodo} className="edit-form">
                      <input
                        type="text"
                        value={editTask}
                        onChange={(e) => setEditTask(e.target.value)}
                        placeholder="Update task"
                      />
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                      <button type="submit" className="save-btn">Save</button>
                      <button type="button" className="cancel-btn" onClick={() => setEditingId(null)}>
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
                        <button className="edit-btn" onClick={() => handleEditTodo(todo)}>
                          Edit
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteTodo(todo._id)}>
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
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default ToDoList;