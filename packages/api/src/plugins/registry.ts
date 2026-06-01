type HookHandler = (params: any) => Promise<any>;

interface Plugin {
  name: string;
  hooks: Record<string, HookHandler>;
}

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, HookHandler[]> = new Map();

  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
    for (const [hook, handler] of Object.entries(plugin.hooks)) {
      if (!this.hooks.has(hook)) this.hooks.set(hook, []);
      this.hooks.get(hook)!.push(handler);
    }
    console.log(`Plugin registered: ${plugin.name}`);
  }

  unregister(name: string) {
    const plugin = this.plugins.get(name);
    if (!plugin) return;
    for (const [hook, handler] of Object.entries(plugin.hooks)) {
      const handlers = this.hooks.get(hook);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      }
    }
    this.plugins.delete(name);
  }

  async runHook(hook: string, params: any): Promise<any> {
    const handlers = this.hooks.get(hook);
    if (!handlers) return params;
    let result = params;
    for (const handler of handlers) {
      result = await handler(result);
    }
    return result;
  }

  getPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}

export const pluginRegistry = new PluginRegistry();

// Built-in: fare calculator plugin
pluginRegistry.register({
  name: 'core-fare',
  hooks: {
    'booking:fare:calculate': async (params: { baseFare: number; seats: number }) => {
      return { ...params, total: params.baseFare * params.seats };
    },
  },
});
