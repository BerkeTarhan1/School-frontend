// Use the HTTPS endpoint from your API
const API_BASE_URL = 'https://localhost:7247/api/students';
const AUTH_BASE_URL = 'https://localhost:7247/api/auth';

// Auth state
let currentUser = null;
let authToken = null;

// DOM Elements
const studentForm = document.getElementById('studentForm');
const editStudentForm = document.getElementById('editStudentForm');
const studentsList = document.getElementById('studentsList');
const loadingMessage = document.getElementById('loadingMessage');
const noStudents = document.getElementById('noStudents');
const searchInput = document.getElementById('searchInput');
const editModal = document.getElementById('editModal');
const closeModal = document.querySelector('.close');
const cancelEdit = document.getElementById('cancelEdit');

// Auth DOM Elements
const loginForm = document.getElementById('loginForm');
const loginFormContainer = document.getElementById('loginFormContainer');
const userInfo = document.getElementById('userInfo');
const userDisplayName = document.getElementById('userDisplayName');
const userRole = document.getElementById('userRole');
const logoutBtn = document.getElementById('logoutBtn');
const showRegisterBtn = document.getElementById('showRegister');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    loadStudents();
});

if (studentForm) studentForm.addEventListener('submit', addStudent);
if (editStudentForm) editStudentForm.addEventListener('submit', updateStudent);
if (searchInput) searchInput.addEventListener('input', filterStudents);
if (closeModal) closeModal.addEventListener('click', closeEditModal);
if (cancelEdit) cancelEdit.addEventListener('click', closeEditModal);

// Auth Event Listeners
if (loginForm) loginForm.addEventListener('submit', handleLogin);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegisterForm);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        closeEditModal();
    }
});

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(loginForm);
    const credentials = {
        username: formData.get('username').trim(),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${AUTH_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            throw new Error('Login failed - check your credentials');
        }

        const result = await response.json();
        authToken = result.token;
        currentUser = {
            username: result.username,
            role: result.role
        };

        // Save to localStorage
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        updateAuthUI();
        loadStudents(); // Reload students to reflect auth state
        showSuccess('Login successful!');
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(document.getElementById('registerForm'));
    const credentials = {
        username: formData.get('username').trim(),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${AUTH_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        showSuccess('Registration successful! Please login.');
        showLoginForm();
        
    } catch (error) {
        console.error('Registration error:', error);
        alert(`Registration failed: ${error.message}`);
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateAuthUI();
    loadStudents(); // Reload students to reflect auth state
    showSuccess('Logged out successfully!');
}

function checkAuthState() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
}

function updateAuthUI() {
    const isAdmin = currentUser && currentUser.role === 'Admin';
    
    if (currentUser && authToken) {
        if (loginFormContainer) loginFormContainer.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'block';
            userDisplayName.textContent = currentUser.username;
            userRole.textContent = currentUser.role;
        }
        
        // Show/hide admin features
        const adminFeatures = document.querySelectorAll('.admin-only');
        adminFeatures.forEach(feature => {
            feature.style.display = isAdmin ? 'block' : 'none';
        });

        // Update student cards to show/hide action buttons
        const actionButtons = document.querySelectorAll('.student-actions');
        actionButtons.forEach(actions => {
            actions.style.display = isAdmin ? 'flex' : 'none';
        });
        
    } else {
        if (loginFormContainer) loginFormContainer.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        
        // Hide admin features
        const adminFeatures = document.querySelectorAll('.admin-only');
        adminFeatures.forEach(feature => {
            feature.style.display = 'none';
        });

        // Hide action buttons in student cards
        const actionButtons = document.querySelectorAll('.student-actions');
        actionButtons.forEach(actions => {
            actions.style.display = 'none';
        });
    }
}

function showRegisterForm() {
    if (!document.getElementById('registerForm')) {
        const registerForm = `
            <div id="registerFormContainer">
                <h2>Register</h2>
                <form id="registerForm">
                    <div class="form-group">
                        <label for="regUsername">Username:</label>
                        <input type="text" id="regUsername" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="regPassword">Password:</label>
                        <input type="password" id="regPassword" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Register</button>
                    <button type="button" class="btn btn-secondary" id="showLogin">Back to Login</button>
                </form>
            </div>
        `;
        loginFormContainer.innerHTML = registerForm;
        
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
        document.getElementById('showLogin').addEventListener('click', showLoginForm);
    }
}

function showLoginForm() {
    loginFormContainer.innerHTML = `
        <h2>Login</h2>
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
            <button type="button" class="btn btn-secondary" id="showRegister">Register</button>
        </form>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
}

// Update fetch requests to include auth token
async function makeAuthenticatedRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const finalOptions = { ...defaultOptions, ...options };
    const response = await fetch(url, finalOptions);
    return response;
}

// Load all students
async function loadStudents() {
    try {
        showLoading();
        console.log('🔍 Attempting to fetch students from:', API_BASE_URL);
        
        // GET requests don't need authentication (AllowAnonymous)
        const response = await fetch(API_BASE_URL);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const students = await response.json();
        console.log('✅ Loaded students:', students);
        displayStudents(students);
    } catch (error) {
        console.error('❌ Error loading students:', error);
        showError(`Failed to load students: ${error.message}. 
        
Troubleshooting:
1. Make sure your API is running on https://localhost:7247
2. Check browser console for CORS errors
3. Try opening https://localhost:7247/api/students directly in your browser`);
    }
}

