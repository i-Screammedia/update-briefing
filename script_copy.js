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
const galleryLightboxViewport = document.getElementById('galleryLightboxViewport');
const galleryLightboxCounter = document.getElementById('galleryLightboxCounter');
const galleryLightboxCaption = document.getElementById('galleryLightboxCaption');
const galleryZoomIn = document.getElementById('galleryZoomIn');
const galleryZoomOut = document.getElementById('galleryZoomOut');
const galleryZoomReset = document.getElementById('galleryZoomReset');
const galleryZoomLevel = document.getElementById('galleryZoomLevel');

let galleryImages = [];
let galleryIndex = 0;
let galleryLastFocused = null;
let touchStartX = 0;
let touchDeltaX = 0;
let galleryZoom = 1;
let galleryPanX = 0;
let galleryPanY = 0;
let isGalleryPanning = false;
let galleryPanStartX = 0;
let galleryPanStartY = 0;
let galleryPanOriginX = 0;
let galleryPanOriginY = 0;
let galleryPinchStartDistance = 0;
let galleryPinchStartZoom = 1;

const GALLERY_ZOOM_MIN = 1;
const GALLERY_ZOOM_MAX = 4;
const GALLERY_ZOOM_STEP = 0.2;

function getActiveGalleryImage() {
  if (!galleryLightboxTrack) return null;
  const slides = galleryLightboxTrack.querySelectorAll('.gallery-lightbox__slide');
  return slides[galleryIndex]?.querySelector('.gallery-lightbox__image') || null;
}

function resetGalleryZoom() {
  galleryZoom = 1;
  galleryPanX = 0;
  galleryPanY = 0;
  applyGalleryZoom();
}

function clampGalleryZoom(value) {
  return Math.min(GALLERY_ZOOM_MAX, Math.max(GALLERY_ZOOM_MIN, value));
}

function applyGalleryZoom() {
  const img = getActiveGalleryImage();
  if (!img) return;

  img.style.transform = `translate(${galleryPanX}px, ${galleryPanY}px) scale(${galleryZoom})`;
  img.style.cursor = galleryZoom > 1 ? (isGalleryPanning ? 'grabbing' : 'grab') : 'zoom-in';

  if (galleryLightboxViewport) {
    galleryLightboxViewport.classList.toggle('is-zoomed', galleryZoom > 1);
    galleryLightboxViewport.classList.toggle('is-panning', isGalleryPanning);
  }

  if (galleryZoomLevel) {
    galleryZoomLevel.textContent = `${Math.round(galleryZoom * 100)}%`;
  }

  if (galleryZoomIn) galleryZoomIn.disabled = galleryZoom >= GALLERY_ZOOM_MAX;
  if (galleryZoomOut) galleryZoomOut.disabled = galleryZoom <= GALLERY_ZOOM_MIN;
  if (galleryZoomReset) galleryZoomReset.disabled = galleryZoom <= GALLERY_ZOOM_MIN && galleryPanX === 0 && galleryPanY === 0;
}

function setGalleryZoom(nextZoom) {
  galleryZoom = clampGalleryZoom(nextZoom);

  if (galleryZoom <= 1) {
    galleryPanX = 0;
    galleryPanY = 0;
  }

  applyGalleryZoom();
}

function zoomGalleryAtPoint(nextZoom, clientX, clientY) {
  const img = getActiveGalleryImage();
  if (!img) return;

  const prevZoom = galleryZoom;
  const clampedZoom = clampGalleryZoom(nextZoom);
  if (clampedZoom === prevZoom) return;

  const rect = img.getBoundingClientRect();
  const offsetX = clientX - (rect.left + rect.width / 2);
  const offsetY = clientY - (rect.top + rect.height / 2);
  const zoomRatio = clampedZoom / prevZoom;

  galleryPanX = (galleryPanX - offsetX) * zoomRatio + offsetX;
  galleryPanY = (galleryPanY - offsetY) * zoomRatio + offsetY;
  galleryZoom = clampedZoom;

  if (galleryZoom <= 1) {
    galleryPanX = 0;
    galleryPanY = 0;
  }

  applyGalleryZoom();
}

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

  resetGalleryZoom();
}

