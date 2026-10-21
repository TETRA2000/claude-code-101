import { useEffect } from 'react';
import styles from './App.module.css';

// Placeholder shell. Task 12 widens this to accept a ProgressStore and routes screens.
export function App() {
  useEffect(() => {
    document.title = 'Claude Code 101';
  }, []);
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Claude Code 101</h1>
    </main>
  );
}
