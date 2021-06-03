const notProduction = process.env.NODE_ENV !== 'production';
const plugin = {
  name: '@elderjs/plugin-random',
  description: 'Adds a /random/ page on previewer requests that displays all of the possible routes.',
  init: (plugin) => {},
  routes: {
    pluginRandom: {
      data: () => {},
      template: 'Random.svelte',
      permalink: ({ request, settings }) => {
        if (request.slug && request.realRoute) return `/random/${request.realRoute}/`;
        return `/random/`;
      },
      all: async () => [{ slug: '/random/' }],
    },
  },

  hooks: [
    {
      hook: 'allRequests',
      name: 'addRandomAndDebug',
      description: 'Adds /random/route/ requests to allRequests. Also adds /debug/ to all requests.',
      priority: 50, // default
      run: async ({ helpers, data, settings, request, allRequests, routes, db }) => {
        if (notProduction && settings.server) {
          const randomRequests = Object.keys(routes).reduce(
            (out, route) => [...out, { slug: 'random', realRoute: route, route: 'pluginRandom' }],
            [],
          );
          return {
            allRequests: [...allRequests, ...randomRequests],
          };
        }
      },
    },
    {
      hook: 'request',
      name: 'updateRandomRequestWithRealRequest',
      description: 'Adjusts random requests to go to a real page and route',
      priority: 70, // Higher priority incase other plugins also need to be run on the same request.
      run: ({ settings, request, allRequests, routes }) => {
        if (notProduction && settings.server && request.slug === 'random' && request.route === 'pluginRandom') {
          // filter requests
          const routeRequests = allRequests.filter((r) => r.route === request.realRoute);

          if (routeRequests && routeRequests.length > 0) {
            // choose a random one
            const randomRequest = Math.floor(Math.random() * (routeRequests.length - 1));
            // update the request
            const request = routeRequests.slice(randomRequest, randomRequest + 1)[0];

            const route = routes[request.route];
            return {
              request,
              route,
            };
          }
        }
      },
    },
    {
      hook: 'request',
      name: 'addAllRequestsToDebugDataObject',
      description: 'Adds the allRequests array to the data object for /debug/',
      run: ({ helpers, data, settings, request, allRequests }) => {
        if (notProduction && settings.server && request.slug === 'debug' && request.route === 'debug') {
          return {
            data: Object.assign({}, data, {
              allRequests: [...allRequests],
            }),
          };
        }
      },
    },
  ],
};

module.exports = plugin;
