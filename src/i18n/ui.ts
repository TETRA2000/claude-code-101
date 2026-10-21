import type { Lang } from './lang';

export interface UiStrings {
  appTitle: string;
  heroTitle: string;
  heroBody: string;
  theCourse: string;
  upNext: string;
  continue: string;
  check: string;
  next: string;
  back: string;
  quit: string;
  learn: string;
  practice: string;
  practiceThis: string;
  done: string;
  suggested: string;
  comingSoon: string;
  lastChecked(date: string): string;
  xp(n: number): string;
  heartsLeft(n: number): string;
  praise: string[];
  notQuite: string;
  breaking: string;
  decodeHint(cost: number): string;
  piecesTitle: string;
  asYouSee: string;
  asClaudeSees: string;
  showHidden: string;
  hideHidden: string;
  firstStepToDeny: string;
  yourTask: string;
  approveYes: string;
  /** Generic fallback label; real items supply their own `alwaysLabel`. */
  approveAlways: string;
  approveNo: string;
  outTitle: string;
  outBody: string;
  tryAgain: string;
  doneTitle: string;
  accuracy(n: number): string;
  language: string;
  moveUp: string;
  moveDown: string;
}

/** Keys whose Japanese value is intentionally identical to English. */
export const SAME_IN_BOTH: ReadonlySet<string> = new Set(['appTitle', 'xp']);

const en: UiStrings = {
  appTitle: 'Claude Code 101',
  heroTitle: 'Work with an AI agent, without getting burned.',
  heroBody:
    'Claude Code runs commands on your computer, reads your files, and drives your browser, Notion and Figma. Learn what happens behind the scenes, so you can spot the dangerous "yes" before you press it.',
  theCourse: 'The course',
  upNext: 'Up next',
  continue: 'Continue',
  check: 'Check',
  next: 'Next',
  back: 'Back',
  quit: 'Quit',
  learn: 'Learn',
  practice: 'Practice',
  practiceThis: 'Practice this',
  done: 'Done',
  suggested: 'Suggested',
  comingSoon: 'Coming soon',
  lastChecked: (date) => `Last checked ${date}`,
  xp: (n) => `${n} XP`,
  heartsLeft: (n) => `${n} ${n === 1 ? 'heart' : 'hearts'} left`,
  praise: ['Nice!', 'Exactly right.', 'You got it.', 'Sharp eyes.'],
  notQuite: 'Not quite',
  breaking: 'Breaking it down',
  decodeHint: (cost) => `Decode it (-${cost} XP)`,
  piecesTitle: 'The pieces',
  asYouSee: 'As you see it',
  asClaudeSees: 'As Claude sees it',
  showHidden: 'Show hidden text',
  hideHidden: 'Hide hidden text',
  firstStepToDeny: 'First step: deny the request',
  yourTask: 'Your task',
  approveYes: 'Yes',
  approveAlways: 'Yes, always',
  approveNo: 'No',
  outTitle: 'Out of hearts',
  outBody: 'You ran out of hearts. Take another look at the Learn cards, then try again.',
  tryAgain: 'Try again',
  doneTitle: 'Practice complete',
  accuracy: (n) => `${n}% accuracy`,
  language: 'Language',
  moveUp: 'Move up',
  moveDown: 'Move down',
};

const ja: UiStrings = {
  appTitle: 'Claude Code 101',
  heroTitle: 'AIエージェントを、安全に使いこなす。',
  heroBody:
    'Claude Code はあなたのパソコンでコマンドを実行し、ファイルを読み、ブラウザやNotion、Figmaを操作します。裏側で何が起きているかを知り、危険な「はい」を見抜けるようになりましょう。',
  theCourse: 'コース',
  upNext: '次はここから',
  continue: 'つづける',
  check: '答え合わせ',
  next: '次へ',
  back: '戻る',
  quit: 'やめる',
  learn: '学ぶ',
  practice: '練習',
  practiceThis: 'このユニットを練習',
  done: '完了',
  suggested: 'おすすめ',
  comingSoon: '近日公開',
  lastChecked: (date) => `最終確認日 ${date}`,
  xp: (n) => `${n} XP`,
  heartsLeft: (n) => `ハート残り${n}個`,
  praise: ['いいね！', 'その通りです。', 'できました！', '鋭いですね。'],
  notQuite: '惜しい！',
  breaking: '分解して見てみよう',
  decodeHint: (cost) => `読み解く（-${cost} XP）`,
  piecesTitle: '各パーツの意味',
  asYouSee: 'あなたに見える姿',
  asClaudeSees: 'Claude に見える姿',
  showHidden: '隠れたテキストを表示',
  hideHidden: '隠れたテキストを隠す',
  firstStepToDeny: 'まずは要求を拒否しよう',
  yourTask: 'あなたの課題',
  approveYes: 'はい',
  approveAlways: '常に許可',
  approveNo: 'いいえ',
  outTitle: 'ハートがなくなりました',
  outBody: 'ハートを使い切りました。学ぶカードをもう一度見直してから、再挑戦しましょう。',
  tryAgain: 'もう一度',
  doneTitle: '練習完了',
  accuracy: (n) => `正答率 ${n}%`,
  language: '言語',
  moveUp: '上へ移動',
  moveDown: '下へ移動',
};

export const UI: Record<Lang, UiStrings> = { en, ja };
