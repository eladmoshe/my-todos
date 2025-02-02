(()=>{"use strict";var e={295:()=>{try{self["workbox:core:7.2.0"]&&_()}catch(e){}},229:()=>{try{self["workbox:expiration:7.2.0"]&&_()}catch(e){}},740:()=>{try{self["workbox:precaching:7.2.0"]&&_()}catch(e){}},130:()=>{try{self["workbox:routing:7.2.0"]&&_()}catch(e){}},205:()=>{try{self["workbox:strategies:7.2.0"]&&_()}catch(e){}}},t={};function s(n){var r=t[n];if(void 0!==r)return r.exports;var a=t[n]={exports:{}};return e[n](a,a.exports,s),a.exports}s(295);const n=function(e){let t=e;for(var s=arguments.length,n=new Array(s>1?s-1:0),r=1;r<s;r++)n[r-1]=arguments[r];return n.length>0&&(t+=" :: ".concat(JSON.stringify(n))),t};class r extends Error{constructor(e,t){super(n(e,t)),this.name=e,this.details=t}}const a=new Set;const i={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!==typeof registration?registration.scope:""},o=e=>[i.prefix,e,i.suffix].filter((e=>e&&e.length>0)).join("-"),c=e=>e||o(i.precache),h=e=>e||o(i.runtime);function l(e,t){const s=new URL(e);for(const n of t)s.searchParams.delete(n);return s.href}let u;function d(e){e.then((()=>{}))}class f{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const p=e=>new URL(String(e),location.href).href.replace(new RegExp("^".concat(location.origin)),"");function g(e){return new Promise((t=>setTimeout(t,e)))}function y(e,t){const s=t();return e.waitUntil(s),s}async function m(e,t){let s=null;if(e.url){s=new URL(e.url).origin}if(s!==self.location.origin)throw new r("cross-origin-copy-response",{origin:s});const n=e.clone(),a={headers:new Headers(n.headers),status:n.status,statusText:n.statusText},i=t?t(a):a,o=function(){if(void 0===u){const t=new Response("");if("body"in t)try{new Response(t.body),u=!0}catch(e){u=!1}u=!1}return u}()?n.body:await n.blob();return new Response(o,i)}function w(e){return w="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},w(e)}function v(e){var t=function(e,t){if("object"!=w(e)||!e)return e;var s=e[Symbol.toPrimitive];if(void 0!==s){var n=s.call(e,t||"default");if("object"!=w(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(e,"string");return"symbol"==w(t)?t:t+""}function b(e,t,s){return(t=v(t))in e?Object.defineProperty(e,t,{value:s,enumerable:!0,configurable:!0,writable:!0}):e[t]=s,e}function R(e,t){var s=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),s.push.apply(s,n)}return s}function x(e){for(var t=1;t<arguments.length;t++){var s=null!=arguments[t]?arguments[t]:{};t%2?R(Object(s),!0).forEach((function(t){b(e,t,s[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(s)):R(Object(s)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(s,t))}))}return e}let C,E;const L=new WeakMap,D=new WeakMap,q=new WeakMap,U=new WeakMap,T=new WeakMap;let k={get(e,t,s){if(e instanceof IDBTransaction){if("done"===t)return D.get(e);if("objectStoreNames"===t)return e.objectStoreNames||q.get(e);if("store"===t)return s.objectStoreNames[1]?void 0:s.objectStore(s.objectStoreNames[0])}return P(e[t])},set:(e,t,s)=>(e[t]=s,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function N(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(E||(E=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(){for(var t=arguments.length,s=new Array(t),n=0;n<t;n++)s[n]=arguments[n];return e.apply(I(this),s),P(L.get(this))}:function(){for(var t=arguments.length,s=new Array(t),n=0;n<t;n++)s[n]=arguments[n];return P(e.apply(I(this),s))}:function(t){for(var s=arguments.length,n=new Array(s>1?s-1:0),r=1;r<s;r++)n[r-1]=arguments[r];const a=e.call(I(this),t,...n);return q.set(a,t.sort?t.sort():[t]),P(a)}}function O(e){return"function"===typeof e?N(e):(e instanceof IDBTransaction&&function(e){if(D.has(e))return;const t=new Promise(((t,s)=>{const n=()=>{e.removeEventListener("complete",r),e.removeEventListener("error",a),e.removeEventListener("abort",a)},r=()=>{t(),n()},a=()=>{s(e.error||new DOMException("AbortError","AbortError")),n()};e.addEventListener("complete",r),e.addEventListener("error",a),e.addEventListener("abort",a)}));D.set(e,t)}(e),t=e,(C||(C=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some((e=>t instanceof e))?new Proxy(e,k):e);var t}function P(e){if(e instanceof IDBRequest)return function(e){const t=new Promise(((t,s)=>{const n=()=>{e.removeEventListener("success",r),e.removeEventListener("error",a)},r=()=>{t(P(e.result)),n()},a=()=>{s(e.error),n()};e.addEventListener("success",r),e.addEventListener("error",a)}));return t.then((t=>{t instanceof IDBCursor&&L.set(t,e)})).catch((()=>{})),T.set(t,e),t}(e);if(U.has(e))return U.get(e);const t=O(e);return t!==e&&(U.set(e,t),T.set(t,e)),t}const I=e=>T.get(e);const S=["get","getKey","getAll","getAllKeys","count"],K=["put","add","delete","clear"],M=new Map;function A(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!==typeof t)return;if(M.get(t))return M.get(t);const s=t.replace(/FromIndex$/,""),n=t!==s,r=K.includes(s);if(!(s in(n?IDBIndex:IDBObjectStore).prototype)||!r&&!S.includes(s))return;const a=async function(e){const t=this.transaction(e,r?"readwrite":"readonly");let a=t.store;for(var i=arguments.length,o=new Array(i>1?i-1:0),c=1;c<i;c++)o[c-1]=arguments[c];return n&&(a=a.index(o.shift())),(await Promise.all([a[s](...o),r&&t.done]))[0]};return M.set(t,a),a}k=(e=>x(x({},e),{},{get:(t,s,n)=>A(t,s)||e.get(t,s,n),has:(t,s)=>!!A(t,s)||e.has(t,s)}))(k);s(229);const j="cache-entries",W=e=>{const t=new URL(e,location.href);return t.hash="",t.href};class B{constructor(e){this._db=null,this._cacheName=e}_upgradeDb(e){const t=e.createObjectStore(j,{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1})}_upgradeDbAndDeleteOldDbs(e){this._upgradeDb(e),this._cacheName&&function(e){let{blocked:t}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};const s=indexedDB.deleteDatabase(e);t&&s.addEventListener("blocked",(e=>t(e.oldVersion,e))),P(s).then((()=>{}))}(this._cacheName)}async setTimestamp(e,t){const s={url:e=W(e),timestamp:t,cacheName:this._cacheName,id:this._getId(e)},n=(await this.getDb()).transaction(j,"readwrite",{durability:"relaxed"});await n.store.put(s),await n.done}async getTimestamp(e){const t=await this.getDb(),s=await t.get(j,this._getId(e));return null===s||void 0===s?void 0:s.timestamp}async expireEntries(e,t){const s=await this.getDb();let n=await s.transaction(j).store.index("timestamp").openCursor(null,"prev");const r=[];let a=0;for(;n;){const s=n.value;s.cacheName===this._cacheName&&(e&&s.timestamp<e||t&&a>=t?r.push(n.value):a++),n=await n.continue()}const i=[];for(const o of r)await s.delete(j,o.id),i.push(o.url);return i}_getId(e){return this._cacheName+"|"+W(e)}async getDb(){return this._db||(this._db=await function(e,t){let{blocked:s,upgrade:n,blocking:r,terminated:a}=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};const i=indexedDB.open(e,t),o=P(i);return n&&i.addEventListener("upgradeneeded",(e=>{n(P(i.result),e.oldVersion,e.newVersion,P(i.transaction),e)})),s&&i.addEventListener("blocked",(e=>s(e.oldVersion,e.newVersion,e))),o.then((e=>{a&&e.addEventListener("close",(()=>a())),r&&e.addEventListener("versionchange",(e=>r(e.oldVersion,e.newVersion,e)))})).catch((()=>{})),o}("workbox-expiration",1,{upgrade:this._upgradeDbAndDeleteOldDbs.bind(this)})),this._db}}class F{constructor(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._matchOptions=t.matchOptions,this._cacheName=e,this._timestampModel=new B(e)}async expireEntries(){if(this._isRunning)return void(this._rerunRequested=!0);this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-1e3*this._maxAgeSeconds:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const n of t)await s.delete(n,this._matchOptions);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,d(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){const t=await this._timestampModel.getTimestamp(e),s=Date.now()-1e3*this._maxAgeSeconds;return void 0===t||t<s}return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}s(740);function H(e){if(!e)throw new r("add-to-cache-list-unexpected-type",{entry:e});if("string"===typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:t,url:s}=e;if(!s)throw new r("add-to-cache-list-unexpected-type",{entry:e});if(!t){const e=new URL(s,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(s,location.href),a=new URL(s,location.href);return n.searchParams.set("__WB_REVISION__",t),{cacheKey:n.href,url:a.href}}class V{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async e=>{let{request:t,state:s}=e;s&&(s.originalRequest=t)},this.cachedResponseWillBeUsed=async e=>{let{event:t,state:s,cachedResponse:n}=e;if("install"===t.type&&s&&s.originalRequest&&s.originalRequest instanceof Request){const e=s.originalRequest.url;n?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return n}}}class G{constructor(e){let{precacheController:t}=e;this.cacheKeyWillBeUsed=async e=>{let{request:t,params:s}=e;const n=(null===s||void 0===s?void 0:s.cacheKey)||this._precacheController.getCacheKeyForURL(t.url);return n?new Request(n,{headers:t.headers}):t},this._precacheController=t}}s(205);function $(e){return"string"===typeof e?new Request(e):e}class Q{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new f,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const s of this._plugins)this._pluginStateMap.set(s,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:t}=this;let s=$(e);if("navigate"===s.mode&&t instanceof FetchEvent&&t.preloadResponse){const e=await t.preloadResponse;if(e)return e}const n=this.hasCallback("fetchDidFail")?s.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))s=await e({request:s.clone(),event:t})}catch(i){if(i instanceof Error)throw new r("plugin-error-request-will-fetch",{thrownErrorMessage:i.message})}const a=s.clone();try{let e;e=await fetch(s,"navigate"===s.mode?void 0:this._strategy.fetchOptions);for(const s of this.iterateCallbacks("fetchDidSucceed"))e=await s({event:t,request:a,response:e});return e}catch(o){throw n&&await this.runCallbacks("fetchDidFail",{error:o,event:t,originalRequest:n.clone(),request:a.clone()}),o}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=$(e);let s;const{cacheName:n,matchOptions:r}=this._strategy,a=await this.getCacheKey(t,"read"),i=Object.assign(Object.assign({},r),{cacheName:n});s=await caches.match(a,i);for(const o of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await o({cacheName:n,matchOptions:r,cachedResponse:s,request:a,event:this.event})||void 0;return s}async cachePut(e,t){const s=$(e);await g(0);const n=await this.getCacheKey(s,"write");if(!t)throw new r("cache-put-with-no-response",{url:p(n.url)});const i=await this._ensureResponseSafeToCache(t);if(!i)return!1;const{cacheName:o,matchOptions:c}=this._strategy,h=await self.caches.open(o),u=this.hasCallback("cacheDidUpdate"),d=u?await async function(e,t,s,n){const r=l(t.url,s);if(t.url===r)return e.match(t,n);const a=Object.assign(Object.assign({},n),{ignoreSearch:!0}),i=await e.keys(t,a);for(const o of i)if(r===l(o.url,s))return e.match(o,n)}(h,n.clone(),["__WB_REVISION__"],c):null;try{await h.put(n,u?i.clone():i)}catch(f){if(f instanceof Error)throw"QuotaExceededError"===f.name&&await async function(){for(const e of a)await e()}(),f}for(const r of this.iterateCallbacks("cacheDidUpdate"))await r({cacheName:o,oldResponse:d,newResponse:i.clone(),request:n,event:this.event});return!0}async getCacheKey(e,t){const s="".concat(e.url," | ").concat(t);if(!this._cacheKeys[s]){let n=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))n=$(await e({mode:t,request:n,event:this.event,params:this.params}));this._cacheKeys[s]=n}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"===typeof t[e]){const s=this._pluginStateMap.get(t),n=n=>{const r=Object.assign(Object.assign({},n),{state:s});return t[e](r)};yield n}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const n of this.iterateCallbacks("cacheWillUpdate"))if(t=await n({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class J{constructor(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.cacheName=h(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"===typeof e.request?new Request(e.request):e.request,n="params"in e?e.params:void 0,r=new Q(this,{event:t,request:s,params:n}),a=this._getResponse(r,s,t);return[a,this._awaitComplete(a,r,s,t)]}async _getResponse(e,t,s){let n;await e.runCallbacks("handlerWillStart",{event:s,request:t});try{if(n=await this._handle(t,e),!n||"error"===n.type)throw new r("no-response",{url:t.url})}catch(a){if(a instanceof Error)for(const r of e.iterateCallbacks("handlerDidError"))if(n=await r({error:a,event:s,request:t}),n)break;if(!n)throw a}for(const r of e.iterateCallbacks("handlerWillRespond"))n=await r({event:s,request:t,response:n});return n}async _awaitComplete(e,t,s,n){let r,a;try{r=await e}catch(a){}try{await t.runCallbacks("handlerDidRespond",{event:n,request:s,response:r}),await t.doneWaiting()}catch(i){i instanceof Error&&(a=i)}if(await t.runCallbacks("handlerDidComplete",{event:n,request:s,response:r,error:a}),t.destroy(),a)throw a}}class z extends J{constructor(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};e.cacheName=c(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(z.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,t){let s;const n=t.params||{};if(!this._fallbackToNetwork)throw new r("missing-precache-entry",{cacheName:this.cacheName,url:e.url});{0;const r=n.integrity,a=e.integrity,i=!a||a===r;if(s=await t.fetch(new Request(e,{integrity:"no-cors"!==e.mode?a||r:void 0})),r&&i&&"no-cors"!==e.mode){this._useDefaultCacheabilityPluginIfNeeded();await t.cachePut(e,s.clone());0}}return s}async _handleInstall(e,t){this._useDefaultCacheabilityPluginIfNeeded();const s=await t.fetch(e);if(!await t.cachePut(e,s.clone()))throw new r("bad-precaching-response",{url:e.url,status:s.status});return s}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,n]of this.plugins.entries())n!==z.copyRedirectedCacheableResponsesPlugin&&(n===z.defaultPrecacheCacheabilityPlugin&&(e=s),n.cacheWillUpdate&&t++);0===t?this.plugins.push(z.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}z.defaultPrecacheCacheabilityPlugin={async cacheWillUpdate(e){let{response:t}=e;return!t||t.status>=400?null:t}},z.copyRedirectedCacheableResponsesPlugin={async cacheWillUpdate(e){let{response:t}=e;return t.redirected?await m(t):t}};class X{constructor(){let{cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new z({cacheName:c(e),plugins:[...t,new G({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const t=[];for(const s of e){"string"===typeof s?t.push(s):s&&void 0===s.revision&&t.push(s.url);const{cacheKey:e,url:n}=H(s),a="string"!==typeof s&&s.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==e)throw new r("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:e});if("string"!==typeof s&&s.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==s.integrity)throw new r("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(e,s.integrity)}if(this._urlsToCacheKeys.set(n,e),this._urlsToCacheModes.set(n,a),t.length>0){const e="Workbox is precaching URLs without revision "+"info: ".concat(t.join(", "),"\nThis is generally NOT safe. ")+"Learn more at https://bit.ly/wb-precache";console.warn(e)}}}install(e){return y(e,(async()=>{const t=new V;this.strategy.plugins.push(t);for(const[r,a]of this._urlsToCacheKeys){const t=this._cacheKeysToIntegrities.get(a),s=this._urlsToCacheModes.get(r),n=new Request(r,{integrity:t,cache:s,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:a},request:n,event:e}))}const{updatedURLs:s,notUpdatedURLs:n}=t;return{updatedURLs:s,notUpdatedURLs:n}}))}activate(e){return y(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),n=[];for(const r of t)s.has(r.url)||(await e.delete(r),n.push(r.url));return{deletedURLs:n}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this.strategy.cacheName)).match(s)}}createHandlerBoundToURL(e){const t=this.getCacheKeyForURL(e);if(!t)throw new r("non-precached-url",{url:e});return s=>(s.request=new Request(e),s.params=Object.assign({cacheKey:t},s.params),this.strategy.handle(s))}}let Y;const Z=()=>(Y||(Y=new X),Y);s(130);const ee=e=>e&&"object"===typeof e?e:{handle:e};class te{constructor(e,t){let s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"GET";this.handler=ee(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=ee(e)}}class se extends te{constructor(e,t,s){super((t=>{let{url:s}=t;const n=e.exec(s.href);if(n&&(s.origin===location.origin||0===n.index))return n.slice(1)}),t,s)}}class ne{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data;0;const s=Promise.all(t.urlsToCache.map((t=>{"string"===typeof t&&(t=[t]);const s=new Request(...t);return this.handleRequest({request:s,event:e})})));e.waitUntil(s),e.ports&&e.ports[0]&&s.then((()=>e.ports[0].postMessage(!0)))}}))}handleRequest(e){let{request:t,event:s}=e;const n=new URL(t.url,location.href);if(!n.protocol.startsWith("http"))return void 0;const r=n.origin===location.origin,{params:a,route:i}=this.findMatchingRoute({event:s,request:t,sameOrigin:r,url:n});let o=i&&i.handler;const c=t.method;if(!o&&this._defaultHandlerMap.has(c)&&(o=this._defaultHandlerMap.get(c)),!o)return void 0;let h;try{h=o.handle({url:n,request:t,event:s,params:a})}catch(u){h=Promise.reject(u)}const l=i&&i.catchHandler;return h instanceof Promise&&(this._catchHandler||l)&&(h=h.catch((async e=>{if(l){0;try{return await l.handle({url:n,request:t,event:s,params:a})}catch(r){r instanceof Error&&(e=r)}}if(this._catchHandler)return this._catchHandler.handle({url:n,request:t,event:s});throw e}))),h}findMatchingRoute(e){let{url:t,sameOrigin:s,request:n,event:r}=e;const a=this._routes.get(n.method)||[];for(const i of a){let e;const a=i.match({url:t,sameOrigin:s,request:n,event:r});if(a)return e=a,(Array.isArray(e)&&0===e.length||a.constructor===Object&&0===Object.keys(a).length||"boolean"===typeof a)&&(e=void 0),{route:i,params:e}}return{}}setDefaultHandler(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"GET";this._defaultHandlerMap.set(t,ee(e))}setCatchHandler(e){this._catchHandler=ee(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new r("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(!(t>-1))throw new r("unregister-route-route-not-registered");this._routes.get(e.method).splice(t,1)}}let re;const ae=()=>(re||(re=new ne,re.addFetchListener(),re.addCacheListener()),re);function ie(e,t,s){let n;if("string"===typeof e){const r=new URL(e,location.href);0;n=new te((e=>{let{url:t}=e;return t.href===r.href}),t,s)}else if(e instanceof RegExp)n=new se(e,t,s);else if("function"===typeof e)n=new te(e,t,s);else{if(!(e instanceof te))throw new r("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});n=e}return ae().registerRoute(n),n}class oe extends te{constructor(e,t){super((s=>{let{request:n}=s;const r=e.getURLsToCacheKeys();for(const a of function(e){let{ignoreURLParametersMatching:t=[/^utm_/,/^fbclid$/],directoryIndex:s="index.html",cleanURLs:n=!0,urlManipulation:r}=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return function*(){const a=new URL(e,location.href);a.hash="",yield a.href;const i=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[];for(const s of[...e.searchParams.keys()])t.some((e=>e.test(s)))&&e.searchParams.delete(s);return e}(a,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(n){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(r){const e=r({url:a});for(const t of e)yield t.href}}()}(n.url,t)){const t=r.get(a);if(t){return{cacheKey:t,integrity:e.getIntegrityForCacheKey(t)}}}}),e.strategy)}}const ce={cacheWillUpdate:async e=>{let{response:t}=e;return 200===t.status||0===t.status?t:null}};var he;self.addEventListener("activate",(()=>self.clients.claim())),function(e){Z().precache(e)}([{'revision':'d008d67ecf66bc5bb44e47088e56c684','url':'/my-todos/index.html'},{'revision':null,'url':'/my-todos/static/css/main.481b679c.css'},{'revision':null,'url':'/my-todos/static/js/952.e51a41af.chunk.js'},{'revision':null,'url':'/my-todos/static/js/main.6d805b57.js'}]),function(e){const t=Z();ie(new oe(t,e))}(he);const le=new RegExp("/[^/?]+\\.[^/]+$");var ue;ie((e=>{let{request:t,url:s}=e;return"navigate"===t.mode&&(!s.pathname.startsWith("/_")&&!s.pathname.match(le))}),(ue="/my-todos/index.html",Z().createHandlerBoundToURL(ue))),ie((e=>{let{url:t}=e;return t.origin===self.location.origin&&t.pathname.endsWith(".png")}),new class extends J{constructor(){super(arguments.length>0&&void 0!==arguments[0]?arguments[0]:{}),this.plugins.some((e=>"cacheWillUpdate"in e))||this.plugins.unshift(ce)}async _handle(e,t){const s=t.fetchAndCachePut(e).catch((()=>{}));t.waitUntil(s);let n,a=await t.cacheMatch(e);if(a)0;else{0;try{a=await s}catch(i){i instanceof Error&&(n=i)}}if(!a)throw new r("no-response",{url:e.url,error:n});return a}}({cacheName:"images",plugins:[new class{constructor(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.cachedResponseWillBeUsed=async e=>{let{event:t,request:s,cacheName:n,cachedResponse:r}=e;if(!r)return null;const a=this._isResponseDateFresh(r),i=this._getCacheExpiration(n);d(i.expireEntries());const o=i.updateTimestamp(s.url);if(t)try{t.waitUntil(o)}catch(c){0}return a?r:null},this.cacheDidUpdate=async e=>{let{cacheName:t,request:s}=e;const n=this._getCacheExpiration(t);await n.updateTimestamp(s.url),await n.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&function(e){a.add(e)}((()=>this.deleteCacheAndMetadata()))}_getCacheExpiration(e){if(e===h())throw new r("expire-custom-caches-only");let t=this._cacheExpirations.get(e);return t||(t=new F(e,this._config),this._cacheExpirations.set(e,t)),t}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const t=this._getDateHeaderTimestamp(e);if(null===t)return!0;return t>=Date.now()-1e3*this._maxAgeSeconds}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const t=e.headers.get("date"),s=new Date(t).getTime();return isNaN(s)?null:s}async deleteCacheAndMetadata(){for(const[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}({maxEntries:50})]})),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()}))})();
//# sourceMappingURL=service-worker.js.map