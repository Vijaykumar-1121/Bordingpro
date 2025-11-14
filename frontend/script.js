document.addEventListener('DOMContentLoaded', () => {

    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');
    const submitBtn = document.getElementById('submit-btn');
    const errorMessage = document.getElementById('error-message');
    
    let selectedFile = null;

    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        selectedFile = event.target.files[0];
        if (selectedFile) {
            fileNameDisplay.textContent = selectedFile.name;
            errorMessage.textContent = '';
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });

    // Handle form submission
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            errorMessage.textContent = 'Please select a CSV file to upload.';
            return;
        }

        // Show loading state on button
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="loader-small"></div>
            Generating...
        `;
        errorMessage.textContent = '';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Call the backend API
            const response = await fetch('http://127.0.0.1:5000/api/generate', {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            if (!response.ok) {
                // Show error message from backend
                throw new Error(data.error || `HTTP error! Status: ${response.status}`);
            }
            
            // Store results in session storage to pass to the next page
            sessionStorage.setItem('boardingSequence', JSON.stringify(data));
            // Redirect to the results page
            window.location.href = 'results.html';

        } catch (error) {
            console.error('Fetch Error:', error);
            errorMessage.textContent = error.message;
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V16M12 16L17 11M12 16L7 11M4 20H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Generate Sequence
            `;
        }
    });

    // --- Smooth Scroll for Nav Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});