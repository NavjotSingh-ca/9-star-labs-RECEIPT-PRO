import type { Meta, StoryObj } from '@storybook/nextjs';

import { SemanticSearchBar } from './SemanticSearchBar';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof SemanticSearchBar> = {
  title: 'History/SemanticSearchBar',
  component: SemanticSearchBar,
  decorators: [withProviders],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SemanticSearchBar>;

export const Collapsed: Story = {
  args: {
    semanticMode: false,
    semanticLoading: false,
    onToggle: () => {},
    onSearch: () => {},
    onClear: () => {},
  },
};

export const Expanded: Story = {
  args: {
    ...Collapsed.args,
    semanticMode: true,
  },
};

export const Loading: Story = {
  args: {
    ...Collapsed.args,
    semanticMode: true,
    semanticLoading: true,
  },
};
