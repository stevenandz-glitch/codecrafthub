const API_BASE_URL = 'http://localhost:5000/api/courses';

// DOM Elements
const courseForm = document.getElementById('course-form');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const coursesContainer = document.getElementById('courses-container');
const noCoursesDiv = document.getElementById('no-courses');
const loadingSpinner = document.getElementById('loading');
const notificationDiv = document.getElementById('notification');
const submitBtn = document.getElementById('submit-btn');

// State
let courses = [];

// Initialize the application
function init() {
  fetchCourses();
  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  courseForm.addEventListener('submit', handleAddCourse);
  editForm.addEventListener('submit', handleEditCourse);
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.style.display !== 'none') {
      closeModal();
    }
  });
}

// API Functions
async function fetchCourses() {
  showLoading(true);
  hideNotification();

  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    courses = await response.json();
    renderCourses();
    showNotification('Courses loaded successfully!', 'success');
  } catch (error) {
    console.error('Error fetching courses:', error);
    showNotification(`Failed to load courses: ${error.message}. Please ensure the backend server is running.`, 'error');
    courses = [];
    renderCourses();
  } finally {
    showLoading(false);
  }
}

async function createCourse(courseData) {
  showLoading(true);
  hideNotification();

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const newCourse = await response.json();
    courses.push(newCourse);
    renderCourses();
    showNotification('Course added successfully!', 'success');
    return true;
  } catch (error) {
    console.error('Error creating course:', error);
    showNotification(`Failed to add course: ${error.message}`, 'error');
    return false;
  } finally {
    showLoading(false);
  }
}

async function updateCourse(id, courseData) {
  showLoading(true);
  hideNotification();

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const updatedCourse = await response.json();
    courses = courses.map(c => c.id === id ? updatedCourse : c);
    renderCourses();
    showNotification('Course updated successfully!', 'success');
    return true;
  } catch (error) {
    console.error('Error updating course:', error);
    showNotification(`Failed to update course: ${error.message}`, 'error');
    return false;
  } finally {
    showLoading(false);
  }
}

async function deleteCourse(id) {
  showLoading(true);
  hideNotification();

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    courses = courses.filter(c => c.id !== id);
    renderCourses();
    showNotification('Course deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting course:', error);
    showNotification(`Failed to delete course: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// Form Handlers
async function handleAddCourse(e) {
  e.preventDefault();

  const formData = new FormData(courseForm);
  const courseData = {
    name: formData.get('name').trim(),
    description: formData.get('description').trim(),
    target_date: formData.get('target_date'),
    status: formData.get('status'),
  };

  if (!validateForm(courseData)) return;

  const success = await createCourse(courseData);
  if (success) {
    courseForm.reset();
  }
}

async function handleEditCourse(e) {
  e.preventDefault();

  const formData = new FormData(editForm);
  const id = document.getElementById('edit-id').value;
  const courseData = {
    name: formData.get('name').trim(),
    description: formData.get('description').trim(),
    target_date: formData.get('target_date'),
    status: formData.get('status'),
  };

  if (!validateForm(courseData)) return;

  const success = await updateCourse(id, courseData);
  if (success) {
    closeModal();
  }
}

// Validation
function validateForm(data) {
  if (!data.name) {
    showNotification('Course name is required', 'error');
    return false;
  }
  if (!data.description) {
    showNotification('Description is required', 'error');
    return false;
  }
  if (!data.target_date) {
    showNotification('Target date is required', 'error');
    return false;
  }
  if (!data.status) {
    showNotification('Status is required', 'error');
    return false;
  }
  return true;
}

// Render Functions
function renderCourses() {
  if (courses.length === 0) {
    coursesContainer.innerHTML = '';
    noCoursesDiv.style.display = 'block';
    return;
  }

  noCoursesDiv.style.display = 'none';
  coursesContainer.innerHTML = courses.map(course => createCourseCard(course)).join('');

  // Attach event listeners to edit and delete buttons
  courses.forEach(course => {
    const editBtn = document.getElementById(`edit-${course.id}`);
    const deleteBtn = document.getElementById(`delete-${course.id}`);

    if (editBtn) {
      editBtn.addEventListener('click', () => openEditModal(course));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => confirmDelete(course));
    }
  });
}

function createCourseCard(course) {
  const formattedDate = formatDate(course.target_date);
  const formattedCreatedAt = course.created_at ? formatDate(course.created_at) : 'N/A';
  const statusClass = getStatusClass(course.status);

  return `
    <div class="course-card">
      <div class="course-card-header">
        <h3 class="course-name">${escapeHtml(course.name)}</h3>
        <span class="course-status ${statusClass}">${escapeHtml(course.status)}</span>
      </div>
      <p class="course-description">${escapeHtml(course.description)}</p>
      <div class="course-meta">
        <div class="course-meta-item">
          <span class="course-meta-label">Target Date</span>
          <span class="course-meta-value">${formattedDate}</span>
        </div>
        <div class="course-meta-item">
          <span class="course-meta-label">Created</span>
          <span class="course-meta-value">${formattedCreatedAt}</span>
        </div>
      </div>
      <div class="course-actions">
        <button class="btn btn-secondary btn-sm" id="edit-${course.id}">Edit</button>
        <button class="btn btn-danger btn-sm" id="delete-${course.id}">Remove</button>
      </div>
    </div>
  `;
}

// Modal Functions
function openEditModal(course) {
  document.getElementById('edit-id').value = course.id;
  document.getElementById('edit-name').value = course.name;
  document.getElementById('edit-description').value = course.description;
  document.getElementById('edit-target_date').value = course.target_date;
  document.getElementById('edit-status').value = course.status;
  editModal.style.display = 'flex';
  document.getElementById('edit-name').focus();
}

function closeModal() {
  editModal.style.display = 'none';
}

// Helper Functions
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function getStatusClass(status) {
  const statusMap = {
    'Not Started': 'status-not-started',
    'In Progress': 'status-in-progress',
    'Completed': 'status-completed'
  };
  return statusMap[status] || 'status-not-started';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading(show) {
  loadingSpinner.style.display = show ? 'flex' : 'none';
  submitBtn.disabled = show;
}

function showNotification(message, type) {
  notificationDiv.textContent = message;
  notificationDiv.className = `notification ${type}`;
  notificationDiv.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideNotification();
  }, 5000);
}

function hideNotification() {
  notificationDiv.style.display = 'none';
}

function confirmDelete(course) {
  const confirmed = confirm(`Are you sure you want to delete "${course.name}"?`);
  if (confirmed) {
    deleteCourse(course.id);
  }
}

// Initialize the app
init();
