import { loadProfiles } from '@/lib/profiles';
import FrameProfileSelector from '@/components/FrameProfileSelector';

export default async function VirtualFramingPage() {
  const profiles = await loadProfiles();
  return <FrameProfileSelector profiles={profiles} />;
}