function updateGalleryView() {
  if (!galleryLightboxTrack) return;

  galleryLightboxTrack.style.transform = `translateX(-${galleryIndex * 100}%)`;
  resetGalleryZoom();

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
  galleryZoom = 1;
  galleryPanX = 0;
  galleryPanY = 0;
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

galleryZoomIn?.addEventListener('click', () => setGalleryZoom(galleryZoom + GALLERY_ZOOM_STEP));
galleryZoomOut?.addEventListener('click', () => setGalleryZoom(galleryZoom - GALLERY_ZOOM_STEP));
galleryZoomReset?.addEventListener('click', resetGalleryZoom);

galleryLightbox?.addEventListener(
  'wheel',
  (event) => {
    if (galleryLightbox.hidden) return;

    const isOverViewport = Boolean(event.target.closest('.gallery-lightbox__viewport'));
    if (!event.ctrlKey && !isOverViewport) return;

    event.preventDefault();
    const delta = event.deltaY > 0 ? -GALLERY_ZOOM_STEP : GALLERY_ZOOM_STEP;
    zoomGalleryAtPoint(galleryZoom + delta, event.clientX, event.clientY);
  },
  { passive: false }
);

galleryLightboxTrack?.addEventListener('dblclick', (event) => {
  if (galleryLightbox?.hidden) return;
  const img = event.target.closest('.gallery-lightbox__image');
  if (!img) return;

  if (galleryZoom > 1) {
    resetGalleryZoom();
  } else {
    zoomGalleryAtPoint(2, event.clientX, event.clientY);
  }
});

galleryLightboxTrack?.addEventListener('mousedown', (event) => {
  if (galleryLightbox?.hidden || galleryZoom <= 1) return;
  const img = event.target.closest('.gallery-lightbox__image');
  if (!img) return;

  event.preventDefault();
  isGalleryPanning = true;
  galleryPanStartX = event.clientX;
  galleryPanStartY = event.clientY;
  galleryPanOriginX = galleryPanX;
  galleryPanOriginY = galleryPanY;
  applyGalleryZoom();
});

document.addEventListener('mousemove', (event) => {
  if (!isGalleryPanning) return;

  galleryPanX = galleryPanOriginX + (event.clientX - galleryPanStartX);
  galleryPanY = galleryPanOriginY + (event.clientY - galleryPanStartY);
  applyGalleryZoom();
});

document.addEventListener('mouseup', () => {
  if (!isGalleryPanning) return;
  isGalleryPanning = false;
  applyGalleryZoom();
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

  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    setGalleryZoom(galleryZoom + GALLERY_ZOOM_STEP);
    return;
  }

  if (event.key === '-') {
    event.preventDefault();
    setGalleryZoom(galleryZoom - GALLERY_ZOOM_STEP);
    return;
  }

  if (event.key === '0') {
    event.preventDefault();
    resetGalleryZoom();
    return;
  }

  if (event.key === 'ArrowLeft' && galleryZoom <= 1) {
    event.preventDefault();
    showPrevGalleryImage();
    return;
  }

  if (event.key === 'ArrowRight' && galleryZoom <= 1) {
    event.preventDefault();
    showNextGalleryImage();
  }
});

if (galleryLightbox) {
  galleryLightbox.addEventListener(
    'touchstart',
    (event) => {
      if (galleryLightbox.hidden) return;

      if (event.touches.length === 2) {
        const [t1, t2] = event.touches;
        galleryPinchStartDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        galleryPinchStartZoom = galleryZoom;
        touchDeltaX = 0;
        return;
      }

      touchStartX = event.changedTouches[0]?.clientX || 0;
      touchDeltaX = 0;

      if (galleryZoom > 1 && event.touches.length === 1) {
        isGalleryPanning = true;
        galleryPanStartX = event.touches[0].clientX;
        galleryPanStartY = event.touches[0].clientY;
        galleryPanOriginX = galleryPanX;
        galleryPanOriginY = galleryPanY;
      }
    },
    { passive: true }
  );

  galleryLightbox.addEventListener(
    'touchmove',
    (event) => {
      if (galleryLightbox.hidden) return;

      if (event.touches.length === 2) {
        const [t1, t2] = event.touches;
        const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (galleryPinchStartDistance > 0) {
          const centerX = (t1.clientX + t2.clientX) / 2;
          const centerY = (t1.clientY + t2.clientY) / 2;
          const nextZoom = galleryPinchStartZoom * (distance / galleryPinchStartDistance);
          zoomGalleryAtPoint(nextZoom, centerX, centerY);
        }
        return;
      }

      if (isGalleryPanning && galleryZoom > 1) {
        galleryPanX = galleryPanOriginX + (event.touches[0].clientX - galleryPanStartX);
        galleryPanY = galleryPanOriginY + (event.touches[0].clientY - galleryPanStartY);
        applyGalleryZoom();
        return;
      }

      const currentX = event.changedTouches[0]?.clientX || 0;
      touchDeltaX = currentX - touchStartX;
    },
    { passive: true }
  );

  galleryLightbox.addEventListener(
    'touchend',
    () => {
      if (galleryLightbox.hidden) return;

      if (isGalleryPanning) {
        isGalleryPanning = false;
        galleryPinchStartDistance = 0;
        applyGalleryZoom();
        return;
      }

      if (galleryZoom > 1 || Math.abs(touchDeltaX) < 48) return;

      if (touchDeltaX < 0) {
        showNextGalleryImage();
      } else {
        showPrevGalleryImage();
      }

      touchStartX = 0;
      touchDeltaX = 0;
      galleryPinchStartDistance = 0;
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
