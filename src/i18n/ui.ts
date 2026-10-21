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
  ingredientPrivate: string;
  ingredientUntrusted: string;
  ingredientExit: string;
  asYouSee: string;
  asClaudeSees: string;
  showHidden: string;
  hideHidden: string;
  firstStepToDeny: string;
  yourTask: string;
  viewLabel: string;
  hiddenOrderMark: string;
  notAnOrderMark: string;
  stepsTitle: string;
  denyHereMark: string;
  notThisStepMark: string;
  profileBadge: string;
  blankLine: (n: number) => string;
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
  pairMatched: string;
  pairNoMatch: string;
  feedback: string;
  perfectRun: string;
  retriedNote: string;
  backToHome: string;
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
  ingredientPrivate: 'Private data',
  ingredientUntrusted: 'Untrusted content',
  ingredientExit: 'A way out',
  asYouSee: 'As you see it',
  asClaudeSees: 'As Claude sees it',
  showHidden: 'Show hidden text',
  hideHidden: 'Hide hidden text',
  firstStepToDeny: 'First step: deny the request',
  yourTask: 'Your task',
  viewLabel: 'View',
  hiddenOrderMark: 'Hidden order',
  notAnOrderMark: 'Not an order',
  stepsTitle: 'Claude’s steps · tap the first one to deny',
  denyHereMark: 'Deny here',
  notThisStepMark: 'Not this step',
  profileBadge: 'Profile',
  blankLine: (n) => `Line ${n} (looks blank)`,
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
  pairMatched: 'matched',
  pairNoMatch: 'not a match',
  feedback: 'Feedback',
  perfectRun: 'Perfect run: every answer right on the first try.',
  retriedNote: 'Missed questions came back until you got them. That is the point.',
  backToHome: 'Back to home',
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
  ingredientPrivate: '個人データ',
  ingredientUntrusted: '信頼できない内容',
  ingredientExit: '外への出口',
  asYouSee: 'あなたに見える姿',
  asClaudeSees: 'Claude に見える姿',
  showHidden: '隠れたテキストを表示',
  hideHidden: '隠れたテキストを隠す',
  firstStepToDeny: 'まずは要求を拒否しよう',
  yourTask: 'あなたの課題',
  viewLabel: '表示',
  hiddenOrderMark: '隠れた命令',
  notAnOrderMark: '命令ではない',
  stepsTitle: 'Claude の手順 · 最初に拒否すべきものをタップ',
  denyHereMark: 'ここで拒否',
  notThisStepMark: 'この手順ではない',
  profileBadge: 'プロファイル',
  blankLine: (n) => `${n}行目（空白に見える）`,
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
  pairMatched: '一致',
  pairNoMatch: '一致しません',
  feedback: 'フィードバック',
  perfectRun: 'パーフェクト！すべて一回で正解しました。',
  retriedNote: '間違えた問題は、正解するまで戻ってきます。それが狙いです。',
  backToHome: 'ホームへ戻る',
};

export const UI: Record<Lang, UiStrings> = { en, ja };
