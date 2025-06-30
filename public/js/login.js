    const carouselImages = document.querySelectorAll('.carousel-img');
    let currentIndex = 0;
    setInterval(() => {
      carouselImages[currentIndex].classList.remove('opacity-100');
      carouselImages[currentIndex].classList.add('opacity-0');
      currentIndex = (currentIndex + 1) % carouselImages.length;
      carouselImages[currentIndex].classList.remove('opacity-0');
      carouselImages[currentIndex].classList.add('opacity-100');
    }, 7500);
 