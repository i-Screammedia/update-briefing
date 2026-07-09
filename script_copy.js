// ── 모바일 햄버거 메뉴 ──
const hamburger = document.querySelector('.top-nav__hamburger');
const menu = document.querySelector('.top-nav__menu');

if (hamburger && menu) {
  hamburger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── 선생님 영상 탭 ──
const teacherVideoTabs = document.querySelector('[data-teacher-video-tabs]');

if (teacherVideoTabs) {
  const tabButtons = teacherVideoTabs.querySelectorAll('.teacher-video__tab');
  const videoEl = teacherVideoTabs.querySelector('.teacher-video__video');

  function applyTeacherVideoTab(button) {
    const cdnSrc = (button.dataset.cdnSrc || '').trim();
    if (!videoEl || !cdnSrc) return;

    videoEl.pause();
    if (videoEl.getAttribute('src') !== cdnSrc) {
      videoEl.src = cdnSrc;
    }
    videoEl.load();
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      tabButtons.forEach((btn) => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-selected', 'false');
      });

      button.classList.add('is-active');
      button.setAttribute('aria-selected', 'true');
      applyTeacherVideoTab(button);
    });
  });
}

// ── 기능별 이미지 갤러리 라이트박스 ──
const galleryLightbox = document.getElementById('galleryLightbox');
const galleryLightboxBackdrop = document.getElementById('galleryLightboxBackdrop');
const galleryLightboxClose = document.getElementById('galleryLightboxClose');
const galleryLightboxPrev = document.getElementById('galleryLightboxPrev');
const galleryLightboxNext = document.getElementById('galleryLightboxNext');
const galleryLightboxTrack = document.getElementById('galleryLightboxTrack');
const galleryLightboxCounter = document.getElementById('galleryLightboxCounter');
const galleryLightboxCaption = document.getElementById('galleryLightboxCaption');

let galleryImages = [];
let galleryIndex = 0;
let galleryLastFocused = null;
let touchStartX = 0;
let touchDeltaX = 0;

function getGalleryItemsFromContainer(container) {
  return Array.from(container.querySelectorAll('.feature-row__zoom-btn')).map((btn) => ({
    src: btn.dataset.src || btn.querySelector('img')?.getAttribute('src') || '',
    alt: btn.dataset.alt || btn.querySelector('img')?.getAttribute('alt') || '',
  }));
}

function renderGalleryTrack() {
  if (!galleryLightboxTrack) return;

  galleryLightboxTrack.innerHTML = galleryImages
    .map(
      (item) => `
        <div class="gallery-lightbox__slide">
          <img src="${item.src}" alt="${item.alt.replace(/"/g, '&quot;')}" class="gallery-lightbox__image" />
        </div>
      `
    )
    .join('');
}

function updateGalleryView() {
  if (!galleryLightboxTrack) return;

  galleryLightboxTrack.style.transform = `translateX(-${galleryIndex * 100}%)`;

  if (galleryLightboxCounter) {
    galleryLightboxCounter.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
  }

  if (galleryLightboxCaption) {
    galleryLightboxCaption.textContent = galleryImages[galleryIndex]?.alt || '';
  }

  const hasMultiple = galleryImages.length > 1;

  if (galleryLightboxPrev) {
    galleryLightboxPrev.hidden = !hasMultiple;
    galleryLightboxPrev.disabled = !hasMultiple;
  }

  if (galleryLightboxNext) {
    galleryLightboxNext.hidden = !hasMultiple;
    galleryLightboxNext.disabled = !hasMultiple;
  }
}

function openGalleryLightbox(container, startIndex) {
  if (!galleryLightbox || !container) return;

  galleryImages = getGalleryItemsFromContainer(container);
  if (!galleryImages.length) return;

  galleryIndex = Math.max(0, Math.min(startIndex, galleryImages.length - 1));
  galleryLastFocused = document.activeElement;

  renderGalleryTrack();
  updateGalleryView();

  galleryLightbox.hidden = false;
  galleryLightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  galleryLightboxClose?.focus();
}

