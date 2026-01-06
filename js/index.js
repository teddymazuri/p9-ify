// Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Update company name if saved
        document.addEventListener('DOMContentLoaded', function() {
            const settings = JSON.parse(localStorage.getItem('gen_settings')) || {};
            const companyNameElements = document.querySelectorAll('.text-company-name');
            if(settings.name && companyNameElements.length > 0) {
                companyNameElements.forEach(el => {
                    el.textContent = settings.name;
                });
            }
        });