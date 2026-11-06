/**
 * Book List Application
 * Pure HTML, CSS, and Vanilla JavaScript with localStorage persistence.
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'booklist_app_books_v1';

  // --- State ---
  let books = [];
  let searchQuery = '';

  // --- DOM Elements ---
  const addBookForm = document.getElementById('addBookForm');
  const bookTitleInput = document.getElementById('bookTitle');
  const bookAuthorInput = document.getElementById('bookAuthor');
  const bookReadInput = document.getElementById('bookRead');
  const titleError = document.getElementById('titleError');
  const authorError = document.getElementById('authorError');

  const totalCountEl = document.getElementById('totalCount');
  const statsBreakdownEl = document.getElementById('statsBreakdown');

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchStatusEl = document.getElementById('searchStatus');

  const bookListEl = document.getElementById('bookList');
  const emptyListStateEl = document.getElementById('emptyListState');
  const noResultsStateEl = document.getElementById('noResultsState');
  const noResultsMessageEl = document.getElementById('noResultsMessage');
  const resetSearchBtn = document.getElementById('resetSearchBtn');

  // Edit Modal Elements
  const editModal = document.getElementById('editModal');
  const editBookForm = document.getElementById('editBookForm');
  const editBookIdInput = document.getElementById('editBookId');
  const editBookTitleInput = document.getElementById('editBookTitle');
  const editBookAuthorInput = document.getElementById('editBookAuthor');
  const editBookReadInput = document.getElementById('editBookRead');
  const editTitleError = document.getElementById('editTitleError');
  const editAuthorError = document.getElementById('editAuthorError');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // --- LocalStorage Helpers ---
  function loadBooksFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load books from localStorage:', err);
    }
    return [];
  }

  function saveBooksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.error('Failed to save books to localStorage:', err);
      alert('Unable to save changes to local storage. Your browser storage might be full.');
    }
  }

  // --- Utility Functions ---
  function sanitizeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
  }

  // --- Statistics & Header Update ---
  function updateStats() {
    const total = books.length;
    const readCount = books.filter(b => b.isRead).length;
    const unreadCount = total - readCount;

    totalCountEl.textContent = total.toString();
    statsBreakdownEl.textContent = `${readCount} read • ${unreadCount} unread`;

    // Search status text
    if (searchQuery.trim()) {
      const filteredCount = getFilteredBooks().length;
      searchStatusEl.textContent = `Showing ${filteredCount} of ${total}`;
    } else {
      searchStatusEl.textContent = '';
    }
  }

  // --- Filter Books ---
  function getFilteredBooks() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter(book => {
      const titleMatch = book.title && book.title.toLowerCase().includes(q);
      const authorMatch = book.author && book.author.toLowerCase().includes(q);
      return titleMatch || authorMatch;
    });
  }

  // --- Render Book List ---
  function render() {
    updateStats();

    const filteredBooks = getFilteredBooks();

    // Case 1: Total list is completely empty
    if (books.length === 0) {
      bookListEl.innerHTML = '';
      emptyListStateEl.hidden = false;
      noResultsStateEl.hidden = true;
      return;
    }

    emptyListStateEl.hidden = true;

    // Case 2: Filtered search returned 0 results
    if (filteredBooks.length === 0) {
      bookListEl.innerHTML = '';
      noResultsMessageEl.textContent = `We couldn't find any books matching "${searchQuery}".`;
      noResultsStateEl.hidden = false;
      return;
    }

    noResultsStateEl.hidden = true;

    // Case 3: Render matching books
    const fragment = document.createDocumentFragment();

    filteredBooks.forEach(book => {
      const item = document.createElement('article');
      item.className = 'book-item';
      item.dataset.id = book.id;

      const isReadClass = book.isRead ? 'status-read' : 'status-unread';
      const readLabel = book.isRead ? 'Read' : 'To Read';
      const readIcon = book.isRead
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

      item.innerHTML = `
        <div class="book-info">
          <h3 class="book-title">${sanitizeHTML(book.title)}</h3>
          <p class="book-author">by <span class="book-author-name">${sanitizeHTML(book.author)}</span></p>
        </div>
        <div class="book-meta">
          <button 
            type="button" 
            class="status-badge ${isReadClass}" 
            data-action="toggle-read" 
            title="Click to toggle read status"
            aria-label="Status: ${readLabel}. Click to toggle"
          >
            ${readIcon}
            <span>${readLabel}</span>
          </button>
          <div class="book-actions">
            <button 
              type="button" 
              class="btn btn-icon btn-edit" 
              data-action="edit" 
              aria-label="Edit '${sanitizeHTML(book.title)}'"
              title="Edit book"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Edit</span>
            </button>
            <button 
              type="button" 
              class="btn btn-icon btn-delete" 
              data-action="delete" 
              aria-label="Delete '${sanitizeHTML(book.title)}'"
              title="Delete book"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;

      fragment.appendChild(item);
    });

    bookListEl.innerHTML = '';
    bookListEl.appendChild(fragment);
  }

  // --- Add Book Form Handling ---
  function clearAddErrors() {
    titleError.textContent = '';
    authorError.textContent = '';
    bookTitleInput.classList.remove('input-invalid');
    bookAuthorInput.classList.remove('input-invalid');
  }

  addBookForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearAddErrors();

    const titleVal = bookTitleInput.value.trim();
    const authorVal = bookAuthorInput.value.trim();
    const isReadVal = bookReadInput.checked;

    let hasError = false;

    if (!titleVal) {
      titleError.textContent = 'Please enter a book title.';
      bookTitleInput.classList.add('input-invalid');
      if (!hasError) bookTitleInput.focus();
      hasError = true;
    }

    if (!authorVal) {
      authorError.textContent = 'Please enter an author name.';
      bookAuthorInput.classList.add('input-invalid');
      if (!hasError) bookAuthorInput.focus();
      hasError = true;
    }

    if (hasError) return;

    const newBook = {
      id: generateId(),
      title: titleVal,
      author: authorVal,
      isRead: isReadVal,
      createdAt: Date.now()
    };

    books.unshift(newBook);
    saveBooksToStorage();
    render();

    // Reset Form
    addBookForm.reset();
    clearAddErrors();
    bookTitleInput.focus();
  });

  // Clear validation error on input
  bookTitleInput.addEventListener('input', function () {
    if (this.value.trim()) {
      titleError.textContent = '';
      this.classList.remove('input-invalid');
    }
  });

  bookAuthorInput.addEventListener('input', function () {
    if (this.value.trim()) {
      authorError.textContent = '';
      this.classList.remove('input-invalid');
    }
  });

  // --- Book List Action Delegator ---
  bookListEl.addEventListener('click', function (e) {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;

    const bookItem = actionBtn.closest('.book-item');
    if (!bookItem) return;

    const bookId = bookItem.dataset.id;
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const action = actionBtn.dataset.action;

    if (action === 'toggle-read') {
      book.isRead = !book.isRead;
      saveBooksToStorage();
      render();
    } else if (action === 'edit') {
      openEditModal(book);
    } else if (action === 'delete') {
      deleteBookWithConfirmation(book);
    }
  });

  // --- Delete Book with Confirmation ---
  function deleteBookWithConfirmation(book) {
    const confirmation = window.confirm(`Are you sure you want to delete "${book.title}"?`);
    if (!confirmation) return;

    books = books.filter(b => b.id !== book.id);
    saveBooksToStorage();
    render();
  }

  // --- Edit Modal Handling ---
  function clearEditErrors() {
    editTitleError.textContent = '';
    editAuthorError.textContent = '';
    editBookTitleInput.classList.remove('input-invalid');
    editBookAuthorInput.classList.remove('input-invalid');
  }

  function openEditModal(book) {
    clearEditErrors();
    editBookIdInput.value = book.id;
    editBookTitleInput.value = book.title;
    editBookAuthorInput.value = book.author;
    editBookReadInput.checked = Boolean(book.isRead);

    if (typeof editModal.showModal === 'function') {
      editModal.showModal();
    } else {
      // Fallback for older browsers
      editModal.setAttribute('open', '');
    }

    editBookTitleInput.focus();
    editBookTitleInput.select();
  }

  function closeEditModal() {
    clearEditErrors();
    if (typeof editModal.close === 'function') {
      editModal.close();
    } else {
      editModal.removeAttribute('open');
    }
  }

  closeModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);

  // Close modal when clicking outside on backdrop
  editModal.addEventListener('click', function (e) {
    const rect = editModal.getBoundingClientRect();
    const isClickInside = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isClickInside) {
      closeEditModal();
    }
  });

  // Handle native escape cancel event on dialog
  editModal.addEventListener('cancel', function () {
    clearEditErrors();
  });

  // Save changes from Edit Form
  editBookForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearEditErrors();

    const id = editBookIdInput.value;
    const titleVal = editBookTitleInput.value.trim();
    const authorVal = editBookAuthorInput.value.trim();
    const isReadVal = editBookReadInput.checked;

    let hasError = false;

    if (!titleVal) {
      editTitleError.textContent = 'Please enter a book title.';
      editBookTitleInput.classList.add('input-invalid');
      if (!hasError) editBookTitleInput.focus();
      hasError = true;
    }

    if (!authorVal) {
      editAuthorError.textContent = 'Please enter an author name.';
      editBookAuthorInput.classList.add('input-invalid');
      if (!hasError) editBookAuthorInput.focus();
      hasError = true;
    }

    if (hasError) return;

    const bookIndex = books.findIndex(b => b.id === id);
    if (bookIndex !== -1) {
      books[bookIndex].title = titleVal;
      books[bookIndex].author = authorVal;
      books[bookIndex].isRead = isReadVal;

      saveBooksToStorage();
      render();
    }

    closeEditModal();
  });

  editBookTitleInput.addEventListener('input', function () {
    if (this.value.trim()) {
      editTitleError.textContent = '';
      this.classList.remove('input-invalid');
    }
  });

  editBookAuthorInput.addEventListener('input', function () {
    if (this.value.trim()) {
      editAuthorError.textContent = '';
      this.classList.remove('input-invalid');
    }
  });

  // --- Search Handling ---
  searchInput.addEventListener('input', function () {
    searchQuery = this.value;
    clearSearchBtn.hidden = !searchQuery;
    render();
  });

  function clearSearch() {
    searchQuery = '';
    searchInput.value = '';
    clearSearchBtn.hidden = true;
    render();
    searchInput.focus();
  }

  clearSearchBtn.addEventListener('click', clearSearch);
  resetSearchBtn.addEventListener('click', clearSearch);

  // --- Initialization ---
  function init() {
    books = loadBooksFromStorage();
    render();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
