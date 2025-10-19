function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    callback();
  }
}

fetch('/assets/js/json/error.json')
  .then(res => {
    if (!res.ok) {
      throw new Error('randoText404: failed to load error.json');
    }
    return res.json();
  })
  .then(json => {
    if (!Array.isArray(json) || json.length === 0) {
      console.warn('randoText404: error.json is empty or invalid');
      return;
    }

    const quote = json[Math.floor(Math.random() * json.length)];

    onReady(() => {
      const target = document.getElementById('errortext');
      if (!target) {
        console.warn('randoText404: element with id "errortext" not found');
        return;
      }
      target.textContent = `"${quote}"`;
    });
  })
  .catch(error => {
    console.error(error);
  });