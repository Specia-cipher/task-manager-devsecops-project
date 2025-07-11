// Define the base URL for your API.
// This is relative, so it will use the same host and port as the served HTML.
const API_URL = '/api';
// Key for storing the JWT token in localStorage
const TOKEN_KEY = 'taskManagerToken';

// --- Utility Functions for Token Management ---

/**
 * Saves the JWT token to localStorage.
 * @param {string} token - The JWT token received from the API.
 */
function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Retrieves the JWT token from localStorage.
 * @returns {string|null} The JWT token or null if not found.
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Removes the JWT token from localStorage.
 */
function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// --- Authentication Functions ---

/**
 * Handles user registration.
 * @param {Event} e - The submit event from the registration form.
 */
async function register(e) {
  e.preventDefault(); // Prevent default form submission
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (res.ok) {
      saveToken(data.token);
      showApp(data.user.username); // Show the main app interface
    } else {
      // Display error message from the API
      alert(data.message || 'Registration failed.');
    }
  } catch (error) {
    console.error('Error during registration:', error);
    alert('An error occurred during registration. Please try again.');
  }
}

/**
 * Handles user login.
 * @param {Event} e - The submit event from the login form.
 */
async function login(e) {
  e.preventDefault(); // Prevent default form submission
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      saveToken(data.token);
      showApp(data.user.username); // Show the main app interface
    } else {
      // Display error message from the API
      alert(data.message || 'Login failed. Check your credentials.');
    }
  } catch (error) {
    console.error('Error during login:', error);
    alert('An error occurred during login. Please try again.');
  }
}

/**
 * Handles user logout. Clears token and reverts to auth forms.
 */
function logout() {
  removeToken(); // Remove JWT token
  document.getElementById('welcomeMessage').innerText = ''; // Clear welcome message
  document.getElementById('authForms').style.display = 'block'; // Show login/register forms
  document.getElementById('taskFormSection').style.display = 'none'; // Hide task management section
  document.getElementById('taskList').innerHTML = ''; // Clear tasks from display
}

// --- Task Management Functions ---

/**
 * Fetches and displays tasks for the logged-in user.
 */
async function fetchTasks() {
  const token = getToken();
  if (!token) {
    logout(); // If no token, force logout
    return;
  }

  try {
    const res = await fetch(`${API_URL}/tasks`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.status === 401 || res.status === 403) {
      // Unauthorized or Forbidden (e.g., expired token)
      logout();
      alert('Session expired or invalid. Please login again.');
      return;
    }

    if (!res.ok) {
        // Handle other API errors (e.g., 500 server error)
        const errorData = await res.json();
        alert(`Failed to fetch tasks: ${errorData.message || res.statusText}`);
        return;
    }

    const tasks = await res.json();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear existing tasks

    // Render each task
    tasks.forEach(task => {
      const div = document.createElement('div');
      div.className = 'task';
      div.innerHTML = `
        <div class="task-info">
          <div class="task-title">${task.title}</div>
          <div class="task-desc">${task.description}</div>
          <div class="task-status">${task.completed ? '✅ Completed' : '⏳ Pending'}</div>
        </div>
        <div class="task-actions">
          <button class="complete" onclick="updateTask('${task._id}')">✔️ Complete</button>
          <button class="delete" onclick="deleteTask('${task._id}')">🗑️ Delete</button>
        </div>
      `;
      taskList.appendChild(div);
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    alert('An error occurred while fetching tasks. Please try again.');
  }
}

/**
 * Adds a new task.
 * @param {Event} e - The submit event from the task form.
 */
async function addTask(e) {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const token = getToken();

  if (!token) {
    alert('You must be logged in to add tasks.');
    logout();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ title, description })
    });

    if (!res.ok) {
        const errorData = await res.json();
        alert(`Failed to add task: ${errorData.message || res.statusText}`);
        return;
    }

    document.getElementById('taskForm').reset(); // Clear form fields
    fetchTasks(); // Refresh task list
  } catch (error) {
    console.error('Error adding task:', error);
    alert('An error occurred while adding the task. Please try again.');
  }
}

/**
 * Updates an existing task (e.g., marks as complete).
 * @param {string} id - The ID of the task to update.
 */
async function updateTask(id) {
  const token = getToken();
  if (!token) {
    alert('You must be logged in to update tasks.');
    logout();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ completed: true }) // Assuming this updates status to complete
    });

    if (!res.ok) {
        const errorData = await res.json();
        alert(`Failed to update task: ${errorData.message || res.statusText}`);
        return;
    }
    fetchTasks(); // Refresh task list
  } catch (error) {
    console.error('Error updating task:', error);
    alert('An error occurred while updating the task. Please try again.');
  }
}

/**
 * Deletes a task.
 * @param {string} id - The ID of the task to delete.
 */
async function deleteTask(id) {
  const token = getToken();
  if (!token) {
    alert('You must be logged in to delete tasks.');
    logout();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
        const errorData = await res.json();
        alert(`Failed to delete task: ${errorData.message || res.statusText}`);
        return;
    }
    fetchTasks(); // Refresh task list
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('An error occurred while deleting the task. Please try again.');
  }
}

// --- UI State Management ---

/**
 * Shows the main application interface (tasks, add task form) and hides auth forms.
 * @param {string} username - The username to display in the welcome message.
 */
function showApp(username) {
  document.getElementById('welcomeMessage').innerText = `Welcome, ${username}!`;
  document.getElementById('authForms').style.display = 'none';
  document.getElementById('taskFormSection').style.display = 'block';
  fetchTasks(); // Load tasks for the logged-in user
}

// --- Event Listeners ---

// Attach event listeners to forms
document.getElementById('registerForm').addEventListener('submit', register);
document.getElementById('loginForm').addEventListener('submit', login);
document.getElementById('taskForm').addEventListener('submit', addTask);

// Attach logout to the button (onclick is already in HTML, but good to be consistent)
// document.querySelector('button.logout').addEventListener('click', logout);

// --- Initial App Load Logic ---

// Immediately Invoked Async Function Expression (IIAFE) for auto-login
(async function () {
  const token = getToken();
  if (token) {
    // Try to fetch user profile to validate token
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (res.ok) {
        const user = await res.json();
        showApp(user.username); // If token is valid, show app
      } else {
        // Token invalid or expired, remove it
        removeToken();
        console.log('Invalid or expired token. Please log in.');
      }
    } catch (error) {
      console.error('Error during auto-login profile fetch:', error);
      removeToken(); // Clear token on network error
    }
  }
})();
