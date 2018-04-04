(function() {
  let $urlToShorten = $('#url-to-shorten');
  $urlToShorten.on('keyup', handleKeyUp);

  let $shortcodeToUse = $('#shortcode-to-use');
  $shortcodeToUse.on('keyup', handleKeyUp);

  let $alias = $('#alias');
  $alias.on('blur', saveSettings);

  let $event = $('#event');
  $event.on('blur', saveSettings);

  let $channel = $('#channel');
  $channel.on('blur', saveSettings);

  let $shortenedLink = $('#shortenedLink');
  // let $longLink = $('#longLink');

  let $successMessage = $('#successMessage');

  let $shortenButton = $('#shortenButton');
  $shortenButton.on('click', shortenURL);

  let $shortener = $('#shortener');

  getSettings();

  function handleKeyUp(e) {
    if (e.which === 13) {
      shortenURL();
    }
  }

  function shortenURL() {
    toggleButtonState();
    let baseUrl = $urlToShorten.val();
    let separator = baseUrl.indexOf('?') > 0 ? '&' : '?';

    let hash = '';
    let hasHash = baseUrl.indexOf('#');
    if (hasHash != -1) {
      hash = baseUrl.substr(hasHash);
      baseUrl = baseUrl.replace(hash, '');
    }

    let tracker = ($event.val() && $channel.val() && $alias.val()) ? 
                    `WT.mc_id=${$event.val()}-${$channel.val()}-${$alias.val()}` : "";

    let fullURL = `${baseUrl}${separator}${tracker}${hash}`;

    let shortCode = $shortcodeToUse.val();

    fetch('http://java.ms/shrink', {
      method: 'POST',
      headers: {
        Accept: 'text/plain',
        'Content-type': 'application/json',
        url: fullURL,
        shortcode: shortCode
      }
    })
    .then(response => response.json())
    .then(json => {
      $successMessage.el.innerHTML = "<strong>Success!</strong> URL is:";

      $shortenedLink.el.href = json.url;
      $shortenedLink.html(json.url);

      // save settings
      saveSettings();

      // copy the URL to clipboard
      $urlToShorten.val(json.url);

      $urlToShorten.el.focus();
      $urlToShorten.el.select();

      document.execCommand('copy');
      toggleButtonState();
    })
    .catch(function (error) {
      console.log('Request failed', error);
      toggleButtonState();
    });
  }

  function getSettings() {
    chrome.storage.sync.get(['alias', 'channel', 'event', 'shortenedLink', 'shortenedLinkHref'], result => {
      $alias.val(result.alias || '');
      $event.val(result.event || '');
      $channel.val(result.channel || '');
      $shortenedLink.html(result.shortenedLink || '');
      $shortenedLink.el.href = `http://${result.shortenedLink}` || '';
      // $longLink.html(result.longLink || '');

      if ($alias.val() !== '') {
        $shortener.show();
      }
    });

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      $urlToShorten.val(tabs[0].url);
    });
  }

  function saveSettings(alias, event, channel, shortenedLink) {
    chrome.storage.sync.set({
      alias: $alias.val().trim() || '',
      event: $event.val().trim() || '',
      channel: $channel.val().trim() || '',
      shortenedLink: $shortenedLink.html() || ''
    });
  }

  function toggleButtonState() {
    $shortenButton.el.disabled = !$shortenButton.el.disabled;
    if ($shortenButton.el.disabled) {
      $shortenButton.el.innerText = "Shortening...";
    } else {
      $shortenButton.el.innerText = "Shorten";
    }
  }
})();
