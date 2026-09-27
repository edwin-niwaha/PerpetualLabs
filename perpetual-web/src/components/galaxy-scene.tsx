import earth from "../../public/images/cosmos/earth.webp";
import styles from "./galaxy.module.css";

export function GalaxyScene() {
  return (
    <div
      className={styles.scene}
      role="img"
      aria-label="Earth rotating in the center of a galaxy, with three planets moving along surrounding orbits"
    >
      <div className={styles.orbitalSystem} aria-hidden="true">
        <span className={`${styles.orbitPath} ${styles.outerPath}`} />
        <span className={`${styles.orbitPath} ${styles.innerPath}`} />
        <div className={styles.centerEarth}>
          <div
            className={styles.earthSurface}
            style={{ backgroundImage: `url("${earth.src}")` }}
          />
          <span className={styles.atmosphere} />
        </div>
        <div className={styles.orbitTrack}>
          <div className={`${styles.orbitingPlanet} ${styles.gasPlanet}`}>
            <span className={styles.planetRing} />
          </div>
        </div>
        <div className={styles.orbitTrack}>
          <div className={`${styles.orbitingPlanet} ${styles.copperPlanet}`} />
        </div>
        <div className={styles.orbitTrack}>
          <div className={`${styles.orbitingPlanet} ${styles.icePlanet}`} />
        </div>
      </div>
    </div>
  );
}
