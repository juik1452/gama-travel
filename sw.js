// GAMA 差旅助手 Service Worker — 網路優先策略
const CACHE_NAME = 'gama-travel-v7';
const CORE_ASSETS = [
  '/gama-travel/',
  '/gama-travel/index.html',
  '/gama-travel/manifest.json',
  '/gama-travel/icon.svg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // 網路優先：先嘗試從網路取最新版，失敗時才用快取（離線模式）
  e.respondWith(
    fetch(e.request).then(function(res) {
      // 成功取得網路回應，同時更新快取
      if (e.request.method === 'GET' && res && res.status === 200) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
      }
      return res;
    }).catch(function() {
      // 網路失敗（離線）時使用快取
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('/gama-travel/index.html');
      });
    })
  );
});
