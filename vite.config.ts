import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHash } from 'node:crypto'

export default defineConfig({
  // Local development only: keep Ollama bound to loopback, with no browser CORS changes.
  server: {
    proxy: {
      '/api/local-chat': {
        target: 'http://127.0.0.1:11434',
        rewrite: () => '/api/chat',
      },
      '/api/local-models': {
        target: 'http://127.0.0.1:11434',
        rewrite: () => '/api/tags',
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'offline-core-lesson-manifest',
      generateBundle(_options, bundle) {
        const assets = new Set<string>(['/index.html', '/favicon.svg'])
        const visit = (name: string) => {
          if (assets.has('/' + name)) return
          const item = bundle[name]
          if (!item) return
          assets.add('/' + name)
          if (item.type === 'chunk') item.imports.forEach(visit)
        }
        // Save the shell and lightweight routes. AI runtimes stay optional.
        for (const [name, item] of Object.entries(bundle)) {
          if (item.type === 'chunk' && (item.isEntry || /[/\\]views[/\\][^/\\]+\.tsx$|[/\\]home[/\\](?:HomePage|FieldHome)\.tsx$/.test(item.facadeModuleId ?? ''))) visit(name)
          if (name.endsWith('.css')) assets.add('/' + name)
        }
        const list = [...assets].sort()
        const version = createHash('sha256').update(list.join('\n')).digest('hex').slice(0, 16)
        this.emitFile({ type: 'asset', fileName: 'lesson-assets.json', source: JSON.stringify({ version, assets: list }) })
      },
    },
  ],
})
