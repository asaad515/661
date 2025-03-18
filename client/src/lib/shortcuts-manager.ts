import hotkeys, { KeyHandler } from 'hotkeys-js';

interface ShortcutConfig {
  key: string;
  description: string;
  group?: string;
  handler: KeyHandler;
  scope?: string;
}

interface ShortcutGroup {
  name: string;
  shortcuts: ShortcutConfig[];
}

export class ShortcutsManager {
  private static instance: ShortcutsManager;
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private groups: Map<string, string[]> = new Map();

  private constructor() {
    // تعطيل الاختصارات الافتراضية في بعض العناصر
    hotkeys.filter = (event) => {
      const target = event.target as HTMLElement;
      const { tagName } = target;
      
      return !(
        target.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'SELECT' ||
        tagName === 'TEXTAREA'
      );
    };
  }

  static getInstance(): ShortcutsManager {
    if (!ShortcutsManager.instance) {
      ShortcutsManager.instance = new ShortcutsManager();
    }
    return ShortcutsManager.instance;
  }

  register(config: ShortcutConfig): void {
    const { key, handler, scope = 'all' } = config;

    if (this.shortcuts.has(key)) {
      console.warn(`Shortcut ${key} is already registered. It will be overwritten.`);
    }

    this.shortcuts.set(key, config);

    if (config.group) {
      const groupShortcuts = this.groups.get(config.group) || [];
      groupShortcuts.push(key);
      this.groups.set(config.group, groupShortcuts);
    }

    hotkeys(key, { scope }, (event, handler) => {
      event.preventDefault();
      config.handler(event, handler);
    });
  }

  unregister(key: string): void {
    if (this.shortcuts.has(key)) {
      hotkeys.unbind(key);
      this.shortcuts.delete(key);

      // إزالة المفتاح من المجموعات
      for (const [group, shortcuts] of this.groups.entries()) {
        const index = shortcuts.indexOf(key);
        if (index !== -1) {
          shortcuts.splice(index, 1);
          if (shortcuts.length === 0) {
            this.groups.delete(group);
          } else {
            this.groups.set(group, shortcuts);
          }
        }
      }
    }
  }

  setScope(scope: string): void {
    hotkeys.setScope(scope);
  }

  getScope(): string {
    return hotkeys.getScope();
  }

  getShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  getGroups(): ShortcutGroup[] {
    const groups: ShortcutGroup[] = [];
    
    for (const [groupName, shortcutKeys] of this.groups.entries()) {
      const shortcuts = shortcutKeys
        .map(key => this.shortcuts.get(key))
        .filter((s): s is ShortcutConfig => s !== undefined);
      
      groups.push({
        name: groupName,
        shortcuts
      });
    }

    return groups;
  }

  getShortcutsByGroup(group: string): ShortcutConfig[] {
    const shortcutKeys = this.groups.get(group) || [];
    return shortcutKeys
      .map(key => this.shortcuts.get(key))
      .filter((s): s is ShortcutConfig => s !== undefined);
  }

  pauseShortcuts(): void {
    hotkeys.pause();
  }

  unpauseShortcuts(): void {
    hotkeys.unpause();
  }

  clearAll(): void {
    for (const key of this.shortcuts.keys()) {
      this.unregister(key);
    }
    this.groups.clear();
  }
}

// هوك مخصص لاستخدام الاختصارات
export function useShortcuts() {
  const manager = ShortcutsManager.getInstance();

  const registerShortcut = (config: ShortcutConfig) => {
    manager.register(config);
    return () => manager.unregister(config.key);
  };

  return {
    registerShortcut,
    unregisterShortcut: (key: string) => manager.unregister(key),
    setScope: (scope: string) => manager.setScope(scope),
    getScope: () => manager.getScope(),
    getShortcuts: () => manager.getShortcuts(),
    getGroups: () => manager.getGroups(),
    getShortcutsByGroup: (group: string) => manager.getShortcutsByGroup(group),
    pauseShortcuts: () => manager.pauseShortcuts(),
    unpauseShortcuts: () => manager.unpauseShortcuts(),
  };
}