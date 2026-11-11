export const ENVIRONMENTS = {
  spring: {
    name: 'Primavera',
    skyTop: 0x87ceeb, skyBottom: 0xdaf3ff,
    fog: 0xcfe8f5, fogDensity: 0.012,
    sunColor: 0xfff2cc, sunIntensity: 1.1,
    ambient: 0xffffff, ambientIntensity: 0.55,
    grass: 0x6fbf5a, grassDark: 0x4a9e3f,
    leaves: 0x7ec850, trunk: 0x6b4f2a,
    particles: 'petals', particleColor: 0xffb7d5,
  },
  summer: {
    name: 'Verano',
    skyTop: 0x4fa3ff, skyBottom: 0x9fd3ff,
    fog: 0xbfe0ff, fogDensity: 0.008,
    sunColor: 0xfff6d6, sunIntensity: 1.35,
    ambient: 0xffffff, ambientIntensity: 0.6,
    grass: 0x3fa34d, grassDark: 0x2d7a38,
    leaves: 0x2f8f3a, trunk: 0x5a3f22,
    particles: 'none', particleColor: 0xffffff,
  },
  autumn: {
    name: 'Otoño',
    skyTop: 0xd9a066, skyBottom: 0xf2d6a2,
    fog: 0xe8c99a, fogDensity: 0.015,
    sunColor: 0xffd28a, sunIntensity: 1.0,
    ambient: 0xffe6c2, ambientIntensity: 0.5,
    grass: 0xb89b5e, grassDark: 0x8f7a45,
    leaves: 0xd96a2b, trunk: 0x5a3f22,
    particles: 'leaves', particleColor: 0xe87a2e,
  },
  winter: {
    name: 'Invierno',
    skyTop: 0xb7c9e7, skyBottom: 0xe6eef7,
    fog: 0xeaf1f8, fogDensity: 0.02,
    sunColor: 0xffffff, sunIntensity: 0.85,
    ambient: 0xdfe7f5, ambientIntensity: 0.6,
    grass: 0xdfe7f2, grassDark: 0xc4d0e0,
    leaves: 0xffffff, trunk: 0x5a4a3a,
    particles: 'snow', particleColor: 0xffffff,
  },
};

export const ENV_ORDER = ['spring', 'summer', 'autumn', 'winter'];
