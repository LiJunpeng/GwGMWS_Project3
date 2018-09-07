const cacheName = 'restaurant_review_cache';
console.log("dsfdsfss");
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll([
        'css/index.css',
        'css/restaurant.css',
        'index.html',
        'restaurant.html',       
        'js/index.js',
        'css/index.css',
        'js/restaurant_info.js',
        'css/restaurant.css'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  console.log("fetch");
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then(function(response) {
      console.log(event.request);
      if (response) {
        return response;
      } else {

      let fetchRequest = event.request.clone();
      return fetch(fetchRequest).then(function(response) {
        let result = response.clone();

        caches.open(cacheName).then(function(cache) {
          cache.put(event.request, result);
        });

        return response;
        });
      }
    })
  );
});


