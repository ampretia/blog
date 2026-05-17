window.addEventListener('DOMContentLoaded', function () {
  if (typeof Prism === 'undefined') {
    return;
  }

  Prism.plugins = Prism.plugins || {};
  if (Prism.plugins.autoloader) {
    Prism.plugins.autoloader.languages_path = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/';
  }

  var codeBlocks = document.querySelectorAll('pre > code[class*="language-"], pre > code[class*="lang-"]');
  codeBlocks.forEach(function (code) {
    var pre = code.parentElement;
    if (!pre) return;

    if (!pre.classList.contains('code-block')) {
      pre.classList.add('code-block');
    }

    var language = 'code';
    var className = code.className || pre.className || '';
    var langMatch = className.match(/(?:language-|lang-|lang:)([a-z0-9]+)/i);
    if (langMatch) {
      language = langMatch[1].toLowerCase();
      if (!code.classList.contains('language-' + language)) {
        code.classList.add('language-' + language);
      }
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    var header = document.createElement('div');
    header.className = 'code-block-header';

    var label = document.createElement('span');
    label.className = 'code-block-language';
    label.textContent = language;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-block-copy';
    button.setAttribute('aria-label', 'Copy code');
    button.innerHTML = '<span class="copy-icon" aria-hidden="true"></span>Copy';

    button.addEventListener('click', function () {
      var text = code.textContent;
      if (!text) {
        return;
      }

      navigator.clipboard.writeText(text).then(function () {
        button.textContent = 'Copied';
        setTimeout(function () {
          button.innerHTML = '<span class="copy-icon" aria-hidden="true"></span>Copy';
        }, 1400);
      }).catch(function () {
        button.textContent = 'Copy failed';
        setTimeout(function () {
          button.innerHTML = '<span class="copy-icon" aria-hidden="true"></span>Copy';
        }, 1400);
      });
    });

    header.appendChild(label);
    header.appendChild(button);
    wrapper.insertBefore(header, pre);
  });

  Prism.highlightAll();
});