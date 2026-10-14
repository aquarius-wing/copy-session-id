import type { EngineInterface, Register, RenderSurface } from 'claude-code'

async function copyId($: EngineInterface, surface: RenderSurface) {
  const id = await $.session.id()
  const copied = await $.ui.copy({ text: id, surface })
  $.ui.toast(copied.isCopied ? `Copied session ID: ${id}` : `Session ID: ${id} (not copied: ${copied.reason})`)
}

export const register: Register = on => {
  // The band above the prompt is shared by every mod that draws there. Keep what
  // the mods after this one draw, then add the button beside it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // A survey holds the band: leave it alone.
    if (e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Button } = $.ui.resolve(e)
    const theirs = await next(e)

    return (
      <Box flexDirection="row" columnGap={2} alignItems="center">
        {theirs}
        <Button
          key="copy-session-id-band"
          label="Copy Session ID"
          plain
          dimColor
          onPress={press => copyId($, press.surface)}
        />
      </Box>
    )
  })
}
