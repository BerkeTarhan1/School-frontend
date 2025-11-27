// Use the HTTPS endpoint from your API
const API_BASE_URL = 'https://localhost:7247/api/students';

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

// Event Listeners
document.addEventListener('DOMContentLoaded', loadStudents);
studentForm.addEventListener('submit', addStudent);
editStudentForm.addEventListener('submit', updateStudent);
searchInput.addEventListener('input', filterStudents);
closeModal.addEventListener('click', closeEditModal);
cancelEdit.addEventListener('click', closeEditModal);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        closeEditModal();
    }
});

// Load all students
async function loadStudents() {
    try {
        showLoading();
        console.log('🔍 Attempting to fetch students from:', API_BASE_URL);
        
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
    
    studentsList.innerHTML = students.map(student => `
        <div class="student-card" data-student-id="${student.id}">
            <h3>${escapeHtml(student.name)}</h3>
            <p><strong>Birth Year:</strong> ${student.birthYear}</p>
            <p><strong>Class:</strong> ${escapeHtml(student.class)}</p>
            <p><strong>Created:</strong> ${formatDate(student.createdAt)}</p>
            <div class="student-actions">
                <button class="btn btn-edit" onclick="openEditModal('${student.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteStudent('${student.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Add new student
async function addStudent(event) {
    event.preventDefault();
    
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
        
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(student)
        });

        console.log('📨 Add student response status:', response.status);
        
        if (!response.ok) {
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
        alert(`Failed to add student: ${error.message}\n\nCheck the browser console for details.`);
    }
}

// Delete student
async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }

    try {
        console.log('🗑️ Deleting student:', studentId);
        const response = await fetch(`${API_BASE_URL}/${studentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await loadStudents();
        showSuccess('Student deleted successfully!');
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
    }
}

// Open edit modal
async function openEditModal(studentId) {
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
        const response = await fetch(`${API_BASE_URL}/${studentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(student)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        closeEditModal();
        await loadStudents();
        showSuccess('Student updated successfully!');
    } catch (error) {
        console.error('Error updating student:', error);
        alert('Failed to update student. Please try again.');
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
    formSection.insertBefore(successDiv, formSection.firstChild);
    
    setTimeout(() => successDiv.remove(), 3000);
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
console.log('💡 Open browser Developer Tools (F12) to see detailed logs');