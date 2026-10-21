import type { BrowserScene } from '../../content/types';
import { useLang } from '../../i18n/LangContext';
import styles from './BrowserFrame.module.css';

/** Generic browser look-alike: tabs, address bar, profile badge, page. Hidden text only when asked. */
export function BrowserFrame({ scene, showHidden }: { scene: BrowserScene; showHidden: boolean }) {
  const { ui, t } = useLang();
  const last = scene.tabs.length - 1;
  return (
    <div className={styles.frame}>
      <div className={styles.tabs} aria-hidden="true">
        {scene.tabs.map((tab, i) => (
          <span key={i} className={i === last ? styles.tabActive : styles.tab}>
            {t(tab)}
          </span>
        ))}
      </div>
      <div className={styles.bar}>
        <span className={styles.url}>{scene.url}</span>
        <span className={styles.profile}>
          <span className={styles.srOnly}>{ui.profileBadge}: </span>
          {t(scene.profile)}
        </span>
      </div>
      <div className={styles.page}>
        <h3 className={styles.title}>{t(scene.page.title)}</h3>
        <p className={styles.body}>{t(scene.page.body)}</p>
        {showHidden && scene.page.hidden && <div className={styles.hidden}>{t(scene.page.hidden)}</div>}
      </div>
    </div>
  );
}
