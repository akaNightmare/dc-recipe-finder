import { Provider } from '@angular/core';
import { from, InMemoryCache } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';

import { environment } from '../environments/environment';
import possibleTypes from './possible-types.json';

const basic = setContext(() => ({
    headers: {
        Accept: 'charset=utf-8',
    },
}));

const authLink = setContext(() => {
    const token = localStorage.getItem('accessToken');
    if (token == null) {
        return {};
    } else {
        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }
});

export const provideApollo = (): Provider => [
    {
        provide: APOLLO_OPTIONS,
        useFactory(httpLink: HttpLink) {
            return {
                basic,
                cache: new InMemoryCache({
                    addTypename: true,
                    possibleTypes,
                }),
                link: from([
                    authLink,
                    httpLink.create({
                        uri: `${environment.API_URL}q`,
                    }),
                ]),
                defaultOptions: {
                    watchQuery: {
                        errorPolicy: 'all',
                        notifyOnNetworkStatusChange: true,
                        fetchPolicy: 'cache-and-network',
                    },
                },
            };
        },
        deps: [HttpLink],
    },
    Apollo,
];
