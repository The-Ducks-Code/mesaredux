/*
 * Lightweight loader that retries resource URLs until one succeeds.
 * Keeps logic generic so future assets can reuse the same fallback behaviour.
 */
(function (global) {
    'use strict';

    if (!global || !global.document) {
        return;
    }

    var doc = global.document;
    var DEFAULT_TIMEOUT = 8000;

    function toArray(value) {
        if (!value) {
            return [];
        }
        return Array.isArray(value) ? value.slice() : [value];
    }

    function gatherSources(config) {
        var sources = [];

        function add(url) {
            if (url && sources.indexOf(url) === -1) {
                sources.push(url);
            }
        }

        add(config.url);
        add(config.primary);
        add(config.source);

        toArray(config.sources).forEach(add);
        toArray(config.fallback).forEach(add);
        toArray(config.fallbacks).forEach(add);
        toArray(config.alternates).forEach(add);

        return sources;
    }

    function applyAttributes(element, attrs, urlProp) {
        if (!attrs) {
            return;
        }

        Object.keys(attrs).forEach(function (key) {
            if (key === urlProp) {
                return;
            }

            var value = attrs[key];
            if (value === undefined || value === null) {
                return;
            }

            if (key in element) {
                element[key] = value;
            } else {
                element.setAttribute(key, value);
            }
        });
    }

    function ensureTarget(target) {
        if (target) {
            return target;
        }
        if (doc.head) {
            return doc.head;
        }
        if (doc.body) {
            return doc.body;
        }
        return doc.documentElement;
    }

    function load(config) {
        if (!config || !config.type) {
            throw new Error('ResourceFallback.load requires both config and config.type.');
        }

        var type = config.type;
        var sources = gatherSources(config);
        if (!sources.length) {
            return Promise.reject(new Error('ResourceFallback: no sources supplied.'));
        }

        var target = ensureTarget(config.target);
        var timeout = typeof config.timeout === 'number' ? config.timeout : DEFAULT_TIMEOUT;
        var urlProp = type === 'style' ? 'href' : 'src';

        return new Promise(function (resolve, reject) {
            var index = 0;

            function attempt() {
                if (index >= sources.length) {
                    reject(new Error('ResourceFallback: all sources failed for ' + (config.name || type) + '.'));
                    return;
                }

                var url = sources[index++];
                var element = type === 'style' ? doc.createElement('link') : doc.createElement('script');

                if (type === 'style') {
                    element.rel = element.rel || 'stylesheet';
                }

                applyAttributes(element, config.attributes, urlProp);

                if (type !== 'style' && !('async' in element) && !(config.attributes && ('async' in config.attributes || 'defer' in config.attributes))) {
                    element.defer = true;
                }

                var hasFinished = false;
                var timeoutId = null;

                function cleanup() {
                    if (hasFinished) {
                        return;
                    }
                    hasFinished = true;
                    element.removeEventListener('load', handleLoad);
                    element.removeEventListener('error', handleError);
                    if (timeoutId !== null) {
                        global.clearTimeout(timeoutId);
                    }
                }

                function handleLoad() {
                    cleanup();
                    if (global.console && typeof global.console.log === 'function') {
                        try {
                            var resolvedUrl = new URL(url, (global.location && global.location.href) || doc.baseURI || doc.URL);
                            var currentOrigin = global.location ? global.location.origin : resolvedUrl.origin;
                            var locationType = resolvedUrl.origin === currentOrigin ? 'local' : 'CDN';
                            global.console.log('ResourceFallback: loaded ' + (config.name || type) + ' from ' + locationType + ' source (' + resolvedUrl.href + ').');
                        } catch (e) {
                            global.console.log('ResourceFallback: loaded ' + (config.name || type) + ' from ' + url + '.');
                        }
                    }
                    resolve({ url: url, element: element });
                }

                function handleError() {
                    cleanup();
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                    if (global.console && typeof global.console.warn === 'function') {
                        global.console.warn('ResourceFallback: failed to load ' + url + ', trying next source.');
                    }
                    attempt();
                }

                element.addEventListener('load', handleLoad);
                element.addEventListener('error', handleError);

                if (timeout > 0) {
                    timeoutId = global.setTimeout(function () {
                        handleError();
                    }, timeout);
                }

                element[urlProp] = url;
                target.appendChild(element);
            }

            attempt();
        });
    }

    function loadScript(config) {
        var options = config || {};
        options.type = 'script';
        return load(options);
    }

    function loadStyle(config) {
        var options = config || {};
        options.type = 'style';
        return load(options);
    }

    global.ResourceFallback = {
        load: load,
        loadScript: loadScript,
        loadStyle: loadStyle
    };
})(typeof window !== 'undefined' ? window : null);
