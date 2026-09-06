import React from 'react';
import { Youtube, Twitter, Instagram, TikTok, Linkedin } from './BrandIcons.jsx';

const icons = { youtube: Youtube, tiktok: TikTok, instagram: Instagram, x: Twitter, linkedin: Linkedin, linkedin_page: Linkedin };

export default function SocialIcon({ platform, ...props }) {
  const Icon = icons[platform];
  return Icon ? <Icon aria-hidden="true" {...props} /> : null;
}
