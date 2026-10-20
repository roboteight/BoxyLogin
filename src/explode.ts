import confetti from 'canvas-confetti';

const GREYS = ['#1f1f1f', '#3d3d3d', '#5c5c5c', '#808080', '#a3a3a3', '#c8c8c8'];

/** Where the caret sits on screen, so a burst appears to come from the character just typed. */
function caretPoint(input: HTMLInputElement) {
  const rect = input.getBoundingClientRect();
  const style = getComputedStyle(input);
  const context = document.createElement('canvas').getContext('2d');
  if (context) context.font = `${style.fontSize} ${style.fontFamily}`;
  // a password shows bullets, so measure those rather than the secret
  const typed = input.value.slice(0, input.selectionStart ?? input.value.length);
  const width = context?.measureText(input.type === 'password' ? '•'.repeat(typed.length) : typed).width ?? 0;
  const x = rect.left + parseFloat(style.paddingLeft) + width - input.scrollLeft;
  return { x: Math.min(x, rect.right) / innerWidth, y: (rect.top + rect.height / 2) / innerHeight };
}

/**
 * Bursts grey particles from the caret. The typed character itself explodes, except in a password field,
 * where plain flecks stand in so the secret is never drawn.
 */
export function explode(input: HTMLInputElement, character: string) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const showCharacter = input.type !== 'password' && character.trim() !== '';
  confetti({
    particleCount: 14,
    spread: 360,
    startVelocity: 14,
    gravity: 0.7,
    ticks: 60,
    origin: caretPoint(input),
    colors: GREYS,
    shapes: showCharacter
      ? GREYS.map((color) =>
          confetti.shapeFromText({ text: character, color, scalar: 2, fontFamily: getComputedStyle(input).fontFamily }),
        )
      : ['square', 'circle'],
    disableForReducedMotion: true,
  });
}
