document.addEventListener('DOMContentLoaded', async function() {

  // --- GLOBAL STATE ---
  let cars = [];
  let currentFilterTag = ''; // To store the currently active filter tag
  const testimonials = [
    { name: "Stéphane K.", text: "Service irréprochable, chauffeur ponctuel et discret. Le véhicule était impeccable.", rating: 5 },
    { name: "Amina B.", text: "La voiture était parfaite pour mon mariage. L'équipe a été très professionnelle et à l'écoute.", rating: 5 },
    { name: "Kevin D.", text: "Réservation rapide et processus simple. Je recommande vivement pour les voyages d'affaires.", rating: 4 },
  ];

  // --- UTILS ---
  function createImageWithFallback(src, alt, className) {
    const img = document.createElement('img');
    // Adjust path for index.html relative to assets
    img.src = src.startsWith('assets') ? src : `../${src}`;
    img.alt = alt;
    img.className = className + ' loading-placeholder';
    img.onload = () => img.classList.remove('loading-placeholder');
    img.onerror = () => {
      img.classList.remove('loading-placeholder');
      img.classList.add('image-error');
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yNTAgMTUwSDM1MFYyNTBIMjUwVjE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
    };
    return img;
  }

  function generateStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) { stars += i < rating ? '★' : '☆'; }
    return `<div class="text-amber-400">${stars}</div>`;
  }

  // --- RENDER FUNCTIONS ---
  function displayCars(carsToDisplay) {
    const container = document.getElementById('fleetPreview');
    if (!container) return;
    container.innerHTML = '';
    carsToDisplay.forEach((car, index) => {
      const carCard = document.createElement('div');
      carCard.className = 'car-card rounded-2xl overflow-hidden group';
      carCard.setAttribute('data-aos', 'fade-up');
      carCard.setAttribute('data-aos-delay', index * 100);
      const img = createImageWithFallback(car.image, car.name, 'w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500');
      carCard.innerHTML = `
        <div class="relative overflow-hidden">${img.outerHTML}<div class="absolute top-4 right-4 bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-sm font-semibold">${car.category}</div></div>
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">${car.name}</h3>
          <div class="text-amber-400 text-2xl font-bold mb-4">${car.price}</div>
          <p class="text-slate-400 text-sm mb-4">Disponible: ${car.quantity} unité(s)</p>
          ${car.tags && car.tags.length > 0 ? `<div class="flex flex-wrap gap-2 mb-4">${car.tags.map(tag => `<span class="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">${tag}</span>`).join('')}</div>` : ''}
          <button class="w-full bg-slate-700 hover:bg-amber-400 hover:text-slate-900 text-white py-3 rounded-xl transition-colors font-semibold">Voir les détails</button>
        </div>
      `;
      carCard.addEventListener('click', () => openCarModal(car));
      container.appendChild(carCard);
    });
  }

  function displayTestimonials() {
    const container = document.getElementById('testimonialsContainer');
    if (!container) return;
    container.innerHTML = '';
    testimonials.forEach((t, index) => {
      const card = document.createElement('div');
      card.className = 'testimonial-card p-6 rounded-2xl';
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', index * 100);
      card.innerHTML = `${generateStars(t.rating)}<p class="text-slate-300 mt-4 mb-4">${t.text}</p><div class="text-sm text-slate-400 font-semibold">— ${t.name}</div>`;
      container.appendChild(card);
    });
  }

  // --- MODAL LOGIC ---
  const carModal = document.getElementById('carModal');
  if (carModal) {
    const closeModal = document.getElementById('closeModal');
    const modalImageContainer = document.getElementById('modal-image-container');
    const prevModalImage = document.getElementById('prev-modal-image');
    const nextModalImage = document.getElementById('next-modal-image');
    const modalBookingLink = document.getElementById('modal-booking-link');
    let currentModalImageIndex = 0;
    let currentCarImages = [];

    function showModalImage(index) {
      const total = currentCarImages.length;
      currentModalImageIndex = (index + total) % total;
      modalImageContainer.style.transform = `translateX(${-currentModalImageIndex * 100}%)`;
    }

    window.openCarModal = function(car) {
      document.getElementById('modal-car-name').textContent = car.name;
      document.getElementById('modal-car-category').textContent = car.category;
      document.getElementById('modal-car-price').textContent = car.price;
      document.getElementById('modal-car-features').innerHTML = car.features.map(f => `<li class="flex items-center gap-2 text-slate-300"><svg class="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>${f}</li>`).join('');
      
      document.getElementById('modal-car-quantity').textContent = `Unités disponibles: ${car.quantity}`;

      // Set the dynamic booking and comments link
      document.getElementById('modal-booking-link').href = `pages/booking.html?model_id=${car.id}`;
      document.getElementById('modal-comments-link').href = `pages/comments.html?car_id=${car.id}`;

      modalImageContainer.innerHTML = '';
      currentCarImages = [car.image, ...car.details];
      currentCarImages.forEach(imgSrc => {
        const img = createImageWithFallback(imgSrc, car.name, 'w-full h-full object-cover modal-image-slide');
        modalImageContainer.appendChild(img);
      });
      
      showModalImage(0);
      carModal.classList.remove('hidden');
      carModal.classList.add('flex');
    }

    closeModal.addEventListener('click', () => carModal.classList.add('hidden'));
    carModal.addEventListener('click', (e) => { if (e.target === carModal) carModal.classList.add('hidden'); });
    nextModalImage.addEventListener('click', () => showModalImage(currentModalImageIndex + 1));
    prevModalImage.addEventListener('click', () => showModalImage(currentModalImageIndex - 1));
  }

  // --- OTHER DYNAMIC LOGIC (Carousels, Menus) ---
  const videoContainer = document.getElementById('video-container');
  if (videoContainer) {
    let currentVideoIndex = 0;
    const prevVideo = document.getElementById('prev-video');
    const nextVideo = document.getElementById('next-video');
    function showVideo(index) {
        const total = videoContainer.children.length;
        currentVideoIndex = (index + total) % total;
        videoContainer.style.transform = `translateX(${-currentVideoIndex * 100}%)`;
    }
    nextVideo.addEventListener('click', () => showVideo(currentVideoIndex + 1));
    prevVideo.addEventListener('click', () => showVideo(currentVideoIndex - 1));
  }

  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  }

  document.querySelectorAll('a[href]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      // Only apply smooth scroll if it's an internal anchor AND it's on the current page
      if (href.startsWith('#') && href.length > 1 && href.indexOf('pages/') === -1) {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        // Close mobile menu on link click
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
        }
      }
      // If it's not an internal anchor, let the browser handle the navigation normally.
    });
  });

  // --- PWA Service Worker ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
  }

  // --- INITIALIZATION ---
  async function initializeCars(filterTag = '') {
    try {
      const url = filterTag ? `/api/cars?tag=${filterTag}` : '/api/cars';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      cars = await response.json();
      displayCars(cars);
    } catch (error) {
      console.error('Failed to fetch cars:', error);
      const fleetPreview = document.getElementById('fleetPreview');
      if(fleetPreview) fleetPreview.innerHTML = `<p class="text-red-400 col-span-full">Erreur de chargement des véhicules. Assurez-vous que le serveur backend est bien démarré.</p>`;
    }
  }

  async function initializeFilters() {
    const filterContainer = document.getElementById('car-filters');
    if (!filterContainer) return;

    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const tags = await response.json();

      tags.forEach(tag => {
        const button = document.createElement('button');
        button.className = 'filter-btn px-5 py-2 rounded-full bg-slate-800 hover:bg-amber-400 hover:text-slate-900 transition-colors text-sm font-semibold';
        button.textContent = tag;
        button.setAttribute('data-tag', tag);
        filterContainer.appendChild(button);
      });

      // Add event listeners to filter buttons
      filterContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('filter-btn')) {
          // Remove active class from previous button
          const currentActive = filterContainer.querySelector('.filter-btn.bg-amber-400');
          if (currentActive) {
            currentActive.classList.remove('bg-amber-400', 'text-slate-900');
            currentActive.classList.add('bg-slate-800', 'text-slate-100');
          }

          // Add active class to clicked button
          e.target.classList.remove('bg-slate-800', 'text-slate-100');
          e.target.classList.add('bg-amber-400', 'text-slate-900');

          currentFilterTag = e.target.getAttribute('data-tag');
          await initializeCars(currentFilterTag);
        }
      });
      // Set 'Tous' button as active initially
      const allButton = filterContainer.querySelector('[data-tag=""]');
      if (allButton) {
        allButton.classList.remove('bg-slate-800', 'text-slate-100');
        allButton.classList.add('bg-amber-400', 'text-slate-900');
      }

    } catch (error) {
      console.error('Failed to initialize filters:', error);
    }
  }

  // --- INITIALIZATION ---
  await initializeCars(); // Load cars initially
  initializeFilters(); // Load and set up filters
  displayTestimonials();
});