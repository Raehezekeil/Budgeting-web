function goToSignup() {
    // Basic navigation
    window.location.href = 'signup.html';
}

function scrollToDemo() {
    const el = document.getElementById('demo-section');
    el.scrollIntoView({ behavior: 'smooth' });
}

// Scroll Animations
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-on-scroll').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Counter Animation
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    const isFloat = target % 1 !== 0;
    const duration = 2000; // ms
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing (easeOutQuart)
        const ease = 1 - Math.pow(1 - progress, 4);

        const current = start + (target - start) * ease;

        if (isFloat) {
            el.innerText = '$' + current.toFixed(1) + 'B';
        } else {
            el.innerText = Math.floor(current).toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            if (isFloat) el.innerText = '$' + target + 'B';
            else el.innerText = target.toLocaleString();
        }
    }

    requestAnimationFrame(update);
}
