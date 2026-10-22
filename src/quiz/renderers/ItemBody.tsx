import type { ReactElement } from 'react';
import type { Item } from '../../content/types';
import { Approve, type RendererProps } from './Approve';
import { Chain } from './Chain';
import { Choice } from './Choice';
import { HiddenDoc } from './HiddenDoc';
import { OrderList } from './OrderList';
import { PairBoard } from './PairBoard';
import { RuleBuilder } from './RuleBuilder';

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
  }
}
