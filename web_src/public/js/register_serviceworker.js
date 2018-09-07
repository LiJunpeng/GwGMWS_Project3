if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('index.js').then(function(registration) {
    console.log("Service Worker registered");
  }).catch(function(err) {
    console.log('Failed to register Service Worker', err);
  });
}