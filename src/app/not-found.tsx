import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#0891b2', marginBottom: '1rem' }}>404</h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              الصفحة غير موجودة
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              عذراً، الصفحة التي تبحث عنها غير موجودة
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0891b2',
                color: 'white',
                borderRadius: '0.5rem',
                textDecoration: 'none'
              }}
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
