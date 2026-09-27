# Galaxy scene

The home and authentication layouts use the original M51 galaxy photograph and NASA Blue Marble Earth texture, bundled as `public/images/cosmos/galaxy.webp` and `earth.webp`. Both are statically imported by `galaxy-scene.tsx` for deployment.

Earth stays at the center while its surface rotates. Three surrounding planets follow elliptical orbit paths. Pause controls stop all animation, and reduced-motion preferences disable it. This arrangement is an artistic composition, not a model of the solar system.

Galaxy credit: NASA, ESA, S. Beckwith (STScI), and the Hubble Heritage Team (STScI/AURA).
Source: https://science.nasa.gov/asset/hubble/out-of-this-whirl-the-whirlpool-galaxy-m51-and-companion-galaxy/

Earth texture credit: NASA Earth Observatory / Blue Marble.
Source: https://visibleearth.nasa.gov/images/57730/the-blue-marble-land-surface-ocean-color-and-sea-ice

The earlier generated `earth-galaxy.webp` remains as an unused alternative and is no longer displayed.

The current scene uses a sparse CSS star field matching the initial live design; the galaxy photograph is no longer displayed. The home illustration is capped at 640px, the sign-in illustration at 300px, and the mobile home illustration at 380px. Earth and the surrounding planets retain their animations.
