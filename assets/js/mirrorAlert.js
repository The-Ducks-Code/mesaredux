document.addEventListener('DOMContentLoaded', () => {
  const anchor = document.getElementById('mirror-alert');
  if (!anchor) {
    return;
  }

  const mainDomain = 'mesaredux.mesagrey.ca';
  const manifestPath = '/assets/js/json/mirrors.json';
  const fallbackMirrors = [mainDomain];
  const host = window.location.host.toLowerCase();

  if (host === mainDomain) {
    return;
  }

  const renderBanner = (officialHosts) => {
    const isOfficial = officialHosts.has(host);
    const banner = document.createElement('div');
    banner.className = 'mirror-alert__banner';
    banner.style.padding = '0.75rem';
    banner.style.marginBottom = '0.7rem';
    banner.style.borderRadius = '0.5rem';
    banner.style.fontSize = '0.7rem';
    banner.style.lineHeight = '1.4';
    banner.style.border = '1px solid';
    banner.style.backgroundColor = isOfficial ? '#e6f4ea' : '#fef3c7';
    banner.style.borderColor = isOfficial ? '#6abf69' : '#f59e0b';
    banner.style.color = '#1f2933';

    const statusLabel = isOfficial ? 'Official mirror' : 'Unofficial mirror';
    const statusDescription = isOfficial
      ? `You are viewing an official MESλREDUX mirror on ${host || 'localhost'}.`
      : `You are viewing an unofficial MESλREDUX mirror on ${host || 'localhost'}.`;

    banner.innerHTML = `
      <strong>${statusLabel}:</strong> ${statusDescription}<br>
      <span>Try the main domain at <a href="https://${mainDomain}">${mainDomain}</a> if it is not blocked for you.</span>
    `;

    anchor.replaceChildren(banner);
  };

  const normaliseHosts = (entries) => {
    const hosts = new Set(
      entries
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean),
    );
    hosts.add(mainDomain);
    return hosts;
  };

  const loadOfficialHosts = async () => {
    try {
      const response = await fetch(manifestPath, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to load mirrors manifest: ${response.status}`);
      }
      const data = await response.json();
      return normaliseHosts(Array.isArray(data) ? data : fallbackMirrors);
    } catch (error) {
      console.warn('Mirror manifest load failed, using fallback list.', error);
      return normaliseHosts(fallbackMirrors);
    }
  };

  loadOfficialHosts().then(renderBanner);
});
