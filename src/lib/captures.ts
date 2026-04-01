export interface CaptureData {
  id: string;
  title: string;
  source: string;
  embedUrl: string;
  thumbnail: string;
  description: string;
}

const RAW_CAPTURES = [
  {
    id: 'e769d12e-a0ac-4338-93bd-a82f078e0efc',
    title: 'Statue',
    thumbnail: 'https://cdn-luma.com/1bb1eab26b432cf176c1fad5b16385b33f0f073fded83069029e2e1e6ea15305.jpg',
    description: 'Classical statue capture',
  },
  {
    id: 'ae068d93-1a5f-4696-a9c9-743931ea1e5b',
    title: 'Room & Board',
    thumbnail: 'https://cdn-luma.com/6f35d6ce18c349c722abeb8bb947ec0757cf4fff910790368c4ed3ab0ce9163d.jpg',
    description: 'Interior room capture',
  },
  {
    id: '5feaf010-a229-4172-946c-0d0a21b83125',
    title: 'T-REX @ DMNS',
    thumbnail: 'https://cdn-luma.com/34c0e96b50730609bb57b4091307806292d444ecc1a51fe704469c0dad1114ba.jpg',
    description: 'Dinosaur exhibit at Denver Museum',
  },
  {
    id: 'c95183e1-1887-4fc9-aee2-1f7f22f83709',
    title: 'Denver Botanic Gardens',
    thumbnail: 'https://cdn-luma.com/cf018cd90afa46e92ede8f93834aa95e216439fe8d139dacc09c7320ef82e5a6.jpg',
    description: 'Aerial view of botanic gardens',
  },
  {
    id: 'acd5c2c6-5bb9-40ba-8a64-853e7a40eba3',
    title: 'Headdress',
    thumbnail: 'https://cdn-luma.com/7db7b8ba44bb14a37ae945d307fa3d019040d3b5394730eee5f31eb702ea9f67.jpg',
    description: 'Detailed headdress capture',
  },
  {
    id: '55669abc-4453-4efd-9934-48339c85581f',
    title: 'Dro',
    thumbnail: 'https://cdn-luma.com/2baf1cb43e7fbb1fef2edd5c5379061be685c228a22d0a3567298935e2dd9fe7.jpg',
    description: 'Dynamic drone capture',
  },
  {
    id: 'c0d64d9e-a2af-41de-9b2c-c6cfd0e4db8b',
    title: 'Dro II',
    thumbnail: 'https://cdn-luma.com/acb83b47cf281a101f4921ef9aef86a30ab6da9dccfcd7d98041788c2b12d6a4.jpg',
    description: 'Expansive drone capture',
  },
  {
    id: '430f929f-1a2c-4059-950c-071506d4268d',
    title: 'DRO III',
    thumbnail: 'https://cdn-luma.com/b03e02d6f8ea16c99a0ff50a6937fa17b2531769b163e8fbc883552a0dc99f91.jpg',
    description: 'Latest drone scene capture',
  },
] as const;

export const CAPTURES: CaptureData[] = RAW_CAPTURES.map((c) => ({
  ...c,
  source: `https://lumalabs.ai/capture/${c.id}`,
  embedUrl: `https://lumalabs.ai/embed/${c.id}?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&showMenu=false`,
}));

export const CAPTURES_BY_ID: Record<string, CaptureData> = Object.fromEntries(
  CAPTURES.map((c) => [c.id, c])
);

export const DEFAULT_CAPTURE_ID = CAPTURES[0].id;
