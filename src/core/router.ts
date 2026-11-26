// Tiny hash router (works on GitHub Pages without server rewrites).
import { useEffect, useState } from 'react'

export type TopRoute = 'home' | 'cards' | 'vault' | 'money' | 'more' | 'tools' | 'help' | 'settings'

function parse(): string[] {
  const h = location.hash.replace(/^#\/?/, '')
  return h ? h.split('/').map(decodeURIComponent) : ['home']
}

/** `segments[0]` is the top route; feature screens may use deeper segments (e.g. #/tools/emi). */
export function useRoute(): { segments: string[]; go: (path: string) => void } {
  const [segments, setSegments] = useState<string[]>(parse)
  useEffect(() => {
    const on = () => setSegments(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return { segments, go }
}

export function go(path: string) {
  location.hash = '/' + path.replace(/^[#/]+/, '')
}
