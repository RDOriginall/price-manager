import { TABS, type TabId } from '../data/tabs';

interface TabBarProps {
  tab: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ tab, onChange }: TabBarProps) {
  return (
    <nav className='tab-bar' aria-label='بخش‌های برنامه'>
      {TABS.map((t) => (
        <button
          key={t.id}
          type='button'
          className='tab'
          aria-current={tab === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.8'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d={t.icon} />
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
