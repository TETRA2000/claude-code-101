import { useEffect, useMemo, useReducer } from 'react';
import { content as defaultContent, type Content } from './content';
import { LangProvider, useLang } from './i18n/LangContext';
import type { Lang } from './i18n/lang';
import { Quiz } from './quiz/Quiz';
import { Home } from './screens/Home';
import { appReducer, initState } from './state/app';
import { localProgressStore, type ProgressStore } from './storage/progress';

interface Props {
  store?: ProgressStore;
  content?: Content;
  languages?: readonly string[];
}

const defaultStore = localProgressStore();
const browserLanguages = (): readonly string[] =>
  typeof navigator === 'undefined' ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language]).filter(Boolean);

export function App({ store = defaultStore, content = defaultContent, languages }: Props) {
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
      {state.screen.name === 'practice' && (
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
      {/* The learn screen is added in Task 13. */}
    </LangProvider>
  );
}

function Title() {
  const { ui } = useLang();
  useEffect(() => {
    document.title = ui.appTitle;
  }, [ui.appTitle]);
  return null;
}
