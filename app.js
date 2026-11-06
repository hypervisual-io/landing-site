// Adds copy buttons to code blocks. The page works without it.
(() => {
  if (!navigator.clipboard) return;

  document.querySelectorAll('pre.code:not(.terminal)').forEach((pre) => {
    const code = pre.querySelector('code');
    if (!code) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Failed';
      }
      setTimeout(() => { button.textContent = 'Copy'; }, 1500);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.replaceWith(wrapper);
    wrapper.append(pre, button);
    pre.classList.add('has-copy');
  });
})();
