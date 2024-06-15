import { shortcuts } from '$lib/actions/shortcut';
import { tick } from 'svelte';
import type { Action } from 'svelte/action';

interface Options {
  /**
   * The container element that with direct children that should be navigated.
   */
  container: HTMLElement;
  /**
   * The id of the currently selected element.
   */
  selectedId: string | undefined;
  /**
   * A class name to add to the selected element, if any.
   */
  selectedClass?: string;
  /**
   * A function that is called when the selection changes.
   */
  selectionChanged: (node: HTMLElement | undefined, index: number | undefined) => void;
  /**
   * A function that is called when the dropdown should be opened.
   */
  openDropdown?: (event: KeyboardEvent) => void;
  /**
   * A function that is called when the dropdown should be closed.
   */
  closeDropdown: () => void;
  /**
   * Override the default behavior for the escape key.
   */
  onEscape?: (event: KeyboardEvent) => void;
}

export const contextMenuNavigation: Action<HTMLElement, Options> = (node, options: Options) => {
  const getCurrentElement = () => {
    const { container, selectedId: activeId } = options;
    return container?.querySelector(`#${activeId}`) as HTMLElement | undefined;
  };

  const close = () => {
    const { closeDropdown, selectionChanged } = options;
    selectionChanged(undefined, undefined);
    closeDropdown();
  };

  const moveSelection = async (direction: 'up' | 'down', event: KeyboardEvent) => {
    const { selectionChanged, container, openDropdown } = options;
    if (openDropdown) {
      openDropdown(event);
      await tick();
    }

    const children = Array.from(container?.children).filter((child) => child.tagName !== 'HR') as HTMLElement[];
    if (children.length === 0) {
      return;
    }

    const currentEl = getCurrentElement();
    const currentIndex = currentEl ? children.indexOf(currentEl) : -1;
    const directionFactor = (direction === 'up' ? -1 : 1) + (direction === 'up' && currentIndex === -1 ? 1 : 0);
    const newIndex = (currentIndex + directionFactor + children.length) % children.length;

    selectionChanged(children[newIndex], newIndex);
  };

  const onEscape = (event: KeyboardEvent) => {
    const { onEscape } = options;
    if (onEscape) {
      onEscape(event);
      return;
    }
    event.stopPropagation();
    close();
  };

  const handleClick = (event: KeyboardEvent) => {
    const { selectedId } = options;
    if (!selectedId) {
      void moveSelection('down', event);
      return;
    }
    const currentEl = getCurrentElement();
    currentEl?.click();
  };

  const { destroy } = shortcuts(node, [
    { shortcut: { key: 'ArrowUp' }, onShortcut: (event) => moveSelection('up', event) },
    { shortcut: { key: 'ArrowDown' }, onShortcut: (event) => moveSelection('down', event) },
    { shortcut: { key: 'Escape' }, onShortcut: (event) => onEscape(event) },
    { shortcut: { key: ' ' }, onShortcut: (event) => handleClick(event) },
    { shortcut: { key: 'Enter' }, onShortcut: (event) => handleClick(event) },
  ]);

  return {
    update(newOptions) {
      options = newOptions;
    },
    destroy,
  };
};
