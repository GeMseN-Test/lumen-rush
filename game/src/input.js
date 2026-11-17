// input.js — keyboard + mouse input for Lumen Rush.
// The game reads this object every frame; it never reads events
// directly, which keeps the loop testable and the shot renders clean.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 640,
    mouseY: 360,
    mouseActive: false,
    mouseDown: false,
    // Edge-triggered actions, consumed by main.js each frame.
    pressed: new Set(),
    clicked: false,
  };

  function keyName(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener("keydown", (e) => {
    const k = keyName(e);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (!e.repeat) input.pressed.add(k);
    input.keys.add(k);
  });
  window.addEventListener("keyup", (e) => {
    input.keys.delete(keyName(e));
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.mouseActive = true;
  });
  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    input.mouseDown = true;
    input.clicked = true;
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.mouseActive = true;
  });
  window.addEventListener("mouseup", () => {
    input.mouseDown = false;
  });

  input.isDown = (k) => input.keys.has(k);
  input.wasPressed = (k) => input.pressed.has(k);
  input.axisX = () => {
    let x = 0;
    if (input.keys.has("ArrowLeft") || input.keys.has("a")) x -= 1;
    if (input.keys.has("ArrowRight") || input.keys.has("d")) x += 1;
    return x;
  };
  input.axisY = () => {
    let y = 0;
    if (input.keys.has("ArrowUp") || input.keys.has("w")) y -= 1;
    if (input.keys.has("ArrowDown") || input.keys.has("s")) y += 1;
    return y;
  };
  // Call at the end of every frame so one press fires exactly once.
  input.endFrame = () => {
    input.pressed.clear();
    input.clicked = false;
  };

  return input;
}
