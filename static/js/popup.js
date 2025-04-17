document.addEventListener('DOMContentLoaded', () => {
  const openPopup = id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  };

  const closePopup = modal => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  };

  const closeActivePopup = () => {
    const active = document.querySelector('.popup-modal.active');
    if (active) closePopup(active);
  };

  // trigger buttons
  document.querySelectorAll('.popup-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      openPopup(trigger.dataset.popupId);
    });
  });

  // “×” buttons
  document.querySelectorAll('.popup-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closePopup(btn.closest('.popup-modal'));
    });
  });

  // overlay clicks
  document.querySelectorAll('.popup-overlay').forEach(overlay => {
    overlay.addEventListener('click', () => {
      closePopup(overlay.closest('.popup-modal'));
    });
  });

  // also catch any click directly on the modal wrapper (just in case)
  document.querySelectorAll('.popup-modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closePopup(modal);
      }
    });
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeActivePopup();
  });
});

