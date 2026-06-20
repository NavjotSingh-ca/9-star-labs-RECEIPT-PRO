import type { Meta, StoryObj } from '@storybook/nextjs';
import { Select } from './select';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Native `<select>` element with design system styling and a chevron-down icon. Supports all native select states.' } },
  },
  argTypes: {
    disabled: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    children: (
      <>
        <option value="">Select a category</option>
        <option value="office">Office Supplies</option>
        <option value="travel">Travel</option>
        <option value="software">Software</option>
        <option value="meals">Meals & Entertainment</option>
      </>
    ),
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'travel',
    children: (
      <>
        <option value="office">Office Supplies</option>
        <option value="travel">Travel</option>
        <option value="software">Software</option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <option value="">Disabled select</option>
        <option value="1">Option 1</option>
      </>
    ),
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Select>
        <option value="">Default select</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
      <Select defaultValue="2">
        <option value="1">Option 1</option>
        <option value="2">Option 2 (selected)</option>
        <option value="3">Option 3</option>
      </Select>
      <Select disabled>
        <option value="">Disabled</option>
      </Select>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="max-w-sm rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="story-category" className="text-xs font-semibold uppercase tracking-wide text-text-muted">Category</label>
          <Select id="story-category" defaultValue="software">
            <option value="office">Office Supplies</option>
            <option value="travel">Travel</option>
            <option value="software">Software</option>
            <option value="meals">Meals & Entertainment</option>
          </Select>
        </div>
      </div>
    </div>
  ),
};
