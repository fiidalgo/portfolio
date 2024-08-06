document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    const projectCards = document.querySelectorAll('.project-card');
    const skillTags = document.querySelectorAll('.skill-tag');
    const filteredProjectsSection = document.querySelector('.filtered-projects-section');
    const filteredProjectsContainer = document.querySelector('.filtered-projects-container');
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
        link.setAttribute('target', '_blank');
    });

    // Function to set the active link based on scroll position
    function setActiveLink() {
        let currentSection = -1;
        const scrollPosition = window.scrollY + window.innerHeight;
    
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
    
            // Skip sections that are hidden or have zero height
            if (section.offsetHeight === 0 || window.getComputedStyle(section).display === 'none') {
                return;
            }
    
            if (window.scrollY >= sectionTop - 60 && window.scrollY < sectionTop + sectionHeight - 60) {
                currentSection = index;
            }
    
            // Special case for the last section (Contact)
            if (scrollPosition >= document.body.scrollHeight - 10) {
                currentSection = sections.length - 1;
            }
        });
    
        navLinks.forEach(link => link.classList.remove('active'));
        if (currentSection >= 0) {
            navLinks[currentSection].classList.add('active');
        }
    }
    
    
    

    // Function to handle scroll animations for sections
    function scrollAnimations() {
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (sectionTop < windowHeight && sectionTop + section.offsetHeight > 0) {
                section.classList.add('in-view');
            } else {
                section.classList.remove('in-view');
            }
        });

        // Handle scroll animations for project cards
        projectCards.forEach((card, index) => {
            const cardTop = card.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (cardTop < windowHeight) {
                card.classList.add('fade-in-up');
                card.style.setProperty('--animation-order', index + 1);
            } else {
                card.classList.remove('fade-in-up');
            }
        });
    }

    // Initial setup
    setActiveLink();
    scrollAnimations();

    // Add event listeners for scrolling
    window.addEventListener('scroll', () => {
        setActiveLink();
        scrollAnimations();
    });

    // Smooth scroll for navbar links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            window.scrollTo({
                top: targetSection.offsetTop - 60, // Adjust scroll position to account for the navbar
                behavior: 'smooth'
            });
        });
    });

    // Skills Filtering Logic
    skillTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const skill = this.getAttribute('data-skill');
            this.classList.toggle('active');
            filterProjects();
        });
    });

    function filterProjects() {
        const activeSkills = Array.from(document.querySelectorAll('.skill-tag.active'))
            .map(tag => tag.getAttribute('data-skill'));

        filteredProjectsContainer.innerHTML = '';

        projectCards.forEach(card => {
            const tags = card.querySelectorAll('.tag');
            let hasMatchingSkill = false;

            tags.forEach(tag => {
                if (activeSkills.includes(tag.textContent)) {
                    hasMatchingSkill = true;
                }
            });

            if (hasMatchingSkill) {
                filteredProjectsContainer.appendChild(card.cloneNode(true));
            }
        });

        if (activeSkills.length > 0) {
            filteredProjectsSection.style.display = 'block';
        } else {
            filteredProjectsSection.style.display = 'none';
        }

        // Re-run scroll animations and active link updates after filtering
        setActiveLink();
        scrollAnimations();
    }
});
