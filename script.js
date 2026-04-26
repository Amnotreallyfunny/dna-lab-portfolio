document.addEventListener('DOMContentLoaded', () => {
    // DNA Animation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('dna-bg');
    container.appendChild(canvas);

    let width, height;
    const dots = [];
    const dotCount = 40;
    const speed = 0.02;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < dotCount; i++) {
        dots.push({
            y: (height / dotCount) * i,
            phase: (Math.PI * 2 / dotCount) * i
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1;

        dots.forEach((dot, index) => {
            dot.phase += speed;
            const x1 = width / 2 + Math.sin(dot.phase) * 100;
            const x2 = width / 2 + Math.sin(dot.phase + Math.PI) * 100;

            // Draw line between base pairs
            ctx.beginPath();
            ctx.moveTo(x1, dot.y);
            ctx.lineTo(x2, dot.y);
            ctx.stroke();

            // Draw atoms
            ctx.fillStyle = '#00ffcc';
            ctx.beginPath();
            ctx.arc(x1, dot.y, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x2, dot.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    draw();

    // Typing Effect
    const typingTexts = document.querySelectorAll('.typing');
    typingTexts.forEach((el, i) => {
        const text = el.innerText;
        el.innerText = '';
        setTimeout(() => {
            typeWriter(el, text, 0);
        }, i * 1000);
    });

    function typeWriter(el, text, i) {
        if (i < text.length) {
            el.innerText += text.charAt(i);
            setTimeout(() => typeWriter(el, text, i + 1), 50);
        }
    }

    // Smooth Scrolling
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
