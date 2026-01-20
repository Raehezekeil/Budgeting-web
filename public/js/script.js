
// Wait for DOM and Chart.js to be fully loaded
document.addEventListener('DOMContentLoaded', function () {

    initQuantitySpinner();

    // Initialize all charts
    initCharts();


    // product single page
    var thumb_slider = new Swiper(".product-thumbnail-slider", {
        slidesPerView: 3,
        spaceBetween: 20,
        autoplay: true,
        direction: "vertical",
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    });

    var large_slider = new Swiper(".product-large-slider", {
        slidesPerView: 1,
        autoplay: true,
        spaceBetween: 0,
        effect: 'fade',
        thumbs: {
            swiper: thumb_slider,
        },
    });

});

// Toggle sidebar
document.getElementById('sidebarToggle').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('hidden');
    document.getElementById('content').classList.toggle('expanded');
});

// Toggle sidebar
document.getElementById('sidebarclose').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('hidden');
    document.getElementById('content').classList.toggle('expanded');
});

// Make sidebar links active when clicked
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function () {
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});



function initCharts() {
    createChart("revenueChart", {
        type: "line",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
                {
                    label: "Revenue3",
                    data: [753, 291, 847, 502, 134, 921, 678, 435, 998, 210, 567, 89],
                    borderColor: "#88B267",
                    backgroundColor: "#EEF3E9",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: "Revenue2",
                    data: [1523, 1876, 1345, 1789, 1102, 1934, 1428, 1657, 1982, 1275, 1740, 1890],
                    borderColor: "#F39C12",
                    backgroundColor: "#F9F5EE",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: "Revenue1",
                    data: [2734, 2890, 2456, 2987, 2156, 2765, 2932, 2345, 2876, 2098, 2645, 2990],
                    borderColor: "#65A1CB",
                    backgroundColor: "#E1F0FA",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } },
            },
        },
    });

    createChart("ageChart", {
        type: "doughnut",
        data: {
            labels: ["18-25", "25-30", "30-40", "40-60", "11-18"],
            datasets: [
                {
                    data: [25, 30, 20, 15, 20],
                    backgroundColor: ["#80BE4D", "#4699D3", "#F2D226", "#BC86E7", "#F2A52B"],
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "15%",
            plugins: { legend: { position: "bottom" } },
        },
    });

    createChart("genderChart", {
        type: "doughnut",
        data: {
            labels: ["Female", "Male"],
            datasets: [
                {
                    data: [65, 35],
                    backgroundColor: ["#F28D6D", "#A4D4EF"],
                    borderWidth: 0,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "15%",
            plugins: { legend: { position: "bottom" } },
        },
    });

    createChart("discountChart", {
        type: "line",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
                {
                    label: "Discount Sales",
                    data: [500, 100, 200, 400, 300, 800],
                    borderColor: "#88B267",
                    backgroundColor: "#EEF3E9",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } },
            },
        },
    });
}

function createChart(id, config) {
    const ctx = document.getElementById(id);
    if (!ctx) {
        console.error(`Canvas element with id '${id}' not found`);
        return;
    }

    if (ctx.chart) {
        ctx.chart.destroy();
    }

    ctx.chart = new Chart(ctx, config);
}

function initQuantitySpinner() {
    const productQtyElements = document.querySelectorAll('.product-qty');

    productQtyElements.forEach(function (productEl) {
      const quantityInput = productEl.querySelector('.quantity');
      const plusButton = productEl.querySelector('.quantity-right-plus');
      const minusButton = productEl.querySelector('.quantity-left-minus');

      plusButton.addEventListener('click', function (e) {
        e.preventDefault();
        let quantity = parseInt(quantityInput.value) || 0;
        quantityInput.value = quantity + 1;
      });

      minusButton.addEventListener('click', function (e) {
        e.preventDefault();
        let quantity = parseInt(quantityInput.value) || 0;
        if (quantity > 0) {
          quantityInput.value = quantity - 1;
        }
      });
    });
  }
