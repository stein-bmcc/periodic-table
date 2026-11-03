const cards = [...document.querySelectorAll("#elements > li")];
const filters = document.querySelector(".filters");
const filterButtons = [...filters.querySelectorAll("[data-filter]")];
const count = document.querySelector("#results-count");
const definitions = document.querySelector("#definitions");
const codeSources = new WeakMap();

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  const filter = button.dataset.filter;
  for (const card of cards) {
    card.hidden =
      filter !== "all" && !card.dataset.filters.split(" ").includes(filter);
  }
  for (const control of filterButtons)
    control.setAttribute("aria-pressed", String(control === button));
  const visible = cards.filter((card) => !card.hidden).length;
  count.textContent = `${visible} of ${cards.length} entries · ${button.textContent.trim()}`;
});
filters.hidden = false;

for (const example of document.querySelectorAll(".example")) {
  const code = example.querySelector("code");
  codeSources.set(code, code.textContent);
  example.querySelector(".example-tools").hidden = false;
}

document.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy]");
  if (!copyButton) return;
  const example = copyButton.closest(".example");
  const code = example.querySelector("code");
  const source = codeSources.get(code);
  if (copyButton) {
    const status = example.querySelector(".copy-status");
    status.textContent = "";
    try {
      await navigator.clipboard.writeText(source);
      status.textContent = "Code copied.";
    } catch {
      status.textContent =
        "Copy unavailable. Select the code and copy it manually.";
    }
  }
});

// Until modal support is ready, definitions remain ordinary fragment destinations.
if (
  typeof HTMLDialogElement !== "undefined" &&
  "showModal" in HTMLDialogElement.prototype
) {
  const dialog = document.createElement("dialog");
  dialog.id = "element-dialog";
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "dialog-close";
  closeButton.textContent = "Close";
  closeButton.setAttribute("aria-label", "Close definition");
  closeButton.autofocus = true;
  dialog.append(closeButton);
  document.body.append(dialog);
  let current = null;

  function openDefinition(definition, opener) {
    if (!definition?.classList.contains("definition") || dialog.open) return;
    current = { definition, opener, next: definition.nextSibling };
    dialog.setAttribute("aria-labelledby", `${definition.id}-title`);
    dialog.append(definition);
    const code = definition.querySelector("code.language-markup");
    window.Prism?.highlightElement(code);
    dialog.showModal();
  }

  closeButton.addEventListener("click", () => dialog.close());
  // Keep Tab within the definition, including at the browser-chrome boundary.
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey)
      return;
    const controls = [
      ...dialog.querySelectorAll("button, a[href], [tabindex]"),
    ].filter((control) => !control.disabled && control.checkVisibility());
    const index = controls.indexOf(document.activeElement);
    const next =
      index < 0
        ? event.shiftKey
          ? controls.length - 1
          : 0
        : (index + (event.shiftKey ? -1 : 1) + controls.length) %
          controls.length;
    event.preventDefault();
    controls[next].focus();
  });
  dialog.addEventListener("close", () => {
    if (!current) return;
    const { definition, opener, next } = current;
    definitions.insertBefore(definition, next);
    if (location.hash === `#${definition.id}`)
      history.replaceState(
        history.state,
        "",
        location.pathname + location.search,
      );
    current = null;
    const fallback = filters.querySelector('[aria-pressed="true"]');
    (opener?.checkVisibility() ? opener : fallback).focus({
      preventScroll: true,
    });
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-definition]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    openDefinition(document.getElementById(link.dataset.definition), link);
  });

  function openHashDefinition() {
    const id = location.hash.slice(1);
    const definition = document.getElementById(id);
    const opener = document.querySelector(
      `a[data-definition="${CSS.escape(id)}"]`,
    );
    openDefinition(definition, opener);
  }

  definitions.hidden = true;
  window.addEventListener("hashchange", openHashDefinition);
  openHashDefinition();
}
