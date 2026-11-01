interface AppFooterProps {
  onBackupClick: () => void;
}

export function AppFooter({ onBackupClick }: AppFooterProps) {
  return (
    <footer className='app-footer'>
      <p>
        اطلاعات فقط روی همین دستگاه ذخیره می‌شود، پس{' '}
        <button type='button' className='link-button' onClick={onBackupClick}>
          بک‌آپ بگیرید
        </button>
        . نرخ ارز را خودتان وارد می‌کنید و برنامه بدون اینترنت هم کار می‌کند.
      </p>
      <p className='version'>v1.1.0</p>
    </footer>
  );
}
