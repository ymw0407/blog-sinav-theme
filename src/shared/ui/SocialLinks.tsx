import React from 'react';
import clsx from 'clsx';
import { getSiteConfig } from '../../app/config/siteConfig';
import { getSiteIdentity, subscribeSiteIdentity } from '../../app/local/siteIdentityStore';
import { FiGithub, FiInstagram, FiLinkedin, FiGlobe, FiMail } from 'react-icons/fi';

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'github':
      return <FiGithub size={18} aria-hidden="true" focusable="false" />;
    case 'instagram':
      return <FiInstagram size={18} aria-hidden="true" focusable="false" />;
    case 'linkedin':
      return <FiLinkedin size={18} aria-hidden="true" focusable="false" />;
    case 'email':
      return <FiMail size={18} aria-hidden="true" focusable="false" />;
    default:
      return <FiGlobe size={18} aria-hidden="true" focusable="false" />;
  }
}

export default function SocialLinks({ className }: { className?: string }) {
  const [identity, setIdentity] = React.useState(() => getSiteIdentity());

  React.useEffect(() => {
    return subscribeSiteIdentity(() => setIdentity(getSiteIdentity()));
  }, []);

  const social = (identity?.social && identity.social.length ? identity.social : getSiteConfig().social) ?? [];
  if (social.length === 0) return null;
  return (
    <div className={clsx('socialLinks', className)} aria-label="Social links">
      {social.map((s) => (
        <a key={s.url} className="socialLink" href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
          <Icon name={s.icon ?? 'website'} />
        </a>
      ))}
    </div>
  );
}
