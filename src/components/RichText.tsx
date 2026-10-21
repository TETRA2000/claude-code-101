import styles from './RichText.module.css';

/** Split prose on backticks: odd segments are inline code. Empty segments are dropped. */
function splitInlineCode(text: string): { text: string; code: boolean }[] {
  return text
    .split('`')
    .map((t, i) => ({ text: t, code: i % 2 === 1 }))
    .filter((p) => p.text);
}

/** Prose where `backtick` segments render as inline code. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitInlineCode(text).map((p, i) =>
        p.code ? (
          <code key={i} className={styles.code}>
            {p.text}
          </code>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
