import * as styles from './AppBackground.css';

export default function AppBackground() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.layer} />
      <div className={styles.spotlight} />
      <div className={styles.vignette} />
      <div className={styles.noise} />
      <div className={styles.blob1}>
        <div className={styles.blobInner1} />
      </div>
      <div className={styles.blob2}>
        <div className={styles.blobInner2} />
      </div>
      <div className={styles.blob3}>
        <div className={styles.blobInner3} />
      </div>
    </div>
  );
}
