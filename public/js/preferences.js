(function () {
  const STORAGE_KEY = 'peakfinance.preferences.v1';
  const allowed = {
    theme: ['midnight', 'oled', 'slate'],
    density: ['comfortable', 'compact'],
    fontSize: ['small', 'normal', 'large'],
    language: ['id', 'en'],
    defaultPeriod: [7, 30, 90]
  };

  const defaults = {
    theme: 'midnight',
    density: 'comfortable',
    fontSize: 'normal',
    reducedMotion: false,
    highContrast: false,
    underlineLinks: false,
    language: 'id',
    hideBalances: false,
    showInsights: true,
    sidebarCollapsed: localStorage.getItem('sidebar') === 'collapsed',
    defaultPeriod: 30
  };

  const translations = {
    id: {
      navDashboard: 'Dashboard',
      navAnalysis: 'Analisis',
      navTransactions: 'Transaksi',
      navSavings: 'Target Tabungan',
      navInsights: 'Insight',
      navSettings: 'Pengaturan',
      navOther: 'LAINNYA',
      settingsTitle: 'Pengaturan',
      settingsSubtitle: 'Sesuaikan pengalaman dan kelola akunmu.',
      tabAppearance: 'Tampilan',
      tabAccessibility: 'Aksesibilitas',
      tabAccount: 'Akun',
      tabLanguage: 'Bahasa',
      tabPersonalization: 'Personalisasi'
    },
    en: {
      navDashboard: 'Dashboard',
      navAnalysis: 'Analytics',
      navTransactions: 'Transactions',
      navSavings: 'Savings Goals',
      navInsights: 'Insights',
      navSettings: 'Settings',
      navOther: 'MORE',
      settingsTitle: 'Settings',
      settingsSubtitle: 'Customize your experience and manage your account.',
      tabAppearance: 'Appearance',
      tabAccessibility: 'Accessibility',
      tabAccount: 'Account',
      tabLanguage: 'Language',
      tabPersonalization: 'Personalization'
    }
  };

  const pageCopy = {
    en: {
      '/': ['Dashboard', 'A quick view of your finances today.'],
      '/analisis': ['Analytics', 'Explore your balance, spending, and financial health trends.'],
      '/transaksi': ['Transactions', 'Browse your income, expenses, and savings history.'],
      '/target': ['Savings Goals', 'Manage your goals and track your saving consistency.'],
      '/insight': ['Insights', 'Short guidance to help improve your financial habits.']
    },
    id: {
      '/': ['Dashboard', 'Ringkasan kondisi keuanganmu hari ini.'],
      '/analisis': ['Analisis', 'Lihat tren saldo, pengeluaran, dan kesehatan finansialmu.'],
      '/transaksi': ['Transaksi', 'Telusuri riwayat pemasukan, pengeluaran, dan tabungan.'],
      '/target': ['Target Tabungan', 'Kelola tujuan dan pantau konsistensi menabungmu.'],
      '/insight': ['Insight', 'Wawasan singkat untuk membantu kebiasaan finansialmu.']
    }
  };

  function sanitize(input) {
    const value = { ...defaults, ...(input || {}) };
    Object.entries(allowed).forEach(([key, values]) => {
      if (!values.includes(value[key])) value[key] = defaults[key];
    });
    ['reducedMotion', 'highContrast', 'underlineLinks', 'hideBalances', 'showInsights', 'sidebarCollapsed']
      .forEach(key => { value[key] = Boolean(value[key]); });
    return value;
  }

  function read() {
    try {
      return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return { ...defaults };
    }
  }

  let preferences = read();

  function translate(value) {
    const dictionary = translations[value.language] || translations.id;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const text = dictionary[element.dataset.i18n];
      if (text) element.textContent = text;
    });

    const copy = pageCopy[value.language]?.[window.location.pathname];
    if (copy) {
      const title = document.querySelector('.page-title');
      const subtitle = document.querySelector('.page-subtitle');
      if (title && !title.dataset.i18n) title.textContent = copy[0];
      if (subtitle && !subtitle.dataset.i18n) subtitle.textContent = copy[1];
    }
  }

  function apply(value = preferences) {
    const root = document.documentElement;
    const body = document.body;
    root.dataset.theme = value.theme;
    root.dataset.density = value.density;
    root.dataset.fontSize = value.fontSize;
    root.lang = value.language;
    root.style.fontSize = ({ small: '15px', normal: '16px', large: '18px' })[value.fontSize];

    if (body) {
      body.dataset.reducedMotion = String(value.reducedMotion);
      body.dataset.highContrast = String(value.highContrast);
      body.dataset.underlineLinks = String(value.underlineLinks);
      body.dataset.hideBalances = String(value.hideBalances);
      body.dataset.showInsights = String(value.showInsights);
    }

    localStorage.setItem('sidebar', value.sidebarCollapsed ? 'collapsed' : 'open');
    const sidebar = document.getElementById('appSidebar');
    if (sidebar && window.innerWidth > 1024) {
      sidebar.classList.toggle('collapsed', value.sidebarCollapsed);
    }
    translate(value);
  }

  function set(patch, notify = true) {
    preferences = sanitize({ ...preferences, ...patch });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    apply(preferences);
    if (notify) {
      window.dispatchEvent(new CustomEvent('peakpreferenceschange', { detail: { ...preferences } }));
    }
    return { ...preferences };
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    preferences = { ...defaults, sidebarCollapsed: false };
    return set(preferences);
  }

  window.PeakPreferences = {
    get: () => ({ ...preferences }),
    set,
    reset,
    apply: () => apply(preferences),
    defaults: { ...defaults }
  };

  if (document.body) apply(preferences);
  document.addEventListener('DOMContentLoaded', () => apply(preferences));
})();
