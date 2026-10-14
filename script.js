document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.menu');
  const leadForm = document.getElementById('lead-form');
  const bookingForm = document.getElementById('booking-form');
  const travelerForm = document.getElementById('traveler-form');
  const checkoutForm = document.getElementById('checkout-form');
  const bookingsTable = document.getElementById('bookings-table-body');
  const clearBookingsButton = document.getElementById('clear-bookings');
  const paymentOptions = document.querySelectorAll('.payment-option');

  const readStorage = (key, fallback = []) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  };

  const writeStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const showFeedback = (message, formElement) => {
    if (!formElement) return;

    let feedback = formElement.parentElement.querySelector('.form-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'form-feedback';
      formElement.parentElement.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.classList.add('success');
  };

  const saveLead = async (data) => {
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      const allLeads = readStorage('skywayLeads');
      allLeads.push({ ...data, createdAt: new Date().toISOString(), type: 'lead' });
      writeStorage('skywayLeads', allLeads);
    }
  };

  const saveBooking = async (data) => {
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      const allBookings = readStorage('skywayBookings');
      allBookings.push({ ...data, createdAt: new Date().toISOString(), type: 'booking' });
      writeStorage('skywayBookings', allBookings);
    }
  };

  const loadBookings = async () => {
    if (!bookingsTable) return;

    try {
      const response = await fetch('/api/bookings');
      const payload = await response.json();
      const bookings = payload.data || [];

      if (!bookings.length) {
        bookingsTable.innerHTML = `
          <tr>
            <td colspan="8" class="empty-state">Nuk ka rezervime të regjistruara ende.</td>
          </tr>
        `;
        return;
      }

      bookingsTable.innerHTML = bookings
        .slice()
        .reverse()
        .map((booking) => `
          <tr>
            <td>${booking.fullName || booking.firstName || '—'} ${booking.lastName || ''}</td>
            <td>${booking.destination || '—'}</td>
            <td>${booking.hotel || '—'}</td>
            <td>${booking.bookingType || '—'}</td>
            <td>${booking.guests || '—'}</td>
            <td>${booking.departureDate || booking.travelDates || '—'}</td>
            <td>${booking.phone || '—'}</td>
            <td>${booking.email || '—'}</td>
          </tr>
        `)
        .join('');
    } catch (error) {
      const bookings = readStorage('skywayBookings');
      if (!bookings.length) {
        bookingsTable.innerHTML = `
          <tr>
            <td colspan="8" class="empty-state">Nuk ka rezervime të regjistruara ende.</td>
          </tr>
        `;
        return;
      }

      bookingsTable.innerHTML = bookings
        .slice()
        .reverse()
        .map((booking) => `
          <tr>
            <td>${booking.fullName || booking.firstName || '—'} ${booking.lastName || ''}</td>
            <td>${booking.destination || '—'}</td>
            <td>${booking.hotel || '—'}</td>
            <td>${booking.bookingType || '—'}</td>
            <td>${booking.guests || '—'}</td>
            <td>${booking.departureDate || booking.travelDates || '—'}</td>
            <td>${booking.phone || '—'}</td>
            <td>${booking.email || '—'}</td>
          </tr>
        `)
        .join('');
    }
  };

  const getBookingDraft = () => {
    const raw = sessionStorage.getItem('skywayBookingDraft');
    return raw ? JSON.parse(raw) : {};
  };

  const setBookingDraft = (data) => {
    sessionStorage.setItem('skywayBookingDraft', JSON.stringify(data));
  };

  if (navToggle && menu) {
    navToggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const inPageLinks = document.querySelectorAll('a[href^="#"], .btn:not([type])');
  inPageLinks.forEach((element) => {
    element.addEventListener('click', (event) => {
      const current = event.currentTarget;
      const target = document.getElementById('contact');
      if (target && current.tagName === 'A' && current.getAttribute('href')?.startsWith('#')) {
        event.preventDefault();
      }

      if (target && !current.closest('a[href^="http"]')) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (leadForm) {
    leadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(leadForm);
      const leadData = {
        name: formData.get('name') || formData.get('text') || 'Klient',
        email: formData.get('email') || '',
        phone: formData.get('phone') || formData.get('tel') || '',
        notes: formData.get('notes') || formData.get('textarea') || ''
      };

      await saveLead(leadData);
      showFeedback('Kërkesa juaj u regjistrua. Do të kontaktoheni menjeherë.', leadForm);
      leadForm.reset();
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(bookingForm);
      const draft = {
        fullName: formData.get('fullName') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        bookingType: formData.get('bookingType') || 'Rezervim',
        destination: formData.get('destination') || '',
        hotel: formData.get('hotel') || '',
        departureDate: formData.get('departureDate') || '',
        returnDate: formData.get('returnDate') || '',
        travelDates: `${formData.get('departureDate') || ''} - ${formData.get('returnDate') || ''}`.trim(),
        guests: formData.get('guests') || '2',
        roomType: formData.get('roomType') || '',
        notes: formData.get('notes') || '',
      };

      setBookingDraft(draft);
      window.location.href = 'traveler-details.html';
    });
  }

  if (travelerForm) {
    const draft = getBookingDraft();

    if (!draft.destination && !draft.hotel) {
      window.location.href = 'booking.html';
      return;
    }

    const travelerTitle = document.getElementById('traveler-title');
    const travelerDestination = document.getElementById('traveler-destination');

    if (travelerTitle) {
      travelerTitle.textContent = draft.destination || 'Mediterian Escape';
    }

    if (travelerDestination) {
      travelerDestination.textContent = draft.destination || 'Antalya';
    }

    const firstNameInput = travelerForm.querySelector('[name="firstName"]');
    const lastNameInput = travelerForm.querySelector('[name="lastName"]');
    const emailInput = travelerForm.querySelector('[name="email"]');
    const phoneInput = travelerForm.querySelector('[name="phone"]');

    if (firstNameInput && draft.fullName) {
      const names = draft.fullName.trim().split(/\s+/);
      firstNameInput.value = names[0] || '';
      lastNameInput.value = names.slice(1).join(' ') || '';
    }

    if (emailInput && draft.email) emailInput.value = draft.email;
    if (phoneInput && draft.phone) phoneInput.value = draft.phone;

    travelerForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(travelerForm);
      const firstName = formData.get('firstName') || '';
      const lastName = formData.get('lastName') || '';
      const fullName = `${firstName} ${lastName}`.trim();

      const updatedDraft = {
        ...draft,
        firstName,
        lastName,
        fullName,
        email: formData.get('email') || draft.email || '',
        phone: formData.get('phone') || draft.phone || '',
        passportNumber: formData.get('passportNumber') || '',
        passportIssueCountry: formData.get('passportIssueCountry') || '',
        passportIssueDate: formData.get('passportIssueDate') || '',
        passportExpiry: formData.get('passportExpiry') || '',
        nationality: formData.get('nationality') || '',
        gender: formData.get('gender') || '',
        travelerNotes: formData.get('travelerNotes') || '',
      };

      setBookingDraft(updatedDraft);
      window.location.href = 'checkout.html';
    });
  }

  if (checkoutForm) {
    const draft = getBookingDraft();

    const nameEl = document.getElementById('checkout-name');
    const destEl = document.getElementById('checkout-destination');
    const hotelEl = document.getElementById('checkout-hotel');
    const totalEl = document.getElementById('checkout-total');
    const summaryTotal = document.getElementById('summary-total');
    const routeFrom = document.getElementById('route-from');
    const routeTo = document.getElementById('route-to');

    const passengerName = draft.fullName || `${draft.firstName || ''} ${draft.lastName || ''}`.trim();

    if (nameEl) nameEl.textContent = passengerName || '—';
    if (destEl) destEl.textContent = draft.destination || '—';
    if (hotelEl) hotelEl.textContent = draft.hotel || '—';
    if (routeFrom) routeFrom.textContent = draft.destination || 'Prishtinë';
    if (routeTo) routeTo.textContent = draft.destination || 'Antalya';
    if (totalEl) totalEl.textContent = draft.total || '€289';
    if (summaryTotal) summaryTotal.textContent = draft.total || '€289';

    paymentOptions.forEach((option) => {
      option.addEventListener('click', () => {
        paymentOptions.forEach((item) => item.classList.remove('active'));
        option.classList.add('active');
      });
    });

    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const finalDraft = getBookingDraft();
      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Kartë bankare';

      const finalBooking = {
        ...finalDraft,
        paymentMethod,
        status: 'Për pritje'
      };

      await saveBooking(finalBooking);
      sessionStorage.removeItem('skywayBookingDraft');
      showFeedback('Rezervimi u krye me sukses. Ekipi ynë do t’ju kontaktojë për konfirmim.', checkoutForm);
      checkoutForm.reset();

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    });
  }

  if (bookingsTable) {
    loadBookings();
  }

  if (clearBookingsButton) {
    clearBookingsButton.addEventListener('click', async () => {
      try {
        await fetch('/api/bookings', { method: 'DELETE' });
      } catch (error) {
        writeStorage('skywayBookings', []);
      }
      loadBookings();
    });
  }

  const resultGrid = document.getElementById('result-grid');
  const sortPills = document.querySelectorAll('.sort-pill');

  if (resultGrid) {
    const sortResults = (mode) => {
      const cards = [...resultGrid.querySelectorAll('.result-card')];

      cards.sort((a, b) => {
        const priceA = Number(a.dataset.price || 0);
        const priceB = Number(b.dataset.price || 0);
        const ratingA = Number(a.dataset.rating || 0);
        const ratingB = Number(b.dataset.rating || 0);

        if (mode === 'rating') {
          return ratingB - ratingA || priceA - priceB;
        }

        return priceA - priceB;
      });

      cards.forEach((card) => resultGrid.appendChild(card));
    };

    sortPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        sortPills.forEach((item) => item.classList.remove('active'));
        pill.classList.add('active');
        sortResults(pill.textContent.includes('i shpejtë') ? 'rating' : 'price');
      });
    });

    sortResults('price');
  }
});
