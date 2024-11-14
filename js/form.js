document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('obituaryForm');
    const contentInput = document.getElementById('content');
    const contentCount = document.getElementById('contentCount');

    // Update character count
    contentInput.addEventListener('input', function() {
        const count = this.value.length;
        contentCount.textContent = `${count} characters`;
    });

    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset previous errors
        clearErrors();
        
        // Validate all fields
        if (validateForm()) {
            submitForm();
        }
    });

    // Form validation
    function validateForm() {
        let isValid = true;

        // Validate name
        const name = document.getElementById('name').value.trim();
        if (name.length < 2) {
            showError('name', 'Name must be at least 2 characters long');
            isValid = false;
        }

        // Validate dates
        const dob = new Date(document.getElementById('date_of_birth').value);
        const dod = new Date(document.getElementById('date_of_death').value);
        const today = new Date();

        if (isNaN(dob.getTime())) {
            showError('date_of_birth', 'Please enter a valid date of birth');
            isValid = false;
        }

        if (isNaN(dod.getTime())) {
            showError('date_of_death', 'Please enter a valid date of death');
            isValid = false;
        }

        if (dod < dob) {
            showError('date_of_death', 'Date of death cannot be before date of birth');
            isValid = false;
        }

        if (dod > today) {
            showError('date_of_death', 'Date of death cannot be in the future');
            isValid = false;
        }

        // Validate content
        const content = document.getElementById('content').value.trim();
        if (content.length < 50) {
            showError('content', 'Content must be at least 50 characters long');
            isValid = false;
        }

        // Validate author
        const author = document.getElementById('author').value.trim();
        if (author.length < 2) {
            showError('author', 'Author name must be at least 2 characters long');
            isValid = false;
        }

        return isValid;
    }

    // Show error message
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        field.classList.add('error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Clear all error messages
    function clearErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        const errorFields = document.querySelectorAll('.error');
        
        errorMessages.forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });

        errorFields.forEach(field => {
            field.classList.remove('error');
        });
    }

    // Submit form
    async function submitForm() {
        try {
            const formData = new FormData(form);
            const response = await fetch('/submit_obituary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('success', 'Obituary submitted successfully');
                form.reset();
                setTimeout(() => {
                    window.location.href = '/view_obituaries';
                }, 2000);
            } else {
                showNotification('error', data.message || 'Error submitting obituary');
                if (data.errors) {
                    data.errors.forEach(error => {
                        showNotification('error', error);
                    });
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('error', 'An error occurred while submitting the form');
        }
    }

    // Add the showNotification function inside the DOMContentLoaded scope
    function showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
});

