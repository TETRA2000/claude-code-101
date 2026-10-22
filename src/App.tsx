import { useEffect, useMemo, useReducer, type Dispatch } from 'react';
import { content as defaultContent, type Content } from './content';
import { LangProvider, useLang } from './i18n/LangContext';
import type { Lang } from './i18n/lang';
import { Boss } from './quiz/Boss';
import { Quiz } from './quiz/Quiz';
import { Home } from './screens/Home';
import { Learn } from './screens/Learn';
import { appReducer, initState, type Action } from './state/app';
import { localProgressStore, type ProgressStore } from './storage/progress';

interface Props {
  store?: ProgressStore;
  content?: Content;
  languages?: readonly string[];
  /** Boss run length in seconds; defaults to the dev/test-only `?bossSeconds=` param, else BOSS_SECONDS. */
  bossSeconds?: number;
}

const defaultStore = localProgressStore();
const browserLanguages = (): readonly string[] =>
  typeof navigator === 'undefined' ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language]).filter(Boolean);

/**
 * `?bossSeconds=N` shortens the boss run for e2e tests. It is read only outside production builds,
 * so the shipped site always runs for BOSS_SECONDS.
 */
function testBossSeconds(): number | undefined {
  if (import.meta.env.MODE === 'production' || typeof location === 'undefined') return undefined;
  const n = Number(new URLSearchParams(location.search).get('bossSeconds'));
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function App({ store = defaultStore, content = defaultContent, languages, bossSeconds = testBossSeconds() }: Props) {
  const reducer = useMemo(() => appReducer(content), [content]);
  const [state, dispatch] = useReducer(reducer, undefined, () => initState(store.load(), languages ?? browserLanguages()));

  useEffect(() => {
    store.save(state.progress);
  }, [store, state.progress]);

  useEffect(() => {
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  return (
    <LangProvider lang={state.lang}>
      <Title />
      {state.screen.name === 'home' && <Home content={content} state={state} dispatch={dispatch} />}
      {state.screen.name === 'practice' && content.unitByKey(state.screen.unitKey)?.mode === 'boss' && (
        <Boss
          key={state.screen.unitKey}
          unitKey={state.screen.unitKey}
          title={content.unitByKey(state.screen.unitKey)!.title}
          items={content.bodyOf(state.screen.unitKey)?.items ?? []}
          seconds={bossSeconds}
          onExit={() => dispatch({ type: 'goHome' })}
          onComplete={(r) => dispatch({ type: 'completePractice', unitKey: r.unitKey, xp: r.xp })}
          onLang={(lang: Lang) => dispatch({ type: 'setLang', lang })}
          unitTitle={(key) => content.unitByKey(key)?.title}
        />
      )}
      {state.screen.name === 'practice' && content.unitByKey(state.screen.unitKey)?.mode !== 'boss' && (
        <Quiz
          key={state.screen.unitKey}
          unitKey={state.screen.unitKey}
          items={content.bodyOf(state.screen.unitKey)?.items ?? []}
          content={content}
          onExit={() => dispatch({ type: 'goHome' })}
          onComplete={(r) => dispatch({ type: 'completePractice', unitKey: r.unitKey, xp: r.xp })}
          onLang={(lang: Lang) => dispatch({ type: 'setLang', lang })}
        />
      )}
      {state.screen.name === 'learn' && <LearnScreen content={content} screen={state.screen} dispatch={dispatch} />}
    </LangProvider>
  );
}

function LearnScreen({ content, screen, dispatch }: { content: Content; screen: { unitKey: string; card: number }; dispatch: Dispatch<Action> }) {
  const unit = content.unitByKey(screen.unitKey);
  const cards = content.bodyOf(screen.unitKey)?.cards ?? [];
  if (!unit) return null;
  return <Learn unit={unit} cards={cards} card={screen.card} dispatch={dispatch} />;
}

function Title() {
  const { ui } = useLang();
  useEffect(() => {
    document.title = ui.appTitle;
  }, [ui.appTitle]);
  return null;
}
