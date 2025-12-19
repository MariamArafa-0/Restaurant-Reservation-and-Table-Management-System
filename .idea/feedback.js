// Feedback Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const feedbackForm = document.getElementById('feedbackForm');
    const starRating = document.getElementById('starRating');
    const stars = starRating.querySelectorAll('.star-large');
    const ratingValue = document.getElementById('ratingValue');
    const ratingText = document.getElementById('ratingText');
    const feedbackComments = document.getElementById('feedbackComments');
    const charCount = document.getElementById('charCount');
    const checkboxes = document.querySelectorAll('.feedback-checkbox');
    const submitBtn = document.querySelector('.feedback-submit-btn');
    const formMessage = document.getElementById('formMessage');

    // Rating text descriptions
    const ratingTexts = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };

    // Session guard: if the page was opened outside the logged-in server context (e.g., file://),
    // the API will fail. We check session first and guide the user clearly.
    fetch("/api/session", { credentials: "include" })
        .then(r => r.json())
        .then(s => {
            if (!s || !s.isLoggedIn) {
                showTopError("Your session is not active. Please log in again.");
                if (feedbackForm) {
                    Array.from(feedbackForm.elements).forEach(el => el.disabled = true);
                }
            }
        })
        .catch(() => {
            // If session check fails, still allow the form but show a hint.
            showTopError("Could not verify session. If submission fails, please log in again.");
        });

    // Star rating functionality
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            setRating(value);
        });

        star.addEventListener('mouseenter', function() {
            const value = parseInt(this.dataset.value);
            highlightStars(value);
            ratingText.textContent = ratingTexts[value];
        });
    });

    starRating.addEventListener('mouseleave', function() {
        const currentRating = parseInt(ratingValue.value);
        highlightStars(currentRating);
        if (currentRating > 0) {
            ratingText.textContent = ratingTexts[currentRating];
        } else {
            ratingText.textContent = 'Click to rate';
        }
    });

    function setRating(value) {
        ratingValue.value = value;
        highlightStars(value);
        ratingText.textContent = ratingTexts[value];
        clearError('ratingError');
    }

    function highlightStars(value) {
        stars.forEach((star, index) => {
            if (index < value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Character counter
    feedbackComments.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count;

        if (count > 300) {
            this.value = this.value.substring(0, 300);
            charCount.textContent = 300;
        }

        // Change color based on character count - Updated for Dark Theme
        if (count > 250) {
            charCount.style.color = '#e74c3c'; // Red warning
        } else if (count > 200) {
            charCount.style.color = '#cba660'; // Gold warning
        } else {
            charCount.style.color = '#5c707c'; // Default grey
        }

        clearError('commentsError');
    });

    // Checkbox validation
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Visual changes handled by CSS/browser default mostly for this theme
            clearError('aspectsError');
        });
    });

    // Form validation
    function validateForm() {
        let isValid = true;

        // Clear any previous top message
        clearTopMessage();

        // Validate rating
        if (ratingValue.value === '0' || ratingValue.value === '') {
            showError('ratingError');
            isValid = false;
        }

        // Validate comments
        if (feedbackComments.value.trim() === '') {
            showError('commentsError');
            isValid = false;
        } else if (feedbackComments.value.trim().length < 10) {
            document.getElementById('commentsError').textContent = 'Please provide at least 10 characters';
            showError('commentsError');
            isValid = false;
        }

        // NOTE: "Aspects" is optional per your latest request.
        // If you later want it mandatory again, re-enable the validation below.
        // const checkedBoxes = document.querySelectorAll('.feedback-checkbox:checked');
        // if (checkedBoxes.length === 0) {
        //     showError('aspectsError');
        //     isValid = false;
        // }

        if (!isValid) {
            showTopError('Please fill the required fields (rating and comment).');
        }
        return isValid;
    }

    function showError(errorId) {
        const errorElement = document.getElementById(errorId);
        errorElement.classList.add('show');
    }

    function clearError(errorId) {
        const errorElement = document.getElementById(errorId);
        errorElement.classList.remove('show');
    }

    // Form submission
    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        // Collect form data
        const formData = {
            rating: ratingValue.value,
            comments: feedbackComments.value.trim(),
            aspects: Array.from(document.querySelectorAll('.feedback-checkbox:checked')).map(cb => cb.value),
            timestamp: new Date().toISOString()
        };

        // Send to server (real API)
        const payload = {
            rating: formData.rating,
            text: buildFeedbackText(formData),
            date: formData.timestamp.slice(0, 10)
        };

        fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        })
        .then(async (resp) => {
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg || 'Failed to submit feedback');
            }
            return resp.json();
        })
        .then(() => {
            showTopSuccess('Thank you! Your feedback has been submitted.');
            resetForm();
        })
        .catch((err) => {
            showTopError('Could not submit feedback. Your session may have expired — please log in again and retry.');
            // Also log the exact error to console for easier debugging
            console.error(err);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'SUBMIT FEEDBACK';
        });
    });

    function buildFeedbackText(formData) {
        const parts = [];
        if (formData.comments) parts.push(formData.comments);
        if (formData.aspects && formData.aspects.length) parts.push('Aspects: ' + formData.aspects.join(', '));
        return parts.join('\n');
    }

    function clearTopMessage() {
        if (!formMessage) return;
        formMessage.classList.remove('show', 'success', 'error');
        formMessage.textContent = '';
    }

    function showTopSuccess(message) {
        if (!formMessage) return;
        formMessage.textContent = message;
        formMessage.classList.remove('error');
        formMessage.classList.add('show', 'success');
        // Auto-hide after a short delay
        setTimeout(() => {
            clearTopMessage();
        }, 4000);
    }

    function showTopError(message) {
        if (!formMessage) return;
        formMessage.textContent = message;
        formMessage.classList.remove('success');
        formMessage.classList.add('show', 'error');
        // Auto-hide after a bit longer
        setTimeout(() => {
            clearTopMessage();
        }, 6000);
    }

    function resetForm() {
        ratingValue.value = '0';
        highlightStars(0);
        ratingText.textContent = 'Click to rate';
        feedbackComments.value = '';
        charCount.textContent = '0';
        charCount.style.color = '#5c707c';

        checkboxes.forEach(cb => cb.checked = false);
    }
});