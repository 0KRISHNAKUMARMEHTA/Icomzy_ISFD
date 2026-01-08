let feedbackData = JSON.parse(localStorage.getItem('feedbackData')) || [];
let selectedRating = 0;

const stars = document.querySelectorAll('.star');
stars.forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.dataset.rating);
        document.getElementById('rating').value = selectedRating;
        updateStars();
    });

    star.addEventListener('mouseenter', function() {
        const rating = parseInt(this.dataset.rating);
        stars.forEach((s, i) => {
            s.classList.toggle('active', i < rating);
        });
    });
});

document.getElementById('starRating').addEventListener('mouseleave', updateStars);

function updateStars() {
    stars.forEach((star, i) => {
        star.classList.toggle('active', i < selectedRating);
    });
}

document.getElementById('feedbackForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (selectedRating === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Oops...',
            text: 'Please select a star rating!',
            confirmButtonColor: '#667eea'
        });
        return;
    }

    const feedback = {
        id: Date.now(),
        serviceType: document.getElementById('serviceType').value,
        rating: selectedRating,
        comments: document.getElementById('comments').value,
        date: new Date().toISOString()
    };

    feedbackData.push(feedback);
    localStorage.setItem('feedbackData', JSON.stringify(feedbackData));

    Swal.fire({
        icon: 'success',
        title: 'Thank You!',
        text: 'Your feedback has been submitted successfully.',
        confirmButtonColor: '#667eea',
        timer: 2000,
        showConfirmButton: false
    });

    this.reset();
    selectedRating = 0;
    updateStars();

    displayFeedback();
    updateAnalytics();
});

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabName === 'listing') displayFeedback();
    if (tabName === 'analytics') updateAnalytics();
}

function displayFeedback(filteredData = feedbackData) {
    const listContainer = document.getElementById('feedbackList');
    
    if (filteredData.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="far fa-clipboard"></i>
                <h3>No feedback found</h3>
                <p>Try changing filters or submit new feedback.</p>
            </div>`;
        return;
    }

    listContainer.innerHTML = filteredData.sort((a, b) => b.id - a.id).map(feedback => `
        <div class="feedback-item">
            <div class="feedback-header">
                <span class="service-badge">${feedback.serviceType}</span>
                <div style="color: #ffd700;">
                    ${'<i class="fas fa-star"></i>'.repeat(feedback.rating)}
                    ${'<i class="far fa-star"></i>'.repeat(5 - feedback.rating)}
                </div>
            </div>
            ${feedback.comments ? `<div class="feedback-comment">"${feedback.comments}"</div>` : ''}
            <div class="feedback-date">
                <i class="far fa-clock"></i> ${new Date(feedback.date).toLocaleDateString()} at ${new Date(feedback.date).toLocaleTimeString()}
            </div>
        </div>
    `).join('');
}

function filterFeedback() {
    const serviceFilter = document.getElementById('filterService').value;
    const ratingFilter = document.getElementById('filterRating').value;

    let filtered = feedbackData;

    if (serviceFilter) filtered = filtered.filter(f => f.serviceType === serviceFilter);
    if (ratingFilter) filtered = filtered.filter(f => f.rating === parseInt(ratingFilter));

    displayFeedback(filtered);
}

function clearData() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Yes, delete all!'
    }).then((result) => {
        if (result.isConfirmed) {
            feedbackData = [];
            localStorage.removeItem('feedbackData');
            displayFeedback();
            updateAnalytics();
            Swal.fire('Deleted!', 'Your file has been deleted.', 'success');
        }
    })
}

let serviceChart, ratingChart;

function updateAnalytics() {
    const total = feedbackData.length;
    document.getElementById('totalFeedback').textContent = total;
    
    if (total === 0) {
        document.getElementById('avgRating').textContent = "0.0";
        document.getElementById('topService').textContent = "-";
    } else {
        const avg = (feedbackData.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1);
        document.getElementById('avgRating').textContent = avg;

        const counts = {};
        feedbackData.forEach(f => counts[f.serviceType] = (counts[f.serviceType] || 0) + 1);
        const top = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        document.getElementById('topService').textContent = top;
    }

    const serviceCounts = {};
    const ratingCounts = [0, 0, 0, 0, 0];
    
    feedbackData.forEach(f => {
        serviceCounts[f.serviceType] = (serviceCounts[f.serviceType] || 0) + 1;
        ratingCounts[f.rating - 1]++;
    });

    const ctxService = document.getElementById('serviceChart').getContext('2d');
    if (serviceChart) serviceChart.destroy();
    
    serviceChart = new Chart(ctxService, {
        type: 'bar',
        data: {
            labels: Object.keys(serviceCounts),
            datasets: [{
                label: 'Feedback Count',
                data: Object.values(serviceCounts),
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderColor: '#667eea',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });

    const ctxRating = document.getElementById('ratingChart').getContext('2d');
    if (ratingChart) ratingChart.destroy();

    ratingChart = new Chart(ctxRating, {
        type: 'pie',
        data: {
            labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
            datasets: [{
                data: ratingCounts,
                backgroundColor: [
                    '#fc8181',
                    '#f6ad55',
                    '#f6e05e',
                    '#68d391',
                    '#63b3ed'
                ],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                } 
            }
        }
    });
}

displayFeedback();
updateAnalytics();