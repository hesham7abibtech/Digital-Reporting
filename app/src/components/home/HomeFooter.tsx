import { HomeFooterConfig } from '@/lib/types';
import { Globe, Mail, MapPin } from 'lucide-react';

const SocialIcon = ({ name, size = 16 }: { name: string, size?: number }) => {
  const icons: Record<string, React.ReactNode> = {
    Linkedin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
    Twitter: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    Facebook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    Instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    ),
    Youtube: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    Github: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    )
  };

  return icons[name] || <Globe size={size} />;
};

interface Props {
  config: HomeFooterConfig;
}

export default function HomeFooter({ config }: Props) {
  return (
    <footer style={{
      padding: '48px 24px 32px',
      background: 'var(--teal)',
      color: 'var(--cotton)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 32, marginBottom: 20,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 350 }}>
            <h3 className="brand-heading" style={{
              fontSize: 20, color: 'var(--cotton)', margin: '0 0 12px', letterSpacing: '0.15em',
            }}>
              {config.aboutTitle}
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.5)', lineHeight: 1.7, margin: 0, marginBottom: 20 }}>
              {config.aboutDescription}
            </p>
            
            {/* Social Links */}
            <div style={{ display: 'flex', gap: 12 }}>
              {config.socialLinks?.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                  width: 32, height: 32, borderRadius: 8, background: 'rgba(249, 248, 242, 0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(249, 248, 242, 0.6)',
                  transition: 'all 200ms', textDecoration: 'none', border: '1px solid rgba(249, 248, 242, 0.1)'
                }} onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(249, 248, 242, 0.1)';
                  e.currentTarget.style.color = 'var(--sunlit-rock)';
                }} onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(249, 248, 242, 0.05)';
                  e.currentTarget.style.color = 'rgba(249, 248, 242, 0.6)';
                }}>
                  <SocialIcon name={link.icon || 'Globe'} />
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>
              Contact
            </span>
            {config.contactAddress && (
              <a 
                href={config.contactAddressLink || `https://www.google.com/maps/search/${encodeURIComponent(config.contactAddress)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', transition: 'opacity 200ms' }} 
                className="hover:opacity-80"
              >
                <MapPin size={14} color="rgba(249, 248, 242, 0.4)" />
                <span style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.6)', borderBottom: '1px solid transparent', transition: 'border-color 200ms' }} className="hover:!border-b-[rgba(249,248,242,0.3)]">{config.contactAddress}</span>
              </a>
            )}
            {config.contactEmail && (
              <a href={`mailto:${config.contactEmail}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', transition: 'opacity 200ms' }} className="hover:opacity-80">
                <Mail size={14} color="rgba(249, 248, 242, 0.4)" />
                <span style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.6)' }}>{config.contactEmail}</span>
              </a>
            )}
            {config.contactWebsite && (
              <a href={config.contactWebsite.startsWith('http') ? config.contactWebsite : `https://${config.contactWebsite}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', transition: 'opacity 200ms' }} className="hover:opacity-80">
                <Globe size={14} color="rgba(249, 248, 242, 0.4)" />
                <span style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.6)' }}>{config.contactWebsite}</span>
              </a>
            )}
          </div>

          {/* System */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>
              System
            </span>
            <span style={{ fontSize: 12, color: 'var(--sunlit-rock)', fontWeight: 800 }}>{config.version}</span>
            {config.systemItems?.map(item => (
              <a key={item.id} href={item.url} style={{ fontSize: 12, color: 'rgba(249, 248, 242, 0.5)', textDecoration: 'none' }} className="hover:!text-[rgba(249,248,242,0.8)]">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(249, 248, 242, 0.08)', marginBottom: 24 }} />

        {/* Copyright */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <p style={{ fontSize: 11, color: 'rgba(249, 248, 242, 0.35)', margin: 0 }}>
            © {new Date().getFullYear()} {config.copyright}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(249, 248, 242, 0.35)', margin: 0 }}>
            {config.platformName}
          </p>
        </div>
      </div>
    </footer>
  );
}
