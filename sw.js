console.log("SW: hola desde el nuevo sw");
const CACHE_STATIC_NAME = 'cache-v2';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const CACHE_INMUTABLE_NAME = 'inmutable-v1';


function cleanCache(cacheName, sizeItems) {
    caches.open(cacheName)
        .then(cache => {
            cache.keys().then(keys => {
                if (keys.length > sizeItems) {
                    cache.delete(keys[0]).then(() => cleanCache(cacheName, sizeItems));
                }
            });
        });
}

/*self.addEventListener('fetch', evt => {
    const response = fetch(evt.request).then(result => {
        if (!result) {
            return caches.match(evt.request)
                .then(cacheResult => {
                    console.log(cacheResult);
                    return cacheResult;
                }).catch(error => {
                    console.log(error);
                    return error;
                });
        }

        caches.open(CACHE_DYNAMIC_NAME).then(cache => {
            cache.put(evt.request, result);
            cleanCache(CACHE_DYNAMIC_NAME, 5);
        });
        return result.clone();
    }).catch(error => {
        console.log("error fetch: " + error)
        caches.match(evt.request)
            .then(cacheResult => {
                console.log(cacheResult);
                return cacheResult;
            }).catch(cacheError => {
            console.log(cacheError);
            return cacheError;
        });
    });
    evt.respondWith(response);
});*/


self.addEventListener('activate', async evt => {
    await caches.keys()
        .then(keys => {
            keys.forEach(key => {
                if (key !== CACHE_STATIC_NAME && key !== CACHE_INMUTABLE_NAME) {
                    return caches.delete(key);
                }
            });
        });
});

self.addEventListener('install', evt => {
    console.log("nuevo uwu");

    //crear cache y almacenar appshell
    const promiseCache = caches.open(CACHE_STATIC_NAME)
        .then(cache => {
            return cache.addAll([
                '/',
                'index.html',
                'css/page.css',
                'img/perrito.png',
                'js/app.js',
                "pages/view-offline.html",
                'img/tortuga.jpg'
            ]);
        });

    const inmutableCache = caches.open(CACHE_INMUTABLE_NAME)
        .then(cache => {
            return cache.addAll([
                'https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css',
            ]);
        });

    evt.waitUntil(Promise.all([promiseCache, inmutableCache]));
});

self.addEventListener('fetch', evt => {
    // EStrategias
    //2. primero busca en cache, en caso de non encontrar va a la red.
    const respuestaCache = caches.match(evt.request)
        .then(value => {
            //si la request existe en cache
            if (value) {
                //respondemos con cache
                return value;
            } else {
                //vas a la red
                return fetch(evt.request).then(resp => {

                    //guardo la respuesta en cache
                    caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                        cache.put(evt.request, resp).then(() => cleanCache(CACHE_DYNAMIC_NAME, 2));
                    });
                    //retorno la respuesta
                    return resp.clone();
                }).catch(error => {
                    console.log("error en fetch");
                    if (evt.request.url.endsWith('.html')){
                        return caches.match('pages/view-offline.html');
                    }

                    if (evt.request.url.endsWith('.png') || evt.request.url.endsWith('.jpg')) {
                        return caches.match('img/tortuga.jpg');
                    }
                });
            }
        });

    evt.respondWith(respuestaCache);

    // 1. Only cache
    //evt.respondWith(caches.match(evt.request));
});
