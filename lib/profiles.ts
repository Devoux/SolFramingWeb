export type Profile = {
  slug: string;
  name: string;
  title: string;
  description: string;
  heroColor: string;
  thumbnail: string;
};

const profiles: Profile[] = [
  {
    slug: "aurora-lee",
    name: "Aurora Lee",
    title: "Mixed Media Visionary",
    description:
      "Aurora blends analog textures with digital gradients to create immersive dreamscapes.",
    heroColor: "from-purple-400 via-fuchsia-500 to-orange-300",
    thumbnail:
      "https://images.unsplash.com/photo-1526481280695-3c4693fcf66d?auto=format&fit=crop&w=640&q=80"
  },
  {
    slug: "marco-fernandez",
    name: "Marco Fernandez",
    title: "Minimalist Photographer",
    description:
      "Marco captures architectural silhouettes and the interplay of sunlight across modern cities.",
    heroColor: "from-sky-400 via-primary-500 to-emerald-300",
    thumbnail:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=640&q=80"
  },
  {
    slug: "sylvie-park",
    name: "Sylvie Park",
    title: "Ceramic Storyteller",
    description:
      "Sylvie sculpts tactile narratives that celebrate organic textures and ancient motifs.",
    heroColor: "from-amber-300 via-rose-300 to-primary-500",
    thumbnail:
      "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=640&q=80"
  }
];

export async function listProfiles(): Promise<Profile[]> {
  return profiles;
}

export async function getProfile(slug: string): Promise<Profile | undefined> {
  return profiles.find((profile) => profile.slug === slug);
}