function closeGalleryLightbox() {
  if (!galleryLightbox) return;

  galleryLightbox.hidden = true;
  galleryLightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  if (galleryLightboxTrack) {
    galleryLightboxTrack.innerHTML = '';
    galleryLightboxTrack.style.transform = '';
  }

  galleryImages = [];
  galleryIndex = 0;
  galleryLastFocused?.focus();
}

function showPrevGalleryImage() {
  if (galleryImages.length <= 1) return;
  galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
  updateGalleryView();
}

function showNextGalleryImage() {
  if (galleryImages.length <= 1) return;
  galleryIndex = (galleryIndex + 1) % galleryImages.length;
  updateGalleryView();
}

document.querySelectorAll('[data-feature-gallery]').forEach((galleryContainer) => {
  galleryContainer.querySelectorAll('.feature-row__zoom-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      openGalleryLightbox(galleryContainer, index);
    });
  });
});

galleryLightboxClose?.addEventListener('click', closeGalleryLightbox);
galleryLightboxBackdrop?.addEventListener('click', closeGalleryLightbox);
galleryLightboxPrev?.addEventListener('click', showPrevGalleryImage);
galleryLightboxNext?.addEventListener('click', showNextGalleryImage);

galleryLightbox?.addEventListener('click', (event) => {
  if (event.target.classList.contains('gallery-lightbox__image')) {
    closeGalleryLightbox();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (galleryLightbox && !galleryLightbox.hidden) {
      closeGalleryLightbox();
      return;
    }

    if (reviewModal && !reviewModal.hidden) {
      closeReviewModal();
    }
    return;
  }

  if (galleryLightbox?.hidden) return;

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    showPrevGalleryImage();
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    showNextGalleryImage();
  }
});

if (galleryLightbox) {
  galleryLightbox.addEventListener(
    'touchstart',
    (event) => {
      if (galleryLightbox.hidden) return;
      touchStartX = event.changedTouches[0]?.clientX || 0;
      touchDeltaX = 0;
    },
    { passive: true }
  );

  galleryLightbox.addEventListener(
    'touchmove',
    (event) => {
      if (galleryLightbox.hidden) return;
      const currentX = event.changedTouches[0]?.clientX || 0;
      touchDeltaX = currentX - touchStartX;
    },
    { passive: true }
  );

  galleryLightbox.addEventListener(
    'touchend',
    () => {
      if (galleryLightbox.hidden) return;
      if (Math.abs(touchDeltaX) < 48) return;

      if (touchDeltaX < 0) {
        showNextGalleryImage();
      } else {
        showPrevGalleryImage();
      }

      touchStartX = 0;
      touchDeltaX = 0;
    },
    { passive: true }
  );
}

// ── 후기 전문 팝업 ──
const reviewModal = document.getElementById('reviewModal');
const reviewModalBackdrop = document.getElementById('reviewModalBackdrop');
const reviewModalClose = document.getElementById('reviewModalClose');
const reviewModalName = document.getElementById('reviewModalName');
const reviewModalSchool = document.getElementById('reviewModalSchool');
const reviewModalBody = document.getElementById('reviewModalBody');
let reviewLastFocusedElement = null;

function openReviewModal(btn) {
  if (!reviewModal || !reviewModalBody) return;

  const template = document.getElementById(`reviewFull-${btn.dataset.review}`);
  if (!template) return;

  reviewLastFocusedElement = document.activeElement;
  reviewModalBody.innerHTML = '';
  reviewModalBody.appendChild(template.content.cloneNode(true));

  if (reviewModalName) reviewModalName.textContent = btn.dataset.reviewName || '';
  if (reviewModalSchool) reviewModalSchool.textContent = btn.dataset.reviewSchool || '';

  reviewModal.hidden = false;
  reviewModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  reviewModalClose?.focus();
}

function closeReviewModal() {
  if (!reviewModal) return;

  reviewModal.hidden = true;
  reviewModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (reviewModalBody) reviewModalBody.innerHTML = '';
  reviewLastFocusedElement?.focus();
}

document.querySelectorAll('.review-more-btn').forEach((btn) => {
  btn.addEventListener('click', () => openReviewModal(btn));
});

reviewModalClose?.addEventListener('click', closeReviewModal);
reviewModalBackdrop?.addEventListener('click', closeReviewModal);
