'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "8cb2bb4f3621f3582806a0a0d28c4498",
"assets/assets/fonts/Cabin-Bold.ttf": "f36168da5d6b38f8723fa1f2ccaf288f",
"assets/assets/fonts/Cabin-BoldItalic.ttf": "0a3425148b612cba4487067676cfc22d",
"assets/assets/fonts/Cabin-Italic.ttf": "e198c2de5179d33099b269a3ad91a2f3",
"assets/assets/fonts/Cabin-Medium.ttf": "663f55b214418d4c55b85c6fc32ab18a",
"assets/assets/fonts/Cabin-MediumItalic.ttf": "4df5a5d7eb6526fb3cf8b948af0022af",
"assets/assets/fonts/Cabin-Regular.ttf": "548e005a375c047eb8bd9485508eb58a",
"assets/assets/fonts/Cabin-SemiBold.ttf": "a1d55ab7b51b14040f84b41d67f18ec1",
"assets/assets/fonts/Cabin-SemiBoldItalic.ttf": "e7eacf19fd2cafd9d83327a5e9815483",
"assets/assets/fonts/Genshin.ttf": "217d0ddeedb10cd6cf11b518d0fed192",
"assets/assets/fonts/OpenSans-ExtraBold.ttf": "fb7e3a294cb07a54605a8bb27f0cd528",
"assets/assets/fonts/OpenSans-Regular.ttf": "3ed9575dcc488c3e3a5bd66620bdf5a4",
"assets/assets/images/archaic_petra_flower.png": "1bbf2169879d923325ae69118da9774a",
"assets/assets/images/bloodstained_chivalry_flower.png": "ce102b3a963c6b9fb2ecde27c65fa27e",
"assets/assets/images/gladiators_finale_flower.png": "cf2f1210ba178460be93bd2f73ad5a4f",
"assets/assets/images/lavawalker_flower.png": "a99ca31fa03e8c4aa2307882f939f91c",
"assets/assets/images/maiden_beloved_flower.png": "913e55bdac10fdebd30be55619d82c3e",
"assets/assets/images/noblesse_oblige_flower.png": "807b144568c00b820efaa42729217ad9",
"assets/assets/images/retracing_bolide_flower.png": "1369cc09f03f2e5dbce44094f6b6ac0c",
"assets/assets/images/serpent_spine.png": "cd649c7857ccb7d6e9ab1308a36a9ea4",
"assets/FontManifest.json": "75b37c5b847fc2c09c84acbb78304f00",
"assets/fonts/MaterialIcons-Regular.otf": "132a5e63b5e510933ab4845577716106",
"assets/NOTICES": "40568d9c4eac0c19ab87e7ba6e085832",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"index.html": "363b2ac6cc83507bdc6c4bb4133124f6",
"/": "363b2ac6cc83507bdc6c4bb4133124f6",
"main.dart.js": "f986661054b8798c0d5caa2e7555e648",
"manifest.json": "bcb676496b51638cb2d014b0a9de11da",
"sql-wasm.js": "eea55d481cf4aeb2bc2d7c90eec64a25",
"sql-wasm.wasm": "ea7edc8cc0702b48cc93bf41e5b6cc61",
"version.json": "b480641e679589c8ca847ec4226ddc16"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
