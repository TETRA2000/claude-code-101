import type { ReactElement } from 'react';
import type { Item } from '../../content/types';
import { Approve, type RendererProps } from './Approve';
import { Chain } from './Chain';
import { AutoMode } from './AutoMode';
import { Choice } from './Choice';
import { HiddenDoc } from './HiddenDoc';
import { OrderList } from './OrderList';
import { PairBoard } from './PairBoard';
import { Precedence } from './Precedence';
import { RuleBuilder } from './RuleBuilder';
import { SettingsFile } from './SettingsFile';

/** Picks the renderer for an item. Exhaustive: a new item type fails tsc here. */
export function ItemBody(p: RendererProps<Item>): ReactElement {
  const { item, answer, act } = p;
  switch (item.type) {
    case 'approve':
      return <Approve item={item} answer={answer} act={act} />;
    case 'predict':
    case 'setup':
    case 'combo':
      return <Choice item={item} answer={answer} act={act} />;
    case 'pairs':
    case 'decode':
      return <PairBoard item={item} answer={answer} act={act} />;
    case 'order':
      return <OrderList item={item} answer={answer} act={act} />;
    case 'hidden':
      return <HiddenDoc item={item} answer={answer} act={act} />;
    case 'chain':
      return <Chain item={item} answer={answer} act={act} />;
    case 'rule':
      return <RuleBuilder item={item} answer={answer} act={act} />;
    case 'settings':
    case 'review':
    case 'trim':
      return <SettingsFile item={item} answer={answer} act={act} />;
    case 'precedence':
      return <Precedence item={item} answer={answer} act={act} />;
    case 'automode':
      return <AutoMode item={item} answer={answer} act={act} />;
  }
}
