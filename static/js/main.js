// ============================================
// EXCELENTEMENTE - JavaScript principal
// ============================================

(function () {
  // ---- Mobile menu toggle ----
  const menuBtn = document.getElementById('menu-btn')
  const mobileMenu = document.getElementById('mobile-menu')
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden')
      mobileMenu.classList.toggle('flex')
    })
    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden')
        mobileMenu.classList.remove('flex')
      })
    })
  }

  // ---- Side navigation (if present) ----
  const sideNav = document.getElementById('side-nav')
  if (sideNav) {
    const navLinks = sideNav.querySelectorAll('.nav-link')
    const sectionIds = Array.from(navLinks).map(l => l.getAttribute('data-nav'))

    navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault()
        const id = this.getAttribute('data-nav')
        const target = id === 'top' ? document.body : document.getElementById(id)
        if (!target) return
        const top = id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top, behavior: 'smooth' })
        setActive(id)
        history.replaceState(null, '', '#' + id)
      })
    })

    function setActive(id) {
      navLinks.forEach(link => {
        const isActive = link.getAttribute('data-nav') === id
        link.classList.toggle('bg-neutral-100', isActive)
        link.classList.toggle('text-black', isActive)
        link.classList.toggle('font-medium', isActive)
        link.classList.toggle('text-black/50', !isActive)
        link.classList.toggle('font-normal', !isActive)
        if (isActive) link.setAttribute('aria-current', 'true')
        else link.removeAttribute('aria-current')
      })
    }

    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean)
    if (sections.length > 0) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] })
      sections.forEach(s => observer.observe(s))
    }
  }

  // ---- Hero Carousel (real) ----
  let heroCurrent = 0
  const heroTotal = 5
  let heroTimer = null

  function heroCarouselGo(index) {
    const slides = document.querySelectorAll('.hero-slide')
    const dots = document.querySelectorAll('[data-dot]')
    if (!slides.length) return

    // Ocultar slide actual
    slides[heroCurrent].classList.remove('opacity-100')
    slides[heroCurrent].classList.add('opacity-0')
    dots[heroCurrent].classList.remove('bg-white')
    dots[heroCurrent].classList.add('bg-white/40')

    // Mostrar nuevo slide
    heroCurrent = index
    slides[heroCurrent].classList.remove('opacity-0')
    slides[heroCurrent].classList.add('opacity-100')
    dots[heroCurrent].classList.remove('bg-white/40')
    dots[heroCurrent].classList.add('bg-white')
  }

  function heroCarouselNav(dir) {
    let next = heroCurrent + dir
    if (next < 0) next = heroTotal - 1
    if (next >= heroTotal) next = 0
    heroCarouselGo(next)
    resetHeroTimer()
  }

  function resetHeroTimer() {
    clearInterval(heroTimer)
    heroTimer = setInterval(() => heroCarouselNav(1), 4000)
  }

  // Iniciar auto-play cuando el hero es visible
  const heroObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        resetHeroTimer()
      } else {
        clearInterval(heroTimer)
      }
    })
  }, { threshold: 0.3 })

  const heroEl = document.getElementById('hero-carousel')
  if (heroEl) heroObserver.observe(heroEl)

  // ---- Services Carousel (scroll horizontal) ----
  window.scrollCarousel = function(direction) {
    const carousel = document.querySelector('.snap-x')
    if (!carousel) return
    carousel.scrollBy({ left: direction * 420, behavior: 'smooth' })
  }

  // ---- Scroll-based header shadow ----
  const header = document.querySelector('header')
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('shadow-md', window.scrollY > 10)
    })
  }

  // ---- IntersectionObserver for fade-in animations ----
  const animatedElements = document.querySelectorAll('[data-animate]')
  if (animatedElements.length > 0) {
    const fadeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up')
          fadeObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    animatedElements.forEach(el => {
      el.style.opacity = '0'
      fadeObserver.observe(el)
    })
  }
})()
