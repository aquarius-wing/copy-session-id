import { test, expect } from 'claude-code/testing'

const BAND_PROPS = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`keeps what the mods beneath draw and adds the button (${surface})`, async ($, on) => {
    const copied: { text: string; surface?: string }[] = []
    const toasts: string[] = []
    on('session.id', () => ({ value: 'sess-band' }))
    on('ui.copy', (_$, e) => {
      copied.push({ text: e.text, surface: e.surface })
      return { value: { isCopied: true } }
    })
    on('ui.toast', (_$, e) => {
      toasts.push(String(e.text))
      return { value: undefined }
    })
    // Stands in for another band mod that runs after this one
    on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
      const { Text } = $.ui.resolve(e)
      return Text({ children: ['☀ Clear 18% of context'] })
    })

    const band = await $.ui.mount({
      plugin: 'copy-session-id',
      surface,
      component: 'AbovePrompt',
      props: BAND_PROPS,
    })

    expect(await band.find({ type: 'Text', text: /Clear 18%/ })).toBeDefined()
    expect(await band.find({ type: 'Button', text: 'Copy Session ID' })).toBeDefined()
    await band.press({ key: 'copy-session-id-band' })
    expect(copied).toEqual([{ text: 'sess-band', surface }])
    expect(toasts[0]).toContain('sess-band')
  })
}

test('shows the ID in the toast when the clipboard write fails', async ($, on) => {
  const toasts: string[] = []
  on('session.id', () => ({ value: 'sess-fail' }))
  on('ui.copy', () => ({ value: { isCopied: false, reason: 'no-clipboard' } }))
  on('ui.toast', (_$, e) => {
    toasts.push(String(e.text))
    return { value: undefined }
  })
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return Text({ children: ['weather'] })
  })

  const band = await $.ui.mount({
    plugin: 'copy-session-id',
    surface: 'desktop',
    component: 'AbovePrompt',
    props: BAND_PROPS,
  })
  await band.press({ key: 'copy-session-id-band' })

  expect(toasts[0]).toContain('sess-fail')
  expect(toasts[0]).toContain('no-clipboard')
})

test('leaves the band alone while a survey holds it', async ($, on) => {
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return Text({ children: ['survey'] })
  })

  const band = await $.ui.mount({
    plugin: 'copy-session-id',
    surface: 'desktop',
    component: 'AbovePrompt',
    props: { ...BAND_PROPS, hasSurvey: true },
  })

  expect(await band.find({ type: 'Text', text: 'survey' })).toBeDefined()
  expect(await band.find({ type: 'Button', text: 'Copy Session ID' })).toBeUndefined()
})
