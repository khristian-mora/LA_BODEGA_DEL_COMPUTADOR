import prisma from '@/lib/prisma';
import { LandingClient } from '@/components/landing-client';

async function getSettings() {
  try {
    const settings = await prisma.siteSettings.findMany();
    const settingsObj: Record<string, string> = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    return settingsObj;
  } catch {
    return {};
  }
}

export default async function HomePage() {
  const settings = await getSettings();
  return <LandingClient settings={settings} />;
}