// Display students in the grid
function displayStudents(students) {
    hideLoading();
    
    if (!students || students.length === 0) {
        studentsList.innerHTML = '';
        noStudents.style.display = 'block';
        return;
    }

    noStudents.style.display = 'none';
    
    const isAdmin = currentUser && currentUser.role === 'Admin';
    
    studentsList.innerHTML = students.map(student => `
        <div class="student-card" data-student-id="${student.id}">
            <h3>${escapeHtml(student.name)}</h3>
            <p><strong>Birth Year:</strong> ${student.birthYear}</p>
            <p><strong>Class:</strong> ${escapeHtml(student.class)}</p>
            <p><strong>Created:</strong> ${formatDate(student.createdAt)}</p>
            <div class="student-actions" style="display: ${isAdmin ? 'flex' : 'none'}">
                <button class="btn btn-edit" onclick="openEditModal('${student.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteStudent('${student.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Add new student
async function addStudent(event) {
    event.preventDefault();
    
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'Admin') {
        alert('You need to be an admin to add students. Please login as an admin.');
        return;
    }
    
    const formData = new FormData(studentForm);
    const student = {
        name: formData.get('name').trim(),
        birthYear: parseInt(formData.get('birthYear')),
        class: formData.get('class').trim()
    };

    // Validation
    if (!student.name || !student.class || !student.birthYear) {
        alert('Please fill in all fields');
        return;
    }

    if (student.birthYear < 1900 || student.birthYear > new Date().getFullYear()) {
        alert('Please enter a valid birth year');
        return;
    }

    try {
        console.log('➕ Adding student:', student);
        
        const response = await makeAuthenticatedRequest(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify(student)
        });

        console.log('📨 Add student response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized - Please login again');
            } else if (response.status === 403) {
                throw new Error('Forbidden - Admin role required');
            }
            
            let errorText = 'Unknown error';
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = response.statusText;
            }
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const createdStudent = await response.json();
        console.log('✅ Student created:', createdStudent);

        // Clear form and reload students
        studentForm.reset();
        await loadStudents();
        
        showSuccess('Student added successfully!');
    } catch (error) {
        console.error('❌ Error adding student:', error);
        alert(`Failed to add student: ${error.message}`);
    }
}

// Delete student
async function deleteStudent(studentId) {
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'Admin') {
        alert('You need to be an admin to delete students.');
        return;
    }

    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }

    try {
        console.log('🗑️ Deleting student:', studentId);
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/${studentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized - Please login again');
            } else if (response.status === 403) {
                throw new Error('Forbidden - Admin role required');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await loadStudents();
        showSuccess('Student deleted successfully!');
    } catch (error) {
        console.error('Error deleting student:', error);
        alert(`Failed to delete student: ${error.message}`);
    }
}

// Open edit modal
async function openEditModal(studentId) {
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'Admin') {
        alert('You need to be an admin to edit students.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${studentId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const student = await response.json();
        
        document.getElementById('editId').value = student.id;
        document.getElementById('editName').value = student.name;
        document.getElementById('editBirthYear').value = student.birthYear;
        document.getElementById('editClass').value = student.class;
        
        editModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading student for edit:', error);
        alert('Failed to load student data for editing.');
    }
}

// Update student
async function updateStudent(event) {
    event.preventDefault();
    
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'Admin') {
        alert('You need to be an admin to update students.');
        return;
    }
    
    const studentId = document.getElementById('editId').value;
    const student = {
        name: document.getElementById('editName').value.trim(),
        birthYear: parseInt(document.getElementById('editBirthYear').value),
        class: document.getElementById('editClass').value.trim()
    };

    // Validation
    if (!student.name || !student.class || !student.birthYear) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(student)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized - Please login again');
            } else if (response.status === 403) {
                throw new Error('Forbidden - Admin role required');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        closeEditModal();
        await loadStudents();
        showSuccess('Student updated successfully!');
    } catch (error) {
        console.error('Error updating student:', error);
        alert(`Failed to update student: ${error.message}`);
    }
}

// Filter students based on search input
function filterStudents() {
    const searchTerm = searchInput.value.toLowerCase();
    const studentCards = document.querySelectorAll('.student-card');
    
    let visibleCount = 0;
    
    studentCards.forEach(card => {
        const studentText = card.textContent.toLowerCase();
        if (studentText.includes(searchTerm)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show no results message if needed
    if (visibleCount === 0 && searchTerm) {
        studentsList.innerHTML = '<div class="no-data">No students match your search.</div>';
    }
}

// Close edit modal
function closeEditModal() {
    editModal.style.display = 'none';
    editStudentForm.reset();
}

// Utility functions
function showLoading() {
    loadingMessage.style.display = 'block';
    studentsList.innerHTML = '';
    noStudents.style.display = 'none';
}

function hideLoading() {
    loadingMessage.style.display = 'none';
}

function showError(message) {
    studentsList.innerHTML = `<div class="no-data" style="color: #e74c3c; text-align: left; white-space: pre-line;">${message}</div>`;
}

function showSuccess(message) {
    // Simple success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = 'background: #d4edda; color: #155724; padding: 12px; border-radius: 5px; margin: 10px 0; border: 1px solid #c3e6cb;';
    successDiv.textContent = message;
    
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.insertBefore(successDiv, formSection.firstChild);
    }
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Test the connection on load
console.log('🎯 Frontend loaded');
console.log('🔗 API URL:', API_BASE_URL);
console.log('🔐 Auth URL:', AUTH_BASE_URL);
console.log('💡 Open browser Developer Tools (F12) to see detailed logs');