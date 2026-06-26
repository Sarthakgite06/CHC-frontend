import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🏳️' },
  { code: 'sa', label: 'संस्कृतम्', flag: '🕉️' },
];

export default function ThemeLangToggle({ style }) {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', ...style }}>
      <select
        value={i18n.language}
        onChange={changeLanguage}
        className="lang-select"
        title="Language"
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
        ))}
      </select>

      <button
        className="navbar-btn"
        title="Toggle Theme"
        onClick={toggleTheme}
        style={{
          width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer'
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
